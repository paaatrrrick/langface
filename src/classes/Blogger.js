if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const fetch = require("node-fetch");
const { ChatOpenAI } = require("langchain/chat_models/openai");
const { HumanChatMessage, SystemChatMessage } = require("langchain/schema");
const { dummyblog } = require("../constants/dummyData");
const { blogPostForBlogger, SystemChatMessageForBlog } = require("../constants/prompts");

class Blogger {
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
    }

    run = async () => {
        this.sendData({ type: "updating", content: `Step 2 of 3: Writing the article`, title: `Loading... Article ${this.currentIteration + 1} / ${this.loops}` });
        const post = await this.writePost();
        this.sendData({ type: "updating", content: `Step 3 of 3: Posting the article`, title: `Loading... Article ${this.currentIteration + 1} / ${this.loops}`});
        const result = await this.postToBlogger(post);
        return result;
    }

    writePost = async () => {
        if (process.env.MOCK_WRITING_BLOG === "true") return dummyblog;
        const messages = [new SystemChatMessage(SystemChatMessageForBlog), new HumanChatMessage(
          blogPostForBlogger(this.outline.longTailKeywords, this.outline.blogStrucutre, this.outline.tips, this.outline.headers, this.outline.similarTitles, this.content, this.summaries))];
        try {
          const model = new ChatOpenAI({ modelName: "gpt-3.5-turbo-16k", temperature: 0, maxTokens: 6000, openAIApiKey: this.openAIKey});
          const response = await model.call(messages);
          const text = response.text;
          console.log('writing post success');
          return text;
        } catch (e) {
          console.error(e)
          console.log('writing post error');
          throw new Error("Error writing a post for '" + this.outline.similarTitles);
        }
      };

      postToBlogger = async (content) => {
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
              title: this.outline.similarTitles,
              content: content,
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
          console.log(result.url);
          return {
            title: this.outline.similarTitles,
            content: content,
            url: result.url,
          };
        }
      };
}


module.exports = Blogger;