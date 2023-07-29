if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}
const { replaceStringInsideStringWithNewString } = require("../../utils/helpers");
const { ChatOpenAI } = require("langchain/chat_models/openai");
const { HumanChatMessage, } = require("langchain/schema");
const Photos = require("./../Photos");
const { dummyblog } = require("../../constants/dummyData");
const { newBlogPost } = require("../../constants/prompts");  
const PostDB = require("../../mongo/post");

class AbstractBlog {
    constructor(outline, jwt, blogID, sendData, loops, summaries, currentIteration, draft, postMongoID, demo, businessData, version, includeAIImages) {
        this.outline = outline;
        this.jwt = jwt;
        this.blogID = blogID;
        this.loops = loops;
        this.summaries = summaries;
        this.sendData = sendData;
        this.currentIteration = currentIteration;
        this.imageNames = includeAIImages ? ["image1.png", "image2.png"] : []; 
        this.draft = draft;
        this.postMongoID = postMongoID;
        this.demo = demo;
        this.businessData = businessData;
        this.version = version;
        this.includeAIImages = includeAIImages;
    }

    //    generate + post (prompt should include outlines of children post and fake links guidance)
    //    update rawHTML + url in DB
    //    done if top post, else:
    //    update parent rawHTML (switch out fake internal links) using parent ID
    run = async () => {
        this.sendData({ type: "updating", config: `Step 2 of 3: Writing the article`, title: `Loading... Article ${this.currentIteration + 1} / ${this.loops}` });
        var post = await this.writePost();
        this.sendData({ type: "updating", config: `Step 3 of 3: Publishing content`, title: `Loading... Article ${this.currentIteration + 1} / ${this.loops}`});
        var imgUrls = [];
        try {
          if (this.includeAIImages) {
            const photosObject = new Photos(post, this.openaiKey, this.blogID, this.jwt, this.imageNames);
            const cloudinaryUrls = await photosObject.run();
            imgUrls = await this.imagePostProcessing(cloudinaryUrls);
          }
        } catch (e) {}
        return await this.postWrapper(post, imgUrls);
    }

    writePost = async () => {
        try {
          const modelType = process.env.RUNNING_LOCAL === 'true' ? "gpt-3.5-turbo-16k" : "gpt-4";
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
          if (process.env.MOCK_WRITING_BLOG === "true") return dummyblog;
          const response = await model.call([new HumanChatMessage(template)]);
          return response.text;
        } catch (e) {
          console.log(e)
          console.log('writing post error');
          throw new Error("Error writing a post for '" + this.outline.blogTitle);
        }
      };

    postWrapper = async (post, imgUrls) => {
      for (let i in imgUrls) {
        post = replaceStringInsideStringWithNewString(post, this.imageNames[i], imgUrls[i]);
      }
      if (!this.demo) await PostDB.updatePost(this.postMongoID, {rawHTML: post});
      //{url: result.URL, postID: result?.ID?.toString()}
      const res = await this.postApi(post);

      if (this.version === 'html') return {title: this.outline.blogTitle, config: post, html: post};

      const {url, postID} = res;
      await PostDB.updatePost(this.postMongoID, {url, postID});
      if (!this.draft && !this.demo){
        this.updateParent();
      }
      return {title: this.outline.blogTitle, config: post, url};
    }


    updateParent = async() => {
        // optimization: probably should call this on the LAST child not EVERY child but not going to track that right now.
        const child = await PostDB.getPostById(this.postMongoID);
        if (!child.parentMongoID) return;

        const parent = await PostDB.getPostById(child.parentMongoID);
        if (!parent) return;
        const rawHTML = parent.rawHTML;
        const fakeURL = this.getFakeURL(child.blueprint.blogTitle);

        let newHTML = replaceStringInsideStringWithNewString(rawHTML, fakeURL, child.url);
        await this.updateParentApi(parent.postID, newHTML, parent.blueprint?.blogTitle);
        await PostDB.updatePost(child.parentMongoID, {rawHTML: newHTML});
    }

    getFakeURL = (title) => {
      if (!title) return '';
      const allSpacesRemoved = title.replaceAll(' ', '');
      return `www.${allSpacesRemoved}.com`;
    }

    postApi = async (post) => {return null};
    updateParentApi = async (postID, rawHTML) => {return null};
    imagePostProcessing = async (cloudinaryUrls) => {return cloudinaryUrls};
}


module.exports = AbstractBlog;