const { OpenAI } = require("langchain/llms/openai");
const { initializeAgentExecutorWithOptions } = require("langchain/agents");
const { OpenAIEmbeddings } = require("langchain/embeddings/openai");
const { SerpAPI } = require("langchain/tools");
const { Calculator } = require("langchain/tools/calculator");
const { WebBrowser } = require("langchain/tools/webbrowser");

class Researcher {
    constructor(niche) {
        this.niche = niche;
    }

    getExecutor = async () => {
        console.log("executing");
        const model = new OpenAI({ temperature: 0 });
        const embeddings = new OpenAIEmbeddings();
        const tools = [
            new SerpAPI(process.env.SERPAPI_API_KEY, {
              location: "Austin,Texas,United States",
              hl: "en",
              gl: "us",
            }),
            new Calculator(),
            new WebBrowser({ model, embeddings }),
          ];
        const executor = await initializeAgentExecutorWithOptions(tools, model, {
            agentType: "zero-shot-react-description",
            verbose: true,
        });
        return executor;
    }
    
    searchTopKeywords = async () => {
        console.log("searching keywords");
        const input = `What are the most common key words searchers use in the space of ${this.niche}? Your output must be a an array of keyword strings.`;
        const executor = await this.getExecutor();
        const result = executor.call({ input });
        console.log(result);
        return result;
    }
    
    earchTopBlogs = async(keywords) => {
        console.log("searching blogs");
        const input = `What are the URLs of the highest ranking blogs using the keywords ${keywords}?`;
        const result = await this.getExecutor().call({ input });
        console.log(result);
        return result;
    
    }    
}

module.exports = {
    Researcher,
};
  