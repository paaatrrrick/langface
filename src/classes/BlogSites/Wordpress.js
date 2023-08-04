if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
  }
const fetch = require("node-fetch");
const AbstractBlog = require("./AbstractBlog");

class Wordpress extends AbstractBlog {
    constructor(outline, jwt, blogID, sendData, loops, summaries, currentIteration, draft, postMongoID, demo, businessData, version, includeAIImages) {
        super(outline, jwt, blogID, sendData, loops, summaries, currentIteration, draft, postMongoID, demo, businessData, version, includeAIImages);
    }

    imagePostProcessing = async (cloudinaryUrls) => {
        if (!cloudinaryUrls || cloudinaryUrls.length === 0 || process.env.MOCK_PHOTOS === "true") return cloudinaryUrls;
        const response = await fetch(`https://public-api.wordpress.com/rest/v1.1/sites/${this.blogID}/media/new`,{
            method: "POST",
            body: JSON.stringify({media_urls: cloudinaryUrls,}),
            headers: {Authorization: `Bearer ${this.jwt}`, "Content-type": "application/json"},
        });
        if (!response.ok) {
          const data = await response.text();
          console.log(data);
          throw new Error(`Error creating your post: we failed to upload your images to Wordpress`);
        }
        const data = await response.json();
        const imageUrls = [];
        for (let media of data?.media) {
          imageUrls.push(media.URL);
        }
        return imageUrls;
    };
    
    postApi = async (post) => {
        const body = { /* title: this.outline.blogTitle,*/ content: post};
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
        }           
        const result = await response.json();
        return {url: result.URL, postID: result?.ID?.toString()}
      };

      updateParentApi = async(parentID, newHTML, parentTitle) => {
        await fetch(`https://public-api.wordpress.com/rest/v1/sites/${this.blogID}/posts/${parentID}`,{
            method: "POST",
            headers: {
            Authorization: `Bearer ${this.jwt}`,
            "Content-Type": "application/json",
            },
            body: JSON.stringify({
                content: newHTML,
                // title: parentTitle,
            }),
        });
      };
}


module.exports = Wordpress;