if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
  }
  const fetch = require("node-fetch");
  const fs = require("fs");
  const path = require("path");
  const { z } = require("zod");
  const { arrayToString } = require("../utils/helpers");
  const { text2ImgPrompt } = require("../constants/prompts");
  const { StructuredOutputParser } = require("langchain/output_parsers");
  const { ChatOpenAI } = require("langchain/chat_models/openai");
  const { HumanChatMessage } = require("langchain/schema");
  const cloudinary = require("cloudinary").v2;
  const { PromptTemplate } = require("langchain/prompts");
  const { dummyWordpressPhotos } = require("../constants/dummyData");

class Photos {
    constructor(text, openaiKey, wordpressBlogId, wordpressJwtToken, imageNamesUsedInBlog) {
        this.text = text;
        this.openaiKey = openaiKey;
        this.wordpressBlogId = wordpressBlogId;
        this.wordpressJwtToken = wordpressJwtToken;
        this.imageNamesUsedInBlog = imageNamesUsedInBlog;
        this.style = ""
        this.cloudinaryImages = [];
    }

    run = async () => {
      try{
        if (process.env.MOCK_PHOTOS === "true") return dummyWordpressPhotos;
        try {
            this.summarizedImages = await this.summarizeImages();
            this.imagePrompts = await this.getImagePrompts();
            this.imageBuffers = await this.getImageBuffers();
            this.cloudinaryImages = await this.uploadToCloudinary();
        } catch (error) {
          console.log('creating images error');
          console.log(error);
          await this.deleteCloudinaryImages();
          throw new Error("Error creating images");
        }
        return this.cloudinaryImages.map((images) => images.url);
      }catch(e){ console.log('image error: ', e);}
    }

    summarizeImages = async () => {
        const parserFromZod = StructuredOutputParser.fromZodSchema(z.array(z.object({
                paragraphDescription: z.string().describe("A unique description of an image that could go there. A good image in the scenario does not include people or faces"),
                width: z.number().describe("The width of the image. That must be divisible by 64"),
                height: z.number().describe("The height of the image. That must be divisible by 64"),
          })));
        const formatInstructions = parserFromZod.getFormatInstructions()
        const template = `For the following ${this.imageNamesUsedInBlog.length} images: ${arrayToString(this.imageNamesUsedInBlog)} which are in the following blog, write a description of them: BLOG:${this.text} \n{format_instructions}.`;
        const prompt = new PromptTemplate({template: template, inputVariables: [], partialVariables: { format_instructions: formatInstructions }});
        const input = await prompt.format();
        const model = new ChatOpenAI({modelName: "gpt-3.5-turbo-16k",temperature: 0, maxTokens: 1000, openAIApiKey: this.openaiKey});
        const response = await model.call([new HumanChatMessage(input)]);
        console.log(response.text);
        const parsed = await parserFromZod.parse(response.text);
        this.styles = "digital-art";
        // const stylesArr = ["cinematic", "digital-art", "low-poly", "pixel-art", "fantasy-art", "enhance"]
        // if (stylesArr.includes(style) === false) {
        //   this.style = "digital-art"
        // } else {
        //   this.style = style;
        // }
        return parsed;
    }

    // style: z.string().describe('The style of the image. It must be: "anime", "cinematic", "digital-art", "low-poly", "photographic", "pixel-art", or "enhance"')
    getImagePrompts = async () => {
        const parserFromZod = StructuredOutputParser.fromZodSchema(z.array(z.string().describe("A one or two sentence prompt to generate the image")));    
        const imageDescriptions = this.summarizedImages.map((imageInfo) => imageInfo.paragraphDescription)
        const formatInstructions = parserFromZod.getFormatInstructions()
        const prompt = new PromptTemplate({template: `${text2ImgPrompt(imageDescriptions, this.style)} \n{format_instructions}.`, inputVariables: [], partialVariables: { format_instructions: formatInstructions }});
        const input = await prompt.format();
        const model = new ChatOpenAI({modelName: "gpt-3.5-turbo-16k",temperature: 0.1, maxTokens: 1000, openAIApiKey: this.openaiKey});
        const response = await model.call([new HumanChatMessage(input)]);
        const parsed = await parserFromZod.parse(response.text) ;
        return parsed;
    }

    findNearestMultipleOf64 = (number) => {
        return Math.min(Math.max(Math.ceil(number / 64) * 64, 256), 1280);
    }

    increaseOrDecreaseUntilBetween256And1280 = (width, height) => {
        var multiple = width * height;
        var widthNext = true;
        while (multiple <  262144) {
            if (widthNext) {
                width += 64;
            } else {
                height += 64;
            }
            multiple = width * height;
            widthNext = !widthNext;
        }
        while (multiple >  1048576) {
            if (widthNext) {
                width -= 64;
            } else {
                height -= 64;
            }
            multiple = width * height;
            widthNext = !widthNext;
        }
        return {width: width, height: height};
    }
    
    getImageBuffers = async () => {
        const images = [];
        //set this.imagePrompts to its first two elements
        this.imagePrompts = this.imagePrompts.slice(0,2);
        for (let i in this.imagePrompts) {
          const dimension = this.summarizeImages[i] || {};
          var width = this.findNearestMultipleOf64(dimension.width || 512);
          var height = this.findNearestMultipleOf64(dimension.height || 512);
          ({ width, height } = this.increaseOrDecreaseUntilBetween256And1280(width, height));
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
                text_prompts: [{text: this.imagePrompts[i]}],
                width: width,
                height: height,
                style: this.style,
              }),
            }
          );
          if (!response.ok) {
            const data = await response.json();
            console.log(data);
            throw new Error(`Error creating your post: we failed to create the images`);
          }
          const image = await response.blob();
          const ArrayBuffer = await image.arrayBuffer();
          const buffer = Buffer.from(ArrayBuffer);
          images.push(buffer);
        }
        return images;
      };

      uploadToCloudinary = async () => {
        const cloudinaryImages = [];
        for (let buffer of this.imageBuffers) {
          const dataUri = `data:image/png;base64,${buffer.toString('base64')}`;
          const result = await cloudinary.uploader.upload(dataUri, { resource_type: "image" });
          cloudinaryImages.push({ url: result.url, public_id: result.public_id });
        }
        return cloudinaryImages;
      };

      deleteCloudinaryImages = async () => {
        if (process.env.MOCK_PHOTOS === "true") return;
        for (let image of this.cloudinaryImages) {
            try {
                cloudinary.uploader.destroy(image.public_id);
            } catch (e) {
                console.log('error deleting cloudinary image');
                console.log(e);
            }
        }}
}

module.exports = Photos;