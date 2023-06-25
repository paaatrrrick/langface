if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
  }
const fetch = require("node-fetch");
const { replaceStringInsideStringWithNewString } = require("../utils/helpers");
const { ChatOpenAI } = require("langchain/chat_models/openai");
const { HumanChatMessage, SystemChatMessage } = require("langchain/schema");
const Photos = require("./Photos");
const { dummyblog } = require("../constants/dummyData");
const { blogPost, SystemChatMessageForBlog } = require("../constants/prompts");  

class Wordpress {
    constructor(content, outline, jwt, blogID, sendData, openAIKey, loops, summaries, currentIteration) {
        this.content = content;
        this.outline = outline;
        this.jwt = jwt;
        this.blogID = blogID;
        this.sendData = sendData;
        this.openAIKey = openAIKey;
        this.loops = loops;
        this.summaries = summaries;
        this.sendData = sendData;
        this.currentIteration = currentIteration;
        this.imageNames = ["image1.png", "image2.png"];
    }

    run = async () => {
        console.log('running wordpress');
        this.sendData({ type: "updating", content: `Step 2 of 3: Writing the article`, title: `Loading... Article ${this.currentIteration + 1} / ${this.loops}` });
        const post = await this.writePost();
        this.sendData({ type: "updating", content: `Step 3 of 3: Generating images`, title: `Loading... Article ${this.currentIteration + 1} / ${this.loops}`});
        const photosObject = new Photos(post, this.openAIKey, this.blogID, this.jwt, this.imageNames);
        const cloudinaryUrls = await photosObject.run();
        const wordpresssUrls = await this.getWordpressImageURLs(cloudinaryUrls);
        await photosObject.deleteCloudinaryImages();
        const result = await this.postToWordpress(post, wordpresssUrls);
        return result;
    }

    writePost = async () => {
        if (process.env.MOCK_WRITING_BLOG === "true") return dummyblog;
        const messages = [
            new SystemChatMessage(SystemChatMessageForBlog), 
            new HumanChatMessage(
                blogPost(this.outline.longTailKeywords, this.outline.blogStrucutre, this.outline.tips, this.outline.headers, this.outline.similarTitles, this.content, this.summaries, this.imageNames))
        ];
        try {
          const modelType = process.env.CHEAP_GPT === 'true' ? "gpt-3.5-turbo-16k" : "gpt-4";
          const model = new ChatOpenAI({ modelName: modelType, temperature: 0, maxTokens: 6000, openAIApiKey: this.openAIKey});
          const response = await model.call(messages);
          const text = response.text;
          console.log('writing post success');
          return text;
        } catch (e) {
          console.log(e)
          console.log('writing post error');
          throw new Error("Error writing a post for '" + this.outline.similarTitles);
        }
      };

      getWordpressImageURLs = async (cloudinaryUrls) => {
        const response = await fetch(
            `https://public-api.wordpress.com/rest/v1.1/sites/${this.blogID}/media/new`,
          {
            method: "POST",
            body: JSON.stringify({
                media_urls: cloudinaryUrls,
            }),
            headers: {
              Authorization: `Bearer ${this.jwt}`,
              "Content-type": "application/json"
            },
          }
        );
        if (!response.ok) {
          const data = await response.text();
          console.log('error getting image urls from wordpress')
          console.log(data);
          throw new Error(`Error creating your post: we to upload your images to Wordpress`);
        }
        const data = await response.json();
        const imageData = data?.media;
        const imageUrls = [];
        for (let media of imageData) {
          imageUrls.push(media.URL);
        }
        return imageUrls;
      };

    postToWordpress = async (post, imageUrls) => {
        if (process.env.MOCK_POST_TO_WORDPRESS === "true") return {title: this.outline.similarTitles, content: post, url: "https://historylover4.wordpress.com/2021/08/16/this-is-a-test-post/"};
        for (let i in imageUrls) {
            post = replaceStringInsideStringWithNewString(post, this.imageNames[i], imageUrls[i]);
        }
        const response = await fetch(`https://public-api.wordpress.com/rest/v1/sites/${this.blogID}/posts/new`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${this.jwt}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title: this.outline.similarTitles,
              content: post,
            }),
          }
        );
        if (!response.ok) {
          const error = await response.text();
          console.log('error posting to wordpress');
          console.log(error);
          throw new Error(`Error creating your post: we failed to post to Wordpress`);
        } else {
          const result = await response.json();
          console.log('successfully posted to wordpress at this url ' + result.URL);
          return {title: this.outline.similarTitles, content: post, url: result.URL};
        }
      };


}


module.exports = Wordpress;