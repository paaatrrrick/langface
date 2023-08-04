if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}
const Wordpress = require("./BlogSites/Wordpress");
const Blogger = require("./BlogSites/Blogger");
const Html = require("./BlogSites/Html");
const { LongTailResearcher } = require("./LongTailResearcher");
const AgentDB = require("../mongo/agent");
const DemoAgentDB = require("../mongo/demoAgent");;
const PostDB = require("../mongo/post");

class Agent {
    constructor(sendData, jwt, blogID, businessData, version, loops, daysLeft, blogMongoID, demo = false, uid = null, draft = false, nextPostIndex, BFSOrderedArrayOfPostMongoID, includeAIImages, totalPostsToMake) { // AGENT
        this.demo = demo;
        this.AgentDB = demo ? DemoAgentDB : AgentDB;
        this.uid = uid;
        this.openaiKey = process.env.OPENAI_API_KEY;
        this.sendData = sendData;

        // BLOG
        this.jwt = jwt;
        this.blogID = blogID;
        this.blogMongoID = blogMongoID;
        this.subject = businessData?.name;
        this.config = businessData?.product;
        this.version = version;
        this.loops = loops;
        this.daysLeft = daysLeft;
        this.summaries = [];
        this.BFSOrderedArrayOfPostMongoID = BFSOrderedArrayOfPostMongoID;
        this.nextPostIndex = nextPostIndex;
        this.draft = draft;
        this.businessData = businessData;
        this.includeAIImages = includeAIImages;
        this.totalPostsToMake = totalPostsToMake;        
        // TOOLS
        this.researcher = new LongTailResearcher(businessData?.name, this.totalPostsToMake, businessData?.product, this.openaiKey, this.blogMongoID, this.BFSOrderedArrayOfPostMongoID, this.demo, this.businessData);
    }

    run = async () => {
        try {
            if (this.demo) return await this.demoRun();
            return await this.proRun();
        } catch (e) {
            console.log('error from agent big');
            console.log(e);
        }
    };

    //    For NextIndex in BFSOrderedArrayOfPostMongoIDs:
    //    if reached amount user wanted per day, then update NextIndex in DB and break
    //    generate + post (prompt should include outlines of children post and fake links guidance)
    //    update rawHTML + url in DB
    //    done if top post, else:
    //    update parent rawHTML (switch out fake internal links) using parent ID
    proRun = async () => {
        await this.AgentDB.setHasStarted(this.blogMongoID, true);
        var errors = 0;
        if (this.nextPostIndex == 0) {
            await this.sendData({ type: "updating", config: `Building out a SEO sitemap for your posts (this usually takes a bit)`, title: `Loading... Researcher` });
            await this.researcher.generatePostsTree();
        }
        const min = parseInt(this.nextPostIndex)
        const max = this.nextPostIndex + parseInt(this.loops)
        for (let i = min; i < max; i++) {
            try {
                await this.sendData({ type: "updating", config: `Step 1 of 3: Finding best longtail keywords`, title: `Loading... Article ${i + 1} / ${this.totalPostsToMake}` });
                const post = await PostDB.getPostById(this.BFSOrderedArrayOfPostMongoID[i]);
                if (!post?.blueprint?.keyword) {
                    await this.sendData({ type: "ending", config: "Ran out of keywords" });
                    return;
                }
                const blueprint = await this.researcher.generateBlueprint(post.blueprint.keyword, post);
                if (!blueprint) {
                    await this.sendData({ type: "ending", config: "Ran out of keywords" });
                    return;
                }
                const BlogAgent = this.version === "blogger" ? Blogger : this.version === "html" ? Html : Wordpress;
                const blogSite = new BlogAgent(
                    blueprint, this.jwt, this.blogID, this.sendData, 
                    this.totalPostsToMake, this.summaries, i, 
                    this.draft, this.BFSOrderedArrayOfPostMongoID[i], this.demo, 
                    this.businessData, this.version, this.includeAIImages
                );
                var result = await blogSite.run();
                this.summaries.push({summary: blueprint.headers, url: result.url});
                await this.sendData({... result, type: 'success', config: blueprint?.headers || ''});
            } catch (e) {
                errors++;
                if (errors >= 5) {
                    await this.sendData({type: "ending", title: "Too many errors, stopping process"});
                    return;
                }
                console.log('error from loops in pro')
                console.log(e);
                await this.sendData({type: "error", title: `Error: ${e.message}`});
            }
        }
        const titleEnding = this.daysLeft > 1 ? `Process Complete. Click run to continue through another loop.` : `Process Complete.`;
        const titleTree = this.daysLeft > 1 ? `Temporary sitemap of your posts` : `Sitemap of your posts`;
        await this.sendData({type: "ending", title: titleEnding});
        const tree = await this.AgentDB.getTree(this.blogMongoID);
        if (tree) await this.sendData({type: "tree", tree: tree, title: titleTree});
        return;
    }

