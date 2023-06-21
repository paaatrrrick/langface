if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const { z } = require("zod");
const FormData = require("form-data");
const { replaceStringInsideStringWithNewString, arrayToString } = require("../utils/helpers");
const { text2ImgPrompt } = require("../constants/prompts");
const { StructuredOutputParser } = require("langchain/output_parsers");
const { ChatOpenAI } = require("langchain/chat_models/openai");
const { HumanChatMessage } = require("langchain/schema");
const cloudinary = require("cloudinary").v2;
const { PromptTemplate } = require("langchain/prompts");
console.log(cloudinary.config().cloud_name);

const postToWordpress = async (content, title, images, imageNames, blogID, jwt) => {
  if (process.env.MOCK_POST_TO_WORDPRESS === "true") return {title: title, content: content, url: "https://historylover4.wordpress.com/2021/08/16/this-is-a-test-post/",type: "success"};
  for (let i in images) {
    content = replaceStringInsideStringWithNewString(content, imageNames[i],images[i]);
  }
  const response = await fetch(
    `https://public-api.wordpress.com/rest/v1/sites/${blogID}/posts/new`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: title,
        content: content,
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
    return {title: title, content: content, url: result.URL,type: "success"};
  }
};

const postToBlogger = async (content, title, blogID, jwt) => {
  const response = await fetch(
    `https://www.googleapis.com/blogger/v3/blogs/${blogID}/posts/`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        kind: "blogger#post",
        blog: {
          id: blogID,
        },
        title: title,
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
      title: title,
      content: content,
      url: result.url,
      type: "success",
    };
  }
};

module.exports = {
  postToWordpress,
  postToBlogger,
};