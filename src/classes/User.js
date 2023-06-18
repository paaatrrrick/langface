//require dotenv
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const { ChatOpenAI } = require("langchain/chat_models/openai");
const { CustomListOutputParser } = require("langchain/output_parsers");
const { PromptTemplate } = require("langchain/prompts");
const { HumanChatMessage, SystemChatMessage } = require("langchain/schema");
const { OpenAI } = require("langchain/llms/openai");
const { MemoryVectorStore } = require("langchain/vectorstores/memory");
// const { initializeAgentExecutorWithOptions } = require("langchain/agents");
const { OpenAIEmbeddings } =require("langchain/embeddings/openai");
// const { SerpAPI } = require("langchain/tools");
// const { Calculator } = require("langchain/tools/calculator");
// const { WebBrowser } = require("langchain/tools/webbrowser");
const { dummyblog, dummyTitle } = require("../constants/dummyData");
const { blogPost, SystemChatMessageForBlog } = require("../constants/prompts");
const { getImages, postToWordpress, postToBlogger, getWordpressImageURLs } = require("../utils/api");
const TESTING_UI = (process.env.TESTING === "true" || process.env.TESTING_UI === "true") ? true : false;

class User {
  constructor(jwt, blogID, content, loops, openAIKey, version, sendData) {
    this.jwt = jwt;
    this.blogID = blogID;
    this.content = content;
    this.loops = loops;
    this.sendData = sendData;
    this.summaryVectorStoreLength = 0;
    this.summaryVectorStore = new MemoryVectorStore(new OpenAIEmbeddings({
      openAIApiKey: openAIKey,
    }))
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
  }

  run = async () => {
    if (TESTING_UI) {
      this.testing();
      return;
    }
    try {
      const titles = await this.writeTitles();
      console.log(`Done writing titles...`);
      console.log(`${titles}`);
      var errorCount = 0;
      for (let title of titles) {
        try {
          const post = await this.writePost(title);
          if (this.version === "blogger") {
            const result = await postToBlogger(post, title, images, this.blogID, this.jwt);
            this.sendData(result);
          } else {
            const imagesFiles = await getImages(title, post);
            const wordpressImageUrls = await getWordpressImageURLs(imagesFiles, this.blogID, this.jwt);
            const result = await postToWordpress(post, title, wordpressImageUrls, this.imageNames, this.blogID, this.jwt);
            console.log('we got the result');
            try {
              console.log('trying to summarize');
              console.log(result.url)
              const summary = await this.summarize(post, title, result.url);
              result.content = summary;
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
    if (process.env.MOCK_TITLES === "true") return [dummyTitle];
    const parser = new CustomListOutputParser({length: this.loops, separator: "\n"});
    const formatInstructions = parser.getFormatInstructions();
    const prompt = new PromptTemplate({
      template: `Provide an unordered list of length "{loops}" of niche blog titles:\n It's a blog about "{subject}". \n{format_instructions} The titles should not be number.`,
      inputVariables: ["subject", "loops"],
      partialVariables: { format_instructions: formatInstructions },
    });
    const input = await prompt.format({subject: this.content, loops: this.loops});
    try {
      const response = await this.model.call([new HumanChatMessage(input)]);
      const titles = response.text.split("\n");
      return titles;
    } catch (e) {
      console.error(e)
      console.log('writing titles error');
      throw new Error("Error creating titles for your posts. Please try again.");
    }
  };

  writePost = async (title) => {
    if (process.env.MOCK_WRITING_BLOG === "true") return dummyblog;
    const messages = [new SystemChatMessage(SystemChatMessageForBlog), new HumanChatMessage(blogPost(title, this.content, this.imageNames))];
    try {
      const response = await this.model.call(messages);
      const post = await response.text;
      return post;
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

  summarize = async (blogPost, title, url) => {
    console.log('summarizing')
    var summary;
    if (process.env.MOCK_WRITING_SUMMARY === "true") {
      summary = "A blog post about superheros uniting";
    } else {
      const model = new ChatOpenAI({modelName: "gpt-3.5-turbo", temperature: 0, maxTokens: 3000, openAIApiKey: this.openAIKey});
      const response = await model.call([new HumanChatMessage("Summarize the following html blog post in two sentences in natural language: " + blogPost)]);
      summary = response.text;
    }
    console.log('here')
    this.summaryVectorStore.addDocuments([{text: summary, id: this.summaryVectorStoreLength, metadata: {url: url, title: title}}]);
    this.summaryVectorStoreLength += 1;
    // const resultOne = await this.summaryVectorStore.similaritySearch("hello world", 1);
    // console.log(resultOne);

    // console.log(summary);
    // this.summaries.push({summary: summary, url: url});
    // this.summaryVectorStore.addDocuments([{text: summary, id: this.summaryVectorStoreLength, metadata: {url: url, title: title}}]);
    // const resultOne = await summaryVectorStore.similaritySearch("hello world", 1);
    // console.log(resultOne);
    return summary;
  };
}

module.exports = {
  User,
};