    demoRun = async() => {
      var errors = 0;
      for (let i = 0; i < this.totalPostsToMake; i++) {
        try {
        const { postsLeftToday } = await this.AgentDB.checkRemainingPosts(this.blogMongoID);
        if (postsLeftToday <= 0) {
            await this.sendData({ type: "ending", config: "You've run out of posts today. Hire to pro agent to write more.", action: "buyNow" });
            return;
        }
        await this.sendData({ type: "updating", config: `Step 1 of 3: Finding best longtail keywords`, title: `Loading... Article ${i + 1} / ${this.totalPostsToMake}` });
        var blueprint = await this.researcher.getNextBlueprint();
        if (!blueprint) {
            await this.sendData({ type: "ending", config: "Ran out of keywords" });
            return;
        }
        const BlogAgent = this.version === "blogger" ? Blogger : this.version === "html" ? Html : Wordpress;
        const blogSite = new BlogAgent(blueprint, this.jwt, this.blogID, this.sendData, this.totalPostsToMake, this.summaries, i, this.draft, undefined, this.demo, this.businessData, this.version, this.includeAIImages);
        var result = await blogSite.run();
        this.summaries.push({summary: blueprint.headers, url: result.url});
        await this.sendData({... result, type: 'success', config: blueprint.headers});
    } catch (e) {
        errors++;
        if (errors >= 3) {
            await this.sendData({type: "ending", title: "Too many errors, stopping process"});
            return;
        }
        console.log('error from loops in demo')
        console.log(e);
        await this.sendData({type: "error", title: e.message});
        }
    }
    try {
        const { postsLeftToday } = await this.AgentDB.checkRemainingPosts(this.blogMongoID);
        if (postsLeftToday <= 0) {
            await this.sendData({ type: "ending", config: "Process Complete. Hire to pro agent to write more posts today.", action: "buyNow" });
            return;
        } else {
            await this.sendData({type: "ending", title: "Process Complete."});
        }
    } catch (e) {
        await this.sendData({type: "ending", title: "Process Complete."});
    }
    return;
  } 
    // postToPincecone = async (id, blueprint) => {
    //     return;
    //     const pinecone = new PineconeClient();
    //     await pinecone.init({environment: process.env.PINECONE_ENV, apiKey: process.env.PINECONE_KEY});

    //     const index = pinecone.Index(this.blogMongoID);

    //     const upsertResponse = await index.upsert({
    //         upsertRequest: {
    //             vectors: [
    //                 {
    //                     id: id,
    //                     values: [blueprint.blogTitle, blueprint.lsiKeywords, blueprint.keyword, blueprint.headers]
    //                 },
    //             ]
    //         }
    //     });
    // }

    // isUnique = async (blueprint) => {
    //     return true;

    //     const pinecone = new PineconeClient();
    //     await pinecone.init({environment: process.env.PINECONE_ENV, apiKey: process.env.PINECONE_KEY});

    //     var indexList = await pinecone.listIndexes()

    //     // probably doesn't do what i want: check if index exists, if not then make it
    //     if (! pinecone.Index(this.blogMongoID)) {
    //         await pinecone.createIndex({
    //             createRequest: {
    //                 name: this.blogMongoID,
    //                 dimension: 768,
    //                 metric: "dotproduct"
    //             }
    //         });
    //     }

    //     const index = pinecone.Index(this.blogMongoID);

    //     // while not ready, wait
    //     while (!(await pinecone.describeIndex({indexName: this.blogMongoID}).ready)) {}

    //     const queryResponse = await index.query({
    //         queryRequest: {
    //             vector: [
    //                 blueprint.blogTitle, blueprint.lsiKeywords, blueprint.keyword, blueprint.headers
    //             ],
    //             topK: 1
    //         }
    //     });

    //     if (! queryResponse.matches[0] || (Math.abs(queryResponse.matches[0].score)) > 0) {
    //         return true;
    //     }
    //     return false;
    // }
}

module.exports = {
    Agent
};


// Uniqueness, issue for when move away from 450 outlines.
// var rewriteAttempts = 0;
// while (!this.isUnique(blueprint) && (rewriteAttempts < 3)){
//     blueprint = await this.researcher.rewriteBlueprint(blueprint);
//     if (!blueprint) { 
//     await this.sendData({type:"ending", config:"ran out of keywords"}); 
//     return;
//     }
//     rewriteAttempts++;
// }
// await this.postToPincecone(i, blueprint);