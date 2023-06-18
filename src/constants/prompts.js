const { arrayToString } = require("../utils/helpers");

const blogPost = (title, content, imageNames) => {
    return `Write a blog post in HTML given the title: ${title}. Use a specific long tail keyword for SEO and stick with it for this blog. Based on the keyword, use LSI keywords as well. Here is a description and guidance about the blog as a whole:\n It's a blog about ${
        content
      }\n\n\nFormatting Instructions: Write only HTML. Start and end with an article tag, the content will be added inside the body tags. Give the blog structure with various html headers and lists as needed. Include exactly ${
        imageNames.length
      } imgs with the following src's respsectively: ${arrayToString(
        imageNames
      )}. DO NOT STATE THE TITLE. START WITH A DIV, then a p tag, then the first sentence. Optimize every aspect for SEO ranking. Add whatever is needed`;
}

const SystemChatMessageForBlog = "You are an AI assitant that is a worldclass SEO class writer. You are given a blog title and a description/guidance about the blog, then you write a blog post. You write all content only in valid HTML that is highligy optimized for SEO."



module.exports = { blogPost, SystemChatMessageForBlog };