//require dotenv
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const { ChatOpenAI } = require("langchain/chat_models/openai");
const { HumanChatMessage, SystemChatMessage, AIChatMessage } = require("langchain/schema");
const Photos = require("./Photos");
const {Researcher} = require("./Researcher");
const { dummyblog } = require("../constants/dummyData");
const { blogPost, SystemChatMessageForBlog } = require("../constants/prompts");
const { postToWordpress, postToBlogger } = require("../utils/api");

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
    this.blogOutlines = [];
    this.summaries = [];
    this.blogSubject = blogSubject;
    this.imageNames = ["image1.png", "image2.png"];
    this.researcher = new Researcher(blogSubject, this.openAIKey);

  }

  run = async () => {
    try {
      var errorCount = 0;
      for (let i = 0; i < this.loops; i++) {
        try {
          this.sendData({ type: "updating", content: `Step 1 of 3: Conducting market research`, title: `Loading... Article ${i + 1} / ${this.loops}` });
          const outline = await this.researcher.getModelURLs();
          this.sendData({ type: "updating", content: `Step 2 of 3: Writing the article`, title: `Loading... Article ${i + 1} / ${this.loops}` });
          const post = await this.writePost(outline);
          if (this.version === "blogger") {
            const result = await postToBlogger(post, outline.similarTitles, this.blogID, this.jwt);
            this.sendData(result);
          } else {
            this.sendData({ type: "updating", content: `Step 3 of 3: Generating images`, title: `Loading... Article ${i + 1} / ${this.loops}`});
            const photosObject = new Photos(post, this.openAIKey, this.blogID, this.jwt, this.imageNames);
            const imageUrls = await photosObject.run();
            const result = await postToWordpress(post, outline.similarTitles, imageUrls, this.imageNames, this.blogID, this.jwt);
            this.summaries.push({summary: outline.blogStrucutre, url: result.url});
            this.sendData(result)
          }
        } catch (e) {
          console.log('error from loops')
          console.log(e);
          errorCount += 1;
          if (errorCount > 5) {
            this.sendData({ type: "ending", content: "Too many errors, stopping process" });
            return;
          }
          this.sendData({ type: "error", content:  e.message });
        }
      }
      this.sendData({ type: "ending", content: "Process Complete" });
    } catch (e) {
      this.sendData({ type: "ending", content: e.message });
    }
  };

  writePost = async (outline) => {
    if (process.env.MOCK_WRITING_BLOG === "true") return dummyblog;
    const messages = [new SystemChatMessage(SystemChatMessageForBlog), new HumanChatMessage(
      blogPost(outline.longTailKeywords, outline.blogStrucutre, outline.tips, outline.headers, outline.similarTitles, this.content, this.summaries, this.imageNames))];
    try {
      const modelType = process.env.CHEAP_GPT === 'true' ? "gpt-3.5-turbo-16k" : "gpt-4";
      const model = new ChatOpenAI({ modelName: modelType, temperature: 0, maxTokens: 3000, openAIApiKey: this.openAIKey});
      const response = await model.call(messages);
      const text = response.text;
      console.log('writing post success');
      return text;
    } catch (e) {
      console.error(e)
      console.log('writing post error');
      throw new Error("Error writing a post for '" + title);
    }
  };
}

module.exports = { Agent };
