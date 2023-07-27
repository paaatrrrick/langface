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
const PostDB = require("../mongo/post");

class Wordpress {
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
        //    generate + post (prompt should include outlines of children post and fake links guidance)
        //    update rawHTML + url in DB
        //    done if top post, else:
        //    update parent rawHTML (switch out fake internal links) using parent ID

        this.sendData({ type: "updating", config: `Step 2 of 3: Writing the article`, title: `Loading... Article ${this.currentIteration + 1} / ${this.loops}` });
        const post = await this.writePost();
        this.sendData({ type: "updating", config: `Step 3 of 3: Publishing content`, title: `Loading... Article ${this.currentIteration + 1} / ${this.loops}`});
        const photosObject = new Photos(post, this.openaiKey, this.blogID, this.jwt, this.imageNames);
        const cloudinaryUrls = await photosObject.run();
        const wordpresssUrls = await this.getWordpressImageURLs(cloudinaryUrls);
        await photosObject.deleteCloudinaryImages();
        const result = await this.postToWordpress(post, wordpresssUrls);
        return result;
    }

    writePost = async () => {
        if (process.env.MOCK_WRITING_BLOG === "true") return dummyblog;
        try {
          const modelType = process.env.RUNNING_LOCAL === 'true' ? "gpt-3.5-turbo-16k" : "gpt-4";
          const model = new ChatOpenAI({ modelName: modelType, temperature: 0, openAIApiKey: this.openaiKey});
          var childrenURLs = [];
          let parent = undefined;
          if (!this.demo){
            const post = await PostDB.getPostById(this.postMongoID);
            parent = await PostDB.getPostById(post.parentMongoID);
            for (let id of post.childrenMongoID){
              const child = await PostDB.getPostById(id);
              childrenURLs.push(this.getFakeURL(child.blueprint.blogTitle));
            };
          }
          const template = blogPost(this.outline.keyword, this.outline.lsiKeywords, this.outline.blogTitle, this.outline.headers, this.config, this.summaries, this.imageNames, parent, childrenURLs);
          const response = await model.call([new HumanChatMessage(template)]);
          const text = response.text;
          return text;
        } catch (e) {
          console.log(e)
          console.log('writing post error');
          throw new Error("Error writing a post for '" + this.outline.blogTitle);
        }
      };

      getWordpressImageURLs = async (cloudinaryUrls) => {
        if (!cloudinaryUrls || cloudinaryUrls.length === 0 || process.env.MOCK_PHOTOS === "true") return;
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
          throw new Error(`Error creating your post: we failed to upload your images to Wordpress`);
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
        if (process.env.MOCK_POST_TO_WORDPRESS === "true") return {title: this.outline.blogTitle, config: post, url: "https://historylover4.wordpress.com/2021/08/16/this-is-a-test-post/"};
        for (let i in imageUrls) {
            post = replaceStringInsideStringWithNewString(post, this.imageNames[i], imageUrls[i]);
        }
        const body = { title: this.outline.blogTitle, content: post};
        if (this.draft) body.status = "draft";
        const response = await fetch(`https://public-api.wordpress.com/rest/v1/sites/${this.blogID}/posts/new`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${this.jwt}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          }
        );
        if (!response.ok) {
          const error = await response.text();
          console.log('error posting to wordpress');
          console.log(error);
          throw new Error(`Error creating your post: we failed to post to Wordpress`);
        } else {
          const result = await response.json();
          await PostDB.updatePost(this.postMongoID, {url: result.URL, rawHTML: post, postID: result.ID.toString()});
          if (!this.draft && !this.demo){
            this.updateParent();
          }
          return {title: this.outline.blogTitle, config: post, url: result.URL};
        }
      };

  updateParent = async() => {
    // optimization: probably should call this on the LAST child not EVERY child but not going to track that right now.
    const child = await PostDB.getPostById(this.postMongoID);
    if (!child.parentMongoID){
      return;
    }
    const parent = await PostDB.getPostById(child.parentMongoID);
    const rawHTML = parent.rawHTML;
    const fakeURL = this.getFakeURL(child.blueprint.blogTitle);

    let newHTML = replaceStringInsideStringWithNewString(rawHTML, fakeURL, child.url);
    const update = parent.postID;
    await fetch(`https://public-api.wordpress.com/rest/v1/sites/${this.blogID}/posts/${update}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: this.outline.blogTitle,
          content: newHTML,
        }),
      }
    );
    await PostDB.updatePost(child.parentMongoID, {rawHTML: newHTML});
  }

  getFakeURL = (title) => {
    const allSpacesRemoved = title.replaceAll(' ', '');
    return `www.${allSpacesRemoved}.com`;
  }
}


module.exports = Wordpress;