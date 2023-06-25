//require dotenv
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const Wordpress = require("./Wordpress");
const Blogger = require("./Blogger");
const {Researcher} = require("./Researcher");

class Agent {
  constructor(jwt, blogID, content, loops, openAIKey, version, blogSubject, sendData) {
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
    this.researcher = new Researcher(blogSubject, this.openAIKey);
  }

  run = async () => {
      for (let i = 0; i < this.loops; i++) {
        try {
          this.sendData({ type: "updating", content: `Step 1 of 3: Conducting market research`, title: `Loading... Article ${i + 1} / ${this.loops}` });
          const outline = await this.researcher.getModelURLs();

          const blogSite = this.version === "blogger" ? 
          new Blogger(this.content, outline, this.jwt, this.blogID, this.sendData, this.openAIKey, this.loops, this.summaries, i) : 
          new Wordpress(this.content, outline, this.jwt, this.blogID, this.sendData, this.openAIKey, this.loops, this.summaries, i);

          var result = await blogSite.run();
          this.summaries.push({summary: outline.blogStrucutre, url: result.url});
          this.sendData({...result, type: 'success'});
        } catch (e) {
          console.log('error from loops')
          console.log(e);
          this.sendData({ type: "error", content:  e.message });
        }
      }
      this.sendData({ type: "ending", content: "Process Complete" });
  };


}

module.exports = { Agent };
