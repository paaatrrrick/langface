const { ChatOpenAI } = require("langchain/chat_models/openai");
const { PromptTemplate } = require("langchain/prompts");
const { CommaSeparatedListOutputParser } = require("langchain/output_parsers");
const { OpenAI } = require("langchain/llms/openai");
const { initializeAgentExecutorWithOptions } = require("langchain/agents");
const { OpenAIEmbeddings } = require("langchain/embeddings/openai");
const { SerpAPI } = require("langchain/tools");
const { Calculator } = require("langchain/tools/calculator");
const { WebBrowser } = require("langchain/tools/webbrowser");
const { HumanChatMessage } = require("langchain/schema");
const serpapi = require('google-search-results-nodejs');
const search = new serpapi.GoogleSearch(process.env.SERPAPI_API_KEY);

class Researcher {
    constructor(niche, blogCount) {
        this.niche = niche;
        this.blogCount = blogCount;
        this.model = new ChatOpenAI({
            modelName: "gpt-3.5-turbo",
            temperature: 0,
            maxTokens: 3000,
            openAIApiKey: process.env.OPENAI_API_KEY,
          });      
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
    
    getModelURLs = async () => {
        let modelBlogs = [];
        let query = `buy ${this.niche} blog`; // {this.niche};
        for (let i = 0; i < this.blogCount; i++) { //this.blogCount;
            const params = {
                engine: "google",
                q: query
            }
            var data = false;
            search.json(params, (res) => {
                data = res;
            });
            while (!data) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            console.log(i);
            console.log(query);    
            const modelBlog = data["organic_results"][i].link; // i is a HUGE hack.
            console.log(modelBlog);
            modelBlogs.push(modelBlog);
            if (data["related_searches"]){
                const nextQuery = data["related_searches"][0].query;
                console.log(nextQuery);
                query = nextQuery;        
            }
            else{
                const parser = new CommaSeparatedListOutputParser();
                const formatInstructions = parser.getFormatInstructions(); 
                const prompt = new PromptTemplate({
                    template: "List 1 {subject}.\n{format_instructions}",
                    inputVariables: ["subject"],
                    partialVariables: { format_instructions: formatInstructions },
                    });
                const input = await prompt.format({ subject: `Google search query that is different, but related to ${query}` });
                const response = await this.model.call([new HumanChatMessage(`${input}`)]);
                const formattedResponse =  await parser.parse(response.text);
                query = formattedResponse[0];
            }
        }
        return modelBlogs;
    }
    
    searchTopBlogs = async(keywords) => {
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
  