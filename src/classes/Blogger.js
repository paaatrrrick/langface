if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const fetch = require("node-fetch");
const { replaceStringInsideStringWithNewString } = require("../utils/helpers");
const { ChatOpenAI } = require("langchain/chat_models/openai");
const { HumanChatMessage, } = require("langchain/schema");
const Photos = require("./Photos");
const { dummyblog } = require("../constants/dummyData");
const { blogPost } = require("../constants/prompts");  

class Blogger {
  constructor(config, outline, jwt, blogID, sendData, openaiKey, loops, summaries, currentIteration) {
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
    }

    run = async () => {
        this.sendData({ type: "updating", config: `Step 2 of 3: Writing the article`, title: `Loading... Article ${this.currentIteration + 1} / ${this.loops}` });
        const post = await this.writePost();
        this.sendData({ type: "updating", config: `Step 3 of 3: Generating images`, title: `Loading... Article ${this.currentIteration + 1} / ${this.loops}`});
        const photosObject = new Photos(post, this.openaiKey, this.blogID, this.jwt, this.imageNames);
        const cloudinaryUrls = await photosObject.run();
        const result = await this.postToBlogger(post, cloudinaryUrls);
        return result;
    }

    writePost = async () => {
      if (process.env.MOCK_WRITING_BLOG === "true") return dummyblog;
      try {
        const modelType = process.env.CHEAP_GPT === 'true' ? "gpt-3.5-turbo-16k" : "gpt-4";
        const model = new ChatOpenAI({ modelName: modelType, temperature: 0, openAIApiKey: this.openaiKey});
        const template = blogPost(this.outline.keyword, this.outline.lsiKeywords, this.outline.blogTitle, this.outline.headers, this.config, this.summaries, this.imageNames);
        const response = await model.call([new HumanChatMessage(template)]);
        const text = response.text;
        console.log('here is the post');
        console.log(text);
        return text;
      } catch (e) {
        console.log(e)
        console.log('writing post error');
        throw new Error("Error writing a post for '" + this.outline.blogTitle);
      }
    };


      postToBlogger = async (post, imageUrls) => {
        if (process.env.MOCK_POST_TO_WORDPRESS === "true") return {title: this.outline.blogTitle, config: post, url: "https://historylover4.wordpress.com/2021/08/16/this-is-a-test-post/"};
        console.log('posting to wordpress');
        for (let i in imageUrls) {
            post = replaceStringInsideStringWithNewString(post, this.imageNames[i], imageUrls[i]);
        }
        const response = await fetch(`https://www.googleapis.com/blogger/v3/blogs/${this.blogID}/posts/`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${this.jwt}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              kind: "blogger#post",
              blog: {
                id: this.blogID,
              },
              title: this.outline.blogTitle,
              content: post,
            }),
          }
        );
        if (!response.ok) {
          console.log('error posting to blogger');
          const error = await response.text();
          console.log(error);
          throw new Error(`Error creating your post: we failed to post to blogger`);
        } else {
          const result = await response.json();
          return {
            title: this.outline.blogTitle,
            config: post,
            url: result.url,
          };
        }
      };
}


module.exports = Blogger;