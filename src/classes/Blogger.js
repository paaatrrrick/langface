if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const fetch = require("node-fetch");
const { ChatOpenAI } = require("langchain/chat_models/openai");
const { HumanChatMessage } = require("langchain/schema");
const { dummyblog } = require("../constants/dummyData");
const { blogPostForBlogger } = require("../constants/prompts");

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
    }

    run = async () => {
        this.sendData({ type: "updating", config: `Step 2 of 3: Writing the article`, title: `Loading... Article ${this.currentIteration + 1} / ${this.loops}` });
        const post = await this.writePost();
        this.sendData({ type: "updating", config: `Step 3 of 3: Posting the article`, title: `Loading... Article ${this.currentIteration + 1} / ${this.loops}`});
        const result = await this.postToBlogger(post);
        return result;
    }

    writePost = async () => {
        if (process.env.MOCK_WRITING_BLOG === "true") return dummyblog;
        const template = blogPostForBlogger(this.outline.keyword, this.outline.lsiKeywords, this.outline.blogTitle, this.outline.headers, this.config, this.summaries)
        console.log(template);
        try {
          const model = new ChatOpenAI({ modelName: "gpt-3.5-turbo-16k", temperature: 0, maxTokens: 6000, openAIApiKey: this.openaiKey});
          const response = await model.call([new HumanChatMessage(template)]);
          const text = response.text;
          return text;
        } catch (e) {
          console.error(e)
          console.log('writing post error');
          throw new Error("Error writing a post for '" + this.outline.similarTitles);
        }
      };

      postToBlogger = async (config) => {
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
              content: config,
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
            config: config,
            url: result.url,
          };
        }
      };
}


module.exports = Blogger;