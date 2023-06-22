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
    constructor(text, openAIKey, wordpressBlogId, wordpressJwtToken, imageNamesUsedInBlog) {
        this.text = text;
        this.openAIKey = openAIKey;
        this.wordpressBlogId = wordpressBlogId;
        this.wordpressJwtToken = wordpressJwtToken;
        this.imageNamesUsedInBlog = imageNamesUsedInBlog;
        this.summarizedImages = [];
        this.imageBuffers = [];
        this.localImagePaths = [];
        this.cloudinaryImages = [];
    }

    run = async () => {
        if (process.env.MOCK_PHOTOS === "true") return dummyWordpressPhotos;
        try {
            this.summarizedImages = await this.summarizeImages();
            this.imagePrompts = await this.getImagePrompts();
            this.imageBuffers = await this.getImageBuffers();
            this.localImagePaths = await this.storeImageOnLocalStore();
            this.cloudinaryImages = await this.uploadToCloudinary();
            this.wordpressImageUrls = await this.getWordpressImageURLs();
        } catch (error) {
            console.log('error creating photos');
            console.log(error);
        }
        await this.deleteCloudinaryImages();
        this.deleteFileOnLocalStore();
        return this.wordpressImageUrls;
    }

    summarizeImages = async () => {
        const parserFromZod = StructuredOutputParser.fromZodSchema(
          z.array(
            z.object({
              prompt: z.string().describe("A paragraph description of what would make a good image there"),
              width: z.number().describe("The width of the image. That must be divisible by 64"),
              height: z.number().describe("The height of the image. That must be divisible by 64")
        })));
        const formatInstructions = parserFromZod.getFormatInstructions()
        const template = `For the following ${this.imageNamesUsedInBlog.length} images: ${arrayToString(this.imageNamesUsedInBlog)} which are in the following blog, write a description of them: BLOG:${this.text} \n{format_instructions}.`;
        const prompt = new PromptTemplate({template: template, inputVariables: [], partialVariables: { format_instructions: formatInstructions }});
        const input = await prompt.format();
        try {
          const model = new ChatOpenAI({modelName: "gpt-3.5-turbo-16k",temperature: 0, maxTokens: 1000, openAIApiKey: this.openAIKey});
          const response = await model.call([new HumanChatMessage(input)]);
          const parsed = await parserFromZod.parse(response.text)            
          return parsed;
        } catch (e) {
          console.error(e);
          console.log('summarize images error');
          throw new Error("Error summarizing images. Please try again.");
        }
    }

    getImagePrompts = async () => {
      const styleOptions = ["anime", "cinematic", "digital-art", "low-poly", "photographic", "pixel-art", "enhance"]
        const parserFromZod = StructuredOutputParser.fromZodSchema(
          z.array(
            z.object({
              prompt: z.string().describe("A one or two sentence prompt to generate the image"),
              style: z.string().describe('The style of the image. It must be: "anime", "cinematic", "digital-art", "low-poly", "photographic", "pixel-art", or "enhance"')
        })));
    
        const imageDescriptions = this.summarizedImages.map((imageInfo) => imageInfo.prompt)
        const formatInstructions = parserFromZod.getFormatInstructions()
        const prompt = new PromptTemplate({template: `${text2ImgPrompt(imageDescriptions)} \n{format_instructions}.`, inputVariables: [], partialVariables: { format_instructions: formatInstructions }});
        const input = await prompt.format();
        const model = new ChatOpenAI({modelName: "gpt-3.5-turbo-16k",temperature: 0, maxTokens: 1000, openAIApiKey: this.openAIKey});
        const response = await model.call([new HumanChatMessage(input)]);
        const parsed = await parserFromZod.parse(response.text);
        for (let i in parsed) {
          if (!styleOptions.includes(parsed[i].style)) {
            parsed[i].style = "digital-art";
          }
        }
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
        for (let i in this.imagePrompts) {
          const imageInfo = this.imagePrompts[i];
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
                text_prompts: [{text: imageInfo.prompt}],
                style_preset: imageInfo.style.replace(/['"]+/g, ''),
                width: width,
                height: height,
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

      storeImageOnLocalStore = async () => {
        const fileNames = [];
        let count = 0;
        for (let buffer of this.imageBuffers) {
            const fileName = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            const filePath = path.resolve(`src/storage/${fileName}.png`);
            fs.writeFile(filePath, buffer, function(err) {
                if(err) {
                    count++;
                } else {
                    count++;
                    fileNames.push(fileName);
                }
            });
        }
        while (count < this.imageBuffers.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return fileNames;
    }

    deleteFileOnLocalStore () {
        for (let fileName of this.localImagePaths) {
            const filePath = path.resolve(`src/storage/${fileName}.png`);
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error(err)
                    return
                }
            })
        }
    }

      uploadToCloudinary = async () => {
        const cloudinaryImages = [];
        for (let fileName of this.localImagePaths) {
            try {
                const result = await cloudinary.uploader.upload(
                  path.resolve(`src/storage/${fileName}.png`),
                  { resource_type: "image" }
                );
                cloudinaryImages.push({ url: result.url, public_id: result.public_id });
              } catch (error) {
                console.log('error');
                console.log(error);
                throw new Error(`Error creating your post: we failed to upload your images to Cloudinary`);
              }
        }
        return cloudinaryImages;
      };

      deleteCloudinaryImages = async () => {
        for (let image of this.cloudinaryImages) {
            try {
                cloudinary.uploader.destroy(image.public_id);
            } catch (e) {
                console.log('error deleting cloudinary image');
                console.log(e);
            }
        }}
    
    getWordpressImageURLs = async () => {
        const cloudinaryUrls = this.cloudinaryImages.map((image) => image.url);
        const response = await fetch(
            `https://public-api.wordpress.com/rest/v1.1/sites/${this.wordpressBlogId}/media/new`,
          {
            method: "POST",
            body: JSON.stringify({
                media_urls: cloudinaryUrls,
            }),
            headers: {
              Authorization: `Bearer ${this.wordpressJwtToken}`,
              "Content-type": "application/json"
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
}

module.exports = Photos;