//require dotenv
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const Wordpress = require("./Wordpress");
const Blogger = require("./Blogger");
const {Researcher} = require("./Researcher");
const { LongTailResearcher } = require("./LongTailResearcher");
const Blog = require("../mongo/blog");
const User = require("../mongo/user");
const { StructuredOutputParser } = require("langchain/output_parsers");
const { ChatOpenAI } = require("langchain/chat_models/openai");
const { HumanChatMessage } = require("langchain/schema");
const { PromptTemplate } = require("langchain/prompts");

class Agent {
  constructor(jwt = undefined, blogID, content, loops, openAIKey, version, blogSubject, sendData) {
    this.jwt = jwt;
    this.blogID = blogID;
    this.content = content;
    this.loops = loops;
    this.sendData = sendData;
    this.summaryVectorStoreLength = 0;
    this.openAIKey = openAIKey ? openAIKey : process.env.OPENAI_API_KEY;
    this.version = version;
    this.blogSubject = blogSubject;
    this.blogOutlines = [];
    this.summaries = [];
    // this.researcher = new Researcher(blogSubject, this.openAIKey);
    this.researcher = new LongTailResearcher(blogSubject, loops, content, this.openAIKey);
  }

  run = async () => {
      var errors = 0;
      // store blog
      const blog = await Blog.createNewBlog(this.blogID, this.version, this);
      // update user if the user is logged in, otherwise, just run the agent
      if (this.jwt){
        const user = await User.addBlog(this.jwt, blog);
      }
      for (let i = 0; i < this.loops; i++) {
        try {
          const {remainingPosts, dailyPostCount} = await Blog.checkRemainingPosts(this.blogID, this.version);
          if (remainingPosts <= 0) {
            this.sendData({ type: "ending", content: "Ending: You have reached your daily post limit", remainingPosts, dailyPostCount });
            return;
          }
          this.sendData({ type: "updating", content: `Step 1 of 3: Finding best longtail keywords`, title: `Loading... Article ${i + 1} / ${this.loops}` });
          const outline = await this.researcher.getNextBlueprint();
          if (!outline) {
            this.sendData({ type: "ending", content: "Ran out of keywords", remainingPosts, dailyPostCount });
            return;
          }
          const blogSite = this.version === "blogger" ? 
          new Blogger(this.content, outline, this.jwt, this.blogID, this.sendData, this.openAIKey, this.loops, this.summaries, i) : 
          new Wordpress(this.content, outline, this.jwt, this.blogID, this.sendData, this.openAIKey, this.loops, this.summaries, i);

          var result = await blogSite.run();
          this.summaries.push({summary: outline.blogStrucutre, url: result.url});
          const postData = await Blog.addPost(this.blogID, this.version, result.url);
          
          // const blog = await Blog.getBlog(this.blogID, this.version);
          // let addedBlog = await User.addBlog('12345', blog);
          // console.log(addedBlog);
          // addedBlog = await User.addBlog('12345', blog);
          // console.log(addedBlog);
          // const blogs = await User.getBlogs('12345');
          // console.log(blogs);

          this.sendData({...result, ...postData, type: 'success'});
        } catch (e) {
          errors++;
          if (errors >= 5) {
            this.sendData({ type: "ending", title: "Too many errors, stopping process" });
            return;
          }
          console.log('error from loops')
          console.log(e);
          this.sendData({ type: "error", title:  e.message });
        }
      }
      this.sendData({ type: "ending", title: "Process Complete" });
  };
}

module.exports = { Agent };
