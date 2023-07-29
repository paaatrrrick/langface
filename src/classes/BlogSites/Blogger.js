const fetch = require("node-fetch");
const AbstractBlog = require("./AbstractBlog");

class Blogger extends AbstractBlog {
  constructor(outline, jwt, blogID, sendData, loops, summaries, currentIteration, draft, postMongoID, demo, businessData, version, includeAIImages) {
    super(outline, jwt, blogID, sendData, loops, summaries, currentIteration, draft, postMongoID, demo, businessData, version, includeAIImages);
  }
  postApi = async (post) => {
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
      }
      const result = await response.json();
      return {url: result.url, rawHTML: post, postID: result.id};
    };

    updateParentApi = async(parentID, newHTML, parentTitle) => {
      const res = await fetch(`https://www.googleapis.com/blogger/v3/blogs/${this.blogID}/posts/${parentID}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${this.jwt}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            kind: "blogger#post",
            blog: {
              id: this.blogID,
            },
            content: newHTML,
            title: parentTitle,
          }),
        });
        if (!res.ok) {
          const error = await res.text();
          console.log('error updating blogger');
          console.log(error);
          throw new Error(`Error updating your post: we failed to update blogger`);
        }
    }

}


module.exports = Blogger;