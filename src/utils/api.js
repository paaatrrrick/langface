if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const { z } = require("zod");
const FormData = require("form-data");
const { replaceStringInsideStringWithNewString } = require("../utils/helpers");
const { text2ImgPrompt } = require("../constants/prompts");
const { StructuredOutputParser } = require("langchain/output_parsers");
const { ChatOpenAI } = require("langchain/chat_models/openai");
const { HumanChatMessage } = require("langchain/schema");
const cloudinary = require("cloudinary").v2;
const { PromptTemplate } = require("langchain/prompts");
console.log(cloudinary.config().cloud_name);

function storeImage(buffer, filename) {
    const filePath = path.join(__dirname, '/storage/', filename + '.jpg');
    
    fs.writeFile(filePath, buffer, function(err) {
        if(err) {
            console.error('An error occurred while writing the file', err);
        } else {
            console.log('Image file has been stored successfully');
        }
    });
}

//.enum(["enhance", "anime", "photographic", "digital-art", "fantasy-art", "low-poly", "pixel-art", "cinematic"]),

const getImages = async (post, openAIKey, imageCount) => {
  return [];
  console.log('at the get image function')
  console.log(openAIKey)
  if (process.env.MOCK_EVERYTHINGELSE === "true") return ["https://lumiere-a.akamaihd.net/v1/images/darth-vader-main_4560aff7.jpeg?region=0%2C67%2C1280%2C720"]
  const images = [];
  const parserFromZod = StructuredOutputParser.fromZodSchema(
    z.array(
      z.object({
        prompt: z.string().describe("A one or two sentence prompt of the image"),
        style: z.string().describe("The style of the image"),
        width: z.number().describe("The width of the image").min(128).max(1280),
        height: z.number().describe("The height of the image").min(128).max(1280)
  })));

  const formatInstructions = parserFromZod.getFormatInstructions()
  const template = `${text2ImgPrompt(post, imageCount)} Image prompts should be orderd in the way the {images are ordered in the blog post. \n{format_instructions}.`;
  const prompt = new PromptTemplate({template, partialVariables: { format_instructions: formatInstructions }});
  const input = await prompt.format();
  console.log(input)
  const model = new ChatOpenAI({modelName: "gpt-3.5-turbo",temperature: 0, maxTokens: 4096, openAIApiKey: openAIKey});
  const response = await model.call([new HumanChatMessage(input)]);
  const parsed = await parserFromZod.parse(response.text);
  console.log(openAIKey)
  console.log(parsed);
  //remove all but the last element in parsed
  parsed.splice(0, parsed.length - 1);
  console.log(parsed);
  for (let imageInfo of parsed) {
    console.log(imageInfo)
    const response = await fetch(
      `https://api.stability.ai/v1/generation/stable-diffusion-v1-5/text-to-image`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "image/png",
          Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
        },
        body: JSON.stringify({
          text_prompts: [{text: imageInfo.prompt}],
          style_preset: imageInfo.style,
          width: imageInfo.width,
          height: imageInfo.height,
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
    console.log('we got a response');
    const buffer = await image.arrayBuffer();
    console.log(buffer)
    const deleteImage = storeImage(buffer, 'test');
    images.push(image);
  }
  return images;
};

const uploadToCloudinary = async (path) => {
  console.log('here123');
  console.log(path.resolve("src/constants/test.png"));
  cloudinary.uploader.upload(path.resolve("src/constants/test.png"), {
    resource_type: "image",
  })
  .then((result) => {
    console.log('success');
    console.log(result);
    const { url, public_id } = result;
    const destoryCloudinaryImage = () => {
      try {
        cloudinary.uploader.destroy(public_id);
      } catch (error) {
        console.log('error deleting from cloudinary')
      }
    }
    return { url, destoryCloudinaryImage };
  })
  .catch((error) => {
    console.log('error');
    console.log(error);
    throw new Error(`Error creating your post: we failed to upload your images to Cloudinary`);
  });
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
  console.log(content);
  console.log(title);
  console.log(images);
  console.log(imageNames);
  console.log(jwt);
  console.log(blogID);
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
  uploadToCloudinary
};