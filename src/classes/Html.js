if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
  }
  const { replaceStringInsideStringWithNewString } = require("../utils/helpers");
  const { ChatOpenAI } = require("langchain/chat_models/openai");
  const { HumanChatMessage, } = require("langchain/schema");
  const Photos = require("./Photos");
  const { dummyblog } = require("../constants/dummyData");
  const { newBlogPost } = require("../constants/prompts");
  const PostDB = require("../mongo/post");

  
  class Html {
    constructor(config, outline, jwt, blogID, sendData, openaiKey, loops, summaries, currentIteration, draft, postMongoID, demo, businessData) {
      this.config = config;
      this.outline = outline;
      this.jwt = jwt;
      this.blogID = blogID;
      this.sendData = sendData;
      this.openaiKey = openaiKey;
      this.loops = loops;
      this.summaries = summaries;
      this.sendData = sendData;
      this.currentIteration = currentIteration;
      this.imageNames = ["image1.png", "image2.png"];
      this.draft = draft;
      this.postMongoID = postMongoID;
      this.demo = demo;
      this.businessData = businessData;
    }
  
      run = async () => {
          this.sendData({ type: "updating", config: `Step 2 of 3: Writing the article`, title: `Loading... Article ${this.currentIteration + 1} / ${this.loops}` });
          const post = await this.writePost();
          this.sendData({ type: "updating", config: `Step 3 of 3: Finalizing changes`, title: `Loading... Article ${this.currentIteration + 1} / ${this.loops}`});
          var cloudinaryUrls = [];
          try {
            const photosObject = new Photos(post, this.openaiKey, this.blogID, this.jwt, this.imageNames);
            var cloudinaryUrls = await photosObject.run();
          } catch (e) {}
          const result = await this.postBlog(post, cloudinaryUrls);
          return result;
      }
  
      writePost = async () => {
        if (process.env.MOCK_WRITING_BLOG === "true") return dummyblog;
        try {
          // const modelType = process.env.CHEAP_GPT === 'true' ? "gpt-3.5-turbo-16k" : "gpt-4";
          const modelType = process.env.RUNNING_LOCAL === 'true' ? "gpt-4" : "gpt-4";
          const model = new ChatOpenAI({ modelName: modelType, temperature: 0, openAIApiKey: this.openaiKey});
          var childrenURLs = [];
          let parent = [];
          if (!this.demo){
            const post = await PostDB.getPostById(this.postMongoID);
            const tempParent = await PostDB.getPostById(post.parentMongoID);
            if (tempParent){
              parent = [{url: this.getFakeURL(tempParent?.blueprint?.blogTitle), description: tempParent?.blueprint?.blogTitle}];
            }
            for (let id of post.childrenMongoID){
              const child = await PostDB.getPostById(id);
              childrenURLs.push({url: this.getFakeURL(child.blueprint.blogTitle), description: child.blueprint.blogTitle});
            };
          }
          const urls = JSON.stringify([...parent, ...childrenURLs, ...this.businessData?.links])
          const template = newBlogPost(this.outline.keyword, this.outline.blogTitle, this.outline.headers, this.summaries, this.imageNames, this.businessData, urls);
          const response = await model.call([new HumanChatMessage(template)]);
          const text = response.text; 
          return text;
        } catch (e) {
          console.log(e)
          console.log('writing post error');
          throw new Error("Error writing a post for '" + this.outline.blogTitle);
        }
      };
  
    postBlog = async (post, imageUrls) => {
        if (process.env.MOCK_POST_TO_WORDPRESS === "true") return {title: this.outline.blogTitle, config: post, url: "https://historylover4.wordpress.com/2021/08/16/this-is-a-test-post/", html: post};
        for (let i in imageUrls) {
            post = replaceStringInsideStringWithNewString(post, this.imageNames[i], imageUrls[i]);
        }
        if (!this.demo){
          await PostDB.updatePost(this.postMongoID, {rawHTML: post});
        }
        return { title: this.outline.blogTitle, config: post, html: post };
    };

    getFakeURL = (title) => {
      const allSpacesRemoved = title.replaceAll(' ', '');
      return `www.${allSpacesRemoved}.com`;
    }
  }
  
  
  module.exports = Html;