//require dotenv
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const { ChatOpenAI } = require("langchain/chat_models/openai");
const { z } = require("zod");
const { StructuredOutputParser,  } = require("langchain/output_parsers");
const { PromptTemplate } = require("langchain/prompts");
const { HumanChatMessage, SystemChatMessage } = require("langchain/schema");
const Photos = require("./Photos");
const { OpenAI } = require("langchain/llms/openai");
const { MemoryVectorStore } = require("langchain/vectorstores/memory");
const { OpenAIEmbeddings } =require("langchain/embeddings/openai");
const {Researcher} = require("./Researcher");

// const { initializeAgentExecutorWithOptions } = require("langchain/agents");
// const { SerpAPI } = require("langchain/tools");
// const { Calculator } = require("langchain/tools/calculator");
// const { WebBrowser } = require("langchain/tools/webbrowser");
const { dummyblog, dummyTitle } = require("../constants/dummyData");
const { blogPost, SystemChatMessageForBlog } = require("../constants/prompts");
const { getImages, postToWordpress, postToBlogger, getWordpressImageURLs, uploadToCloudinary } = require("../utils/api");
const TESTING_UI = (process.env.TESTING === "true" || process.env.TESTING_UI === "true") ? true : false;

class Agent {
  constructor(jwt, blogID, content, loops, openAIKey, version, sendData) {
    this.jwt = jwt;
    this.blogID = blogID;
    this.content = content;
    this.loops = loops;
    this.sendData = sendData;
    this.summaryVectorStoreLength = 0;
    this.openAIKey = openAIKey ? openAIKey : process.env.OPENAI_API_KEY;
    this.version = version;
    this.summaries = [];
    this.imageNames = ["image1.png", "image2.png"];
    this.model = new ChatOpenAI({
      modelName: "gpt-3.5-turbo",
      temperature: 0.1,
      maxTokens: 3000,
      openAIApiKey: this.openAIKey,
    });
    this.researcher = new Researcher(content, this.loops);
  }

  run = async () => {
    console.log("ran");
    if (TESTING_UI) {
      this.testing();
      return;
    }
    try {
      // const modelUrls = await this.researcher.getModelURLs();
      const titlesAndSummaries = await this.writeTitles();
      console.log(`Done writing titles...`);
      console.log(titlesAndSummaries);
      var errorCount = 0;
      for (let postBluePrint of titlesAndSummaries) {
        try {
          const post = await this.writePost(postBluePrint.title, postBluePrint.summary);
          if (this.version === "blogger") {
            const result = await postToBlogger(post, postBluePrint.title, this.blogID, this.jwt);
            this.sendData(result);
          } else {
            const photosObject = new Photos(post, this.openAIKey, this.blogID, this.jwt, this.imageNames);
            const imageUrls = await photosObject.run();
            const result = await postToWordpress(post, postBluePrint.title, imageUrls, this.imageNames, this.blogID, this.jwt, postBluePrint.summary, this.summaries);
            this.summaries.push({summary: postBluePrint.summary, url: result.url});
            result.content = postBluePrint.summary;
            try {
              this.sendData(result);
            } catch(e) {
              console.log('error from summarize')
              console.log(e);
              this.sendData(result);
            }
          }
        } catch (e) {
          console.log('error from loops')
          console.log(e);
          errorCount += 1;
          if (errorCount > 5) {
            this.sendData({ type: "ending", content: "Too many errors, stopping process" });
            return;
          }
          this.sendData({ type: "error", content:  e.message });
        }
      }
      this.sendData({ type: "ending", content: "Process Complete" });
    } catch (e) {
      this.sendData({ type: "ending", content: e.message });
    }
  };

  writeTitles = async () => {
    if (process.env.MOCK_TITLES === "true") return dummyTitle;
    const parserFromZod = StructuredOutputParser.fromZodSchema(
      z.array(
        z.object({
          title: z.string().describe("The seo optimized title of the blog post"),
          summary: z.string().describe("A short summary of what this blog post should be about. Include long tail keywords"),
    })));
    const formatInstructions = parserFromZod.getFormatInstructions()
    const prompt = new PromptTemplate({
      template: `Provide an unordered list of length "{loops}" of niche blog titles and a short summary:\n It's a blog about "{subject}". \n{format_instructions}.`,
      inputVariables: ["subject", "loops"],
      partialVariables: { format_instructions: formatInstructions },
    });
    const input = await prompt.format({subject: this.content, loops: this.loops});
    try {
      const response = await this.model.call([new HumanChatMessage(input)]);
      const parsed = await parserFromZod.parse(response.text)
      return parsed;
    } catch (e) {
      console.error(e)
      console.log('writing titles error');
      throw new Error("Error creating titles for your posts. Please try again.");
    }
  };

  writePost = async (title, summary) => {
    if (process.env.MOCK_WRITING_BLOG === "true") return dummyblog;
    const messages = [new SystemChatMessage(SystemChatMessageForBlog), new HumanChatMessage(blogPost(title, summary, this.content, this.imageNames, this.summaries))];
    try {
      const response = await this.model.call(messages);
      return response.text;
    } catch (e) {
      console.error(e)
      console.log('writing post error');
      throw new Error("Error writing a post for '" + title + "'. Please try again.");
    }
  };

  testing = async () => {
    for (let i = 0; i < 5; i++) {
      this.sendData({
        title: "Welcome to the Purrfect Blog!",
        content: `${i}:    <div><p>Welcome to the Purrfect Blog!</p><p>As a cat lover, I know how important it is to stay up-to-date on all things feline. That's why I created this blog - to share my love of cats with the world!</p><p>Here, you'll find everything from cute cat videos to informative articles on cat health and behavior. I'll also be sharing my own experiences as a cat owner, so you can get to know me and my furry friends a little better.</p><p>So, whether you're a seasoned cat owner or just a cat enthusiast, I hope you'll find something here that you love. Thanks for stopping by!</p></div>`,
        url: "https://www.blogger.com/profile/05904937201937380783",
        type: "success",
      });
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    this.sendData({ type: "error", content: "Test error" });
    this.sendData({ type: "ending", content: "Process Complete" });
  };
}

module.exports = {
  Agent,
};
