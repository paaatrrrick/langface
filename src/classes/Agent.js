//require dotenv
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const Wordpress = require("./Wordpress");
const Blogger = require("./Blogger");
const {Researcher} = require("./Researcher");
const { LongTailResearcher } = require("./LongTailResearcher");
const BlogDB = require("../mongo/blog");
const User = require("../mongo/user");
const { StructuredOutputParser } = require("langchain/output_parsers");
const { ChatOpenAI } = require("langchain/chat_models/openai");
const { HumanChatMessage } = require("langchain/schema");
const { PromptTemplate } = require("langchain/prompts");

class Agent {
  constructor(openAIKey, sendData, jwt, blogID, subject, config, version, loops, daysLeft, blogMongoID, uid = null) {
    // AGENT
    this.uid = uid;
    this.openAIKey = openAIKey ? openAIKey : process.env.OPENAI_API_KEY;
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
    // this.researcher = new Researcher(blogSubject, this.openAIKey);
    this.researcher = new LongTailResearcher(subject, loops, config, this.openAIKey);
  }

  getBlogState() {
    return {
      uid: this.uid || "",
      jwt: this.jwt,
      blogID: this.blogID,
      subject: this.subject,
      config: this.config,
      version: this.version,
      loops: this.loops,
      daysLeft: this.daysLeft,
      summaries: this.summaries,
      blogOutlines: this.blogOutlines,
    }
  }

  run = async () => {
      var errors = 0;
      for (let i = 0; i < this.loops; i++) {
        try {
          console.log('trying to run here');
          const {remainingPosts, dailyPostCount} = await BlogDB.checkRemainingPosts(this.blogMongoID);
          if (remainingPosts <= 0) {
            await this.sendData({ type: "ending", content: "Ending: You have reached your daily post limit", remainingPosts, dailyPostCount });
            return;
          }
          await this.sendData({ type: "updating", content: `Step 1 of 3: Finding best longtail keywords`, title: `Loading... Article ${i + 1} / ${this.loops}` });
          const outline = await this.researcher.getNextBlueprint();
          if (!outline) {
            await this.sendData({ type: "ending", content: "Ran out of keywords", remainingPosts, dailyPostCount });
            return;
          }
          const blogSite = this.version === "blogger" ? 
          new Blogger(this.config, outline, this.jwt, this.blogID, this.sendData, this.openAIKey, this.loops, this.summaries, i) : 
          new Wordpress(this.config, outline, this.jwt, this.blogID, this.sendData, this.openAIKey, this.loops, this.summaries, i);

          var result = await blogSite.run();
          this.summaries.push({summary: outline.headers, url: result.url});          
          // const blog = await Blog.getBlog(this.blogID, this.version);
          // let addedBlog = await User.addBlog('12345', blog);
          // console.log(addedBlog);
          // addedBlog = await User.addBlog('12345', blog);.
          // console.log(addedBlog);
          // const blogs = await User.getBlogs('12345');
          // console.log(blogs);

          const postsLeftData = await BlogDB.getPostsLeftToday(this.blogMongoID);

          await this.sendData({...result, ...postsLeftData, type: 'success', content: outline.headers});
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
      // store blog so we can do: rate limits, daily runs, long term looking UI 
      // const blog = await BlogDB.createNewBlog(this.getBlogState());
      // attach blog to user, so we can tell the frontend what to display
  };
}

module.exports = { Agent };
