if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const { replaceStringInsideStringWithNewString } = require("../utils/helpers");

const getImages = async (title, post) => {
  if (process.env.MOCK_OPENAI === "true" || true) return ["https://lumiere-a.akamaihd.net/v1/images/darth-vader-main_4560aff7.jpeg?region=0%2C67%2C1280%2C720"]
  const engineId = "stable-diffusion-v1-5";
  const apiKey = process.env.STABILITY_API_KEY;
  const images = [];
  for (let i = 0; i < 1; i++) {
    const response = await fetch(
      `https://api.stability.ai/v1/generation/${engineId}/text-to-image`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "image/png",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          text_prompts: [
            {
              text: `Images for a blog post with the title ${title}`,
            },
          ],
          samples: 1,
        }),
      }
    );
    if (!response.ok) {
      const data = await response.text();
      console.log('error creating images')
      console.log(data);
      throw new Error(`Error creating your post: we failed to create the images`);
    }
    const image = await response.blob();
    images.push(image);
  }
  return images;
};

const getWordpressImageURLs = async (images, blogID, jwt) => {
  if (process.env.MOCK_OPENAI === "true" || true) return []
  const formData = new FormData();
  for (let image of images) {
    formData.append("media[]", image, { filename: "image.png" });
  }
  const file = fs.promises.readFile(path.resolve("src/constants/test.png"));
  const fileName = "test.png";
  const response = await fetch(
    `http://historylover4.wordpress.com/wp-json/wp/v2/media/`,
    {
      method: "POST",
      body: file,
      headers: {
        Authorization: `Bearer ${jwt}`,
        "Content-Disposition": `form-data; filename="${fileName}`,
      },
    }
  );
  if (!response.ok) {
    const data = await response.text();
    console.log('error getting image urls')
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
  getImages,
  postToWordpress,
  postToBlogger,
  getWordpressImageURLs,
};
