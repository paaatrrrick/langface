const AbstractBlog = require("./AbstractBlog");  

class Html extends AbstractBlog {
  constructor(outline, jwt, blogID, sendData, loops, summaries, currentIteration, draft, postMongoID, demo, businessData, version, includeAIImages) {
      super(outline, jwt, blogID, sendData, loops, summaries, currentIteration, draft, postMongoID, demo, businessData, version, includeAIImages);
  }
}
module.exports = Html;