//require dotenv
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const Wordpress = require("./Wordpress");
const Blogger = require("./Blogger");
const { LongTailResearcher } = require("./LongTailResearcher");
const BlogDB = require("../mongo/blog");
const DemoBlogDB = require("../mongo/demoBlog");;

class Agent {
  constructor(openaiKey, sendData, jwt, blogID, subject, config, version, loops, daysLeft, blogMongoID, demo = false, uid = null) {
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
          const outline = await this.researcher.getNextBlueprint();
          if (!outline) {
            await this.sendData({ type: "ending", config: "Ran out of keywords" });
            return;
          }
          const blogSite = this.version === "blogger" ? 
          new Blogger(this.config, outline, this.jwt, this.blogID, this.sendData, this.openaiKey, this.loops, this.summaries, i) : 
          new Wordpress(this.config, outline, this.jwt, this.blogID, this.sendData, this.openaiKey, this.loops, this.summaries, i);

          var result = await blogSite.run();
          this.summaries.push({summary: outline.headers, url: result.url});          
          await this.sendData({...result, type: 'success', config: outline.headers});
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

}

module.exports = { Agent };
