//require dotenv
// @ts-nocheck
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const Wordpress = require("./Wordpress");
const Blogger = require("./Blogger");
const Html = require("./Html");
const { LongTailResearcher } = require("./LongTailResearcher");
const BlogDB = require("../mongo/blog");
const DemoBlogDB = require("../mongo/demoBlog");;
const { PineconeClient } = require("@pinecone-database/pinecone");
const { WeaviateStore } = require ("langchain/vectorstores/weaviate");
const { OpenAIEmbeddings } = require("langchain/embeddings/openai");
const weaviate = require('weaviate-ts-client');

class Agent {
  constructor(openaiKey, sendData, jwt, blogID, subject, config, version, loops, daysLeft, blogMongoID, demo = false, uid = null, draft=false) {
    // AGENT
    this.demo = demo;
    this.AgentDB = demo ? DemoBlogDB : BlogDB;
    this.uid = uid;
    this.openaiKey = openaiKey ? openaiKey : process.env.OPENAI_API_KEY;
    this.sendData = sendData;

    // BLOG
    this.jwt = jwt;
    this.blogID = blogID;
    this.blogMongoID = blogMongoID;
    this.subject = subject;
    this.config = config;
    this.version = version;
    this.loops = loops;
    this.daysLeft = daysLeft;
    this.summaries = [];    
    this.blogOutlines = [];
    this.draft = draft;
    
    // TOOLS
    // this.researcher = new Researcher(subject, this.openaiKey);
    this.researcher = new LongTailResearcher(subject, loops, config, this.openaiKey);
  }

  run = async () => {
    try {
      if (!this.demo) await this.AgentDB.setHasStarted(this.blogMongoID, true);
      var errors = 0;
      for (let i = 0; i < this.loops; i++) {
        try {
          const { postsLeftToday } = await this.AgentDB.checkRemainingPosts(this.blogMongoID);
          if (postsLeftToday <= 0) {
            await this.sendData({ type: "ending", config: "Ending: You have reached your daily post limit" });
            return;
          }
          await this.sendData({ type: "updating", config: `Step 1 of 3: Finding best longtail keywords`, title: `Loading... Article ${i + 1} / ${this.loops}` });
          var blueprint = await this.researcher.getNextBlueprint();
          if (!blueprint) {
            await this.sendData({ type: "ending", config: "Ran out of keywords" });
            return;
          }
          
          var rewriteAttempts = 0;
          while (!this.isUnique(blueprint) && (rewriteAttempts < 3)){
            blueprint = await this.researcher.rewriteBlueprint(blueprint);
            if (!blueprint) { 
              await this.sendData({type:"ending", config:"ran out of keywords"}); 
              return;
            }
            rewriteAttempts++;
          }
          await this.postToPincecone(i, blueprint);
          
          const BlogAgent = this.version === "blogger" ? Blogger : this.version === "html" ? Html : Wordpress;
          const blogSite = BlogAgent(this.config, blueprint, this.jwt, this.blogID, this.sendData, this.openaiKey, this.loops, this.summaries, i, draft);

          var result = await blogSite.run();
          this.summaries.push({summary: blueprint.headers, url: result.url});          
          await this.sendData({...result, type: 'success', config: blueprint.headers});
        } catch (e) {
          errors++;
          if (errors >= 5) {
            await this.sendData({ type: "ending", title: "Too many errors, stopping process" });
            return;
          }
          console.log('error from loops')
          console.log(e);
          await this.sendData({ type: "error", title:  e.message });
        }
      }
      if (this.daysLeft > 0){
        await this.sendData({ type: "ending", title: "Process Complete. Next run scheduled for tomorrow." }); 
      }
      else {
        await this.sendData({ type: "ending", title: "Process Complete." });
      }
    } catch (e) {
      console.log('error from agent')
      console.log(e);
    }
  };


  postToPincecone = async (id, blueprint) => {
    return;
    const pinecone = new PineconeClient();
    await pinecone.init({
	    environment: process.env.PINECONE_ENV,
	    apiKey: process.env.PINECONE_KEY,
    });

    const index = pinecone.Index(this.blogMongoID);

    const upsertResponse = await index.upsert({
      upsertRequest: {
        vectors: [
          {
            id: id,
            values: [blueprint.blogTitle, blueprint.lsiKeywords, blueprint.keyword, blueprint.headers],
          },
      ],
    }
    });
  }

  isUnique = async (blueprint) => {
    return true; 

    const pinecone = new PineconeClient();
    await pinecone.init({
	    environment: process.env.PINECONE_ENV,
	    apiKey: process.env.PINECONE_KEY,
    });

    var indexList = await pinecone.listIndexes()

    // probably doesn't do what i want: check if index exists, if not then make it
    if (!pinecone.Index(this.blogMongoID)){     
      await pinecone.createIndex({
        createRequest: {
          name: this.blogMongoID,
          dimension: 768,
          metric: "dotproduct"
        },
      });
    }

    const index = pinecone.Index(this.blogMongoID);

    // while not ready, wait
    while (!(await pinecone.describeIndex({indexName: this.blogMongoID}).ready)){

    }

    const queryResponse = await index.query({
      queryRequest: {
        vector: [blueprint.blogTitle, blueprint.lsiKeywords, blueprint.keyword, blueprint.headers],
        topK: 1,
      },
    });

    if(!queryResponse.matches[0] || (Math.abs(queryResponse.matches[0].score)) > 0){
      return true;
    }
    return false;
  }
}

module.exports = { Agent };
