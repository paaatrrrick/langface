//require dotenv
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const { ChatOpenAI } = require("langchain/chat_models/openai");
const { CustomListOutputParser } = require("langchain/output_parsers");
const { PromptTemplate } = require("langchain/prompts");
const { HumanChatMessage, SystemChatMessage } = require("langchain/schema");
const { dummyblog, dummyTitle } = require("../constants/dummyData");
const FormData = require("form-data");
const path = require("path");
const fs = require("fs");
const TESTING = process.env.TESTING === "true";
const fetch = require("node-fetch");

class User {
  constructor(jwt, blogID, content, loops, openAIKey, version, sendData) {
    this.jwt = jwt;
    this.blogID = blogID;
    this.content = content;
    this.loops = loops;
    this.sendData = sendData;
    this.openAIKey = openAIKey ? openAIKey : process.env.OPENAI_API_KEY;
    this.version = version;
    this.imageNames = ["image1.png", "image2.png"];
    this.model = new ChatOpenAI({
      modelName: "gpt-3.5-turbo",
      temperature: 0.1,
      maxTokens: 3000,
      openAIApiKey: this.openAIKey,
    });
  }

  run = async () => {
    if (TESTING) {
      for (let i = 0; i < 5; i++) {
        this.sendData({
          title: "Welcome to the Purrfect Blog!",
          content: `${i}:    <div><p>Welcome to the Purrfect Blog!</p><p>As a cat lover, I know how important it is to stay up-to-date on all things feline. That's why I created this blog - to share my love of cats with the world!</p><p>Here, you'll find everything from cute cat videos to informative articles on cat health and behavior. I'll also be sharing my own experiences as a cat owner, so you can get to know me and my furry friends a little better.</p><p>So, whether you're a seasoned cat owner or just a cat enthusiast, I hope you'll find something here that you love. Thanks for stopping by!</p></div>`,
          url: "https://www.blogger.com/profile/05904937201937380783",
          type: "success",
        });
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      this.sendData({ type: "ending", content: "Process Complete" });
    } else {
      // Writing all the titles
      const titles = await this.writeTitles();
      console.log(`Done writing titles... ${titles}`);
      var errorCount = 0;

      // Writing and posting blog posts for each title
      for (let i = 0; i < this.loops; i++) {
        // Writing a blog post
        const title = titles[i];
        const post = await this.writePost(title);
        if (post === "Formatting error") {
          errorCount++;
          const tooManyErrors = this.handleError(post, errorCount);
          if (tooManyErrors) {
            break;
          }
        } else {
          try {
            var result;
            if (this.version === "blogger") {
              console.log("at bloger");
              result = await this.postToBlogger(post, title, images);
            } else {
              const images = await this.getImages(title, post);
              result = await this.postToWordpress(post, title, images);
            }
            this.sendData(result);
          } catch (e) {
            errorCount++;
            console.error(e);
            const tooManyErrors = this.handleError(
              "We had too many errors, ending the program",
              errorCount
            );
            if (tooManyErrors) {
              break;
            }
          }
        }
      }
      this.sendData({ type: "ending", content: "Process Complete" });
      return;
    }
  };

  writeTitles = async () => {
    if (process.env.MOCK_OPENAI === "true") return [dummyTitle];
    console.log("Writing titles...");
    const parser = new CustomListOutputParser({
      length: this.loops,
      separator: "\n",
    });
    const formatInstructions = parser.getFormatInstructions();
    const prompt = new PromptTemplate({
      template: `Provide an unordered list of length ${this.loops} of niche blog titles:\n It's a blog about "{subject}". \n{format_instructions} The titles should not be number.`,
      inputVariables: ["subject"],
      partialVariables: { format_instructions: formatInstructions },
    });
    const input = await prompt.format({
      subject: this.content,
    });
    var titles = null;
    try {
      const response = await this.model.call([new HumanChatMessage(input)]);
      titles = response.text.split("\n");
    } catch (e) {
      console.log("we had an error");
      this.sendData({
        type: "ending",
        content: "To many errors, ending the program",
      });
      return;
    }
    return titles;
  };

  arrayToString = (array) => {
    var string = "";
    for (let i = 0; i < array.length; i++) {
      string += array[i];
      if (i !== array.length - 1) {
        string += ", ";
      }
    }
    return string;
  };

  writePost = async (title) => {
    if (process.env.MOCK_OPENAI === "true") return dummyblog;
    const input = `Write a blog post in HTML given the title: ${title}. Here is a description and guidance about the blog as a whole:\n It's a blog about ${
      this.content
    }\n\n\nFormatting Instructions: Write only HTML. Start and end with a div, the content will be added inside the body tags. Give the blog structure with various html headers and lists as needed. Include exactly ${
      this.arrayToString.length
    } imgs with the following src's respsectively: ${this.arrayToString(
      this.imageNames
    )}. DO NOT STATE THE TITLE. START WITH A DIV, then a p tag, then the first sentence.`;
    const messages = [
      new SystemChatMessage(
        "You are an AI assitant that is a world class writer. You are given a blog title and a description/guidance about the blog, then you write a blog post. You write all content only in valid HTML"
      ),
      new HumanChatMessage(input),
    ];
    var htmlContent = null;
    try {
      const response = await this.model.call(messages);
      htmlContent = response.text;
    } catch (e) {
      return "Formatting error";
    }
    if (!htmlContent) {
      return "Formatting error";
    }
    return htmlContent;
  };

  blobToDataUrl(buffer) {
    // Convert blob to a Buffer if it's not already
    // Get the image's mime type
    const mimeType = "image/png"; // Replace this with the actual mime type, if known

    // Convert the buffer to a base64 string
    const base64 = buffer.toString("base64");

    // Return the data URL
    return `data:${mimeType};base64,${base64}`;
  }

  getImages = async (title, post) => {
    const engineId = "stable-diffusion-v1-5";
    const apiHost = process.env.API_HOST ?? "https://api.stability.ai";
    const apiKey = process.env.STABILITY_API_KEY;

    let max = 1;
    if (!apiKey) throw new Error("Missing Stability API key.");
    const images = [];
    // for (let i = 0; i < max; i++) {
    //   const response = await fetch(
    //     `${apiHost}/v1/generation/${engineId}/text-to-image`,
    //     {
    //       method: "POST",
    //       headers: {
    //         "Content-Type": "application/json",
    //         Accept: "image/png",
    //         Authorization: `Bearer ${apiKey}`,
    //       },
    //       body: JSON.stringify({
    //         text_prompts: [
    //           {
    //             text: `Images for a blog post with the title ${title}`,
    //           },
    //         ],
    //         samples: 1,
    //       }),
    //     }
    //   );
    //   if (!response.ok) {
    //     throw new Error(`Non-200 response: ${await response.text()}`);
    //   }
    //   const image = await response.blob();
    //   images.push(image);
    // }
    const imageUrls = await this.getWordpressImageURLs(images);
    return imageUrls;
  };

  getWordpressImageURLs = async (images) => {
    console.log("getting wordpress image urls");
    console.log(images);
    // const formData = new FormData();
    // console.log("getting images");
    // for (let image of images) {
    //   formData.append("media[]", image, { filename: "image.png" });
    // }
    const file = fs.promises.readFile(path.resolve("src/constants/test.png"));
    const fileName = "test.png";
    // const formData = new FormData();
    // formData.append("media", file);
    // console.log(formData);
    const response = await fetch(
      `http://historylover4.wordpress.com/wp-json/wp/v2/media/`,
      {
        method: "POST",
        body: file,
        headers: {
          Authorization: `Bearer ${this.jwt}`,
          "Content-Disposition": `form-data; filename="${fileName}`,
        },
      }
    );
    if (!response.ok) {
      console.log("error");
      console.log(response);
      const data = await response.text();
      throw new Error("Error getting image URLs");
    }
    const data = await response.json();
    console.log(response);
    console.log("got the images back");
    console.log(data);
    const imageData = data?.media;
    const imageUrls = [];
    for (let media of imageData) {
      imageUrls.push(media.URL);
    }
    return imageUrls;
  };

  replaceStringInsideStringWithNewString = (
    string,
    stringToReplace,
    newString
  ) => {
    const index = string.indexOf(stringToReplace);
    if (index === -1) {
      return string;
    }
    const firstHalf = string.slice(0, index);
    const secondHalf = string.slice(index + stringToReplace.length);
    return firstHalf + newString + secondHalf;
  };

  postToWordpress = async (content, title, images) => {
    throw new Error("Error posting to wordpress");
    for (let i in images) {
      content = this.replaceStringInsideStringWithNewString(
        content,
        this.imageNames[i],
        images[i]
      );
    }
    const response = await fetch(
      `https://public-api.wordpress.com/rest/v1/sites/${this.blogID}/posts/new`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title,
          content: content,
        }),
      }
    );
    if (!response.ok) {
      const error = await response.json();
      console.error(error);
      throw new Error("Error posting to wordpress");
    } else {
      const result = await response.json();
      console.log(result);
      return {
        title: title,
        content: content,
        url: result.URL,
        type: "success",
      };
    }
  };

  postToBlogger = async (content, title) => {
    const response = await fetch(
      `https://www.googleapis.com/blogger/v3/blogs/${this.blogID}/posts/`,
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
          title: title,
          content: content,
        }),
      }
    );
    if (!response.ok) {
      throw new Error("Error posting to blogger");
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

  handleError = async (err, errorCount) => {
    this.sendData({ type: "error", error: err });
    if (errorCount > 5) {
      this.sendData({
        type: "ending",
        content: "Too many errors, ending the program",
      });
      return true;
    }
    return false;
  };
}

module.exports = {
  User,
};
