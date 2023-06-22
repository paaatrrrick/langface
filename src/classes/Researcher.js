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
const { arrayToString } = require("../utils/helpers");
const { dummyResearcher } = require("../constants/dummyData");
const axios = require('axios');
const cheerio = require('cheerio');
const serpapi = require('google-search-results-nodejs');
const { z } = require("zod");
const { StructuredOutputParser } = require("langchain/output_parsers");
const search = new serpapi.GoogleSearch(process.env.SERPAPI_API_KEY);

class Researcher {
    constructor(niche, blogCount, openAIKey) {
        this.niche = niche;
        this.blogCount = blogCount;
        this.model = new ChatOpenAI({
            modelName: "gpt-3.5-turbo",
            temperature: 0,
            maxTokens: 3000,
            openAIApiKey: openAIKey
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
        if (process.env.MOCK_RESEARCH === "true") return dummyResearcher;
        let modelBlogs = [];
        let query = `${this.niche}`; // {this.niche};
        var totalI = 0;
        for (let i = 0; i < this.blogCount; i++) { //this.blogCount;
            totalI++;
            if (totalI > this.blogCount * 1.5) {
                throw new Error("too many iterations");
            }
            try {
                const params = {engine: "google", q: query}
                var data = false;
                search.json(params, (res) => {data = res;});
                while (!data) {
                    await new Promise(resolve => setTimeout(resolve, 30));
                }
                console.log(query);
                var tempUrl;
                var k = 0;
                while (k < 10) {
                    tempUrl = data["organic_results"][i + k].link;
                    const blogResponse = await axios.get(tempUrl);
                    const $ = cheerio.load(blogResponse.data);
                    var paragraphText = $('p').text();
                    if (paragraphText.length > 1000) {
                        break;
                    }
                    k++;
                }
                 // i is a HUGE hack.
                const parsed = await this.parseBlogPost(tempUrl);
                if (parsed !== false) {
                    modelBlogs.push(parsed);
                }
                if (data["related_searches"]){
                    //TODO: addd more stuff here
                    const nextQuery = data["related_searches"][0].query;
                    console.log(nextQuery);
                    query = nextQuery;        
                } else {
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
                if (!parsed) {
                    i--;
                }
            } catch (e) {
                console.log('error in getModelURLs')
                console.log(e);
                i--;
            }
        }
        return modelBlogs;
    }

    parseBlogPost = async (blogURL) => {
        try {
            const blogResponse = await axios.get(blogURL);
            const $ = cheerio.load(blogResponse.data);
            var paragraphText = $('p').text();
            if (paragraphText.length > 15000) {
                paragraphText = paragraphText.slice(0, 15000);
            }
            if (paragraphText.length < 1500) {
                console.log("not enough text");
                return false;
            }
            console.log(paragraphText);
            var headers = [];
            const headerTypes = ['h1', 'h2', 'h3', 'h4', 'h5'];
            for (let headerType of headerTypes) {
                $(headerType).each((index, element) => {
                    var tempHeader = $(element).text();
                    headers.push(`<${headerType}> ${tempHeader.trim()} </${headerType}>`);
                });
            }
            if (headers.length > 20) {
                headers = headers.slice(0, 20);
            }
            const parserFromZod = StructuredOutputParser.fromZodSchema(
                  z.object({
                    longTailKeywords: z.string().describe("Up to 5 of the top long tail SEO keywords used in this article?"),
                    blogStrucutre: z.string().describe("Describe is the overarching structure of this blog (e.g a comparison, a list, a how-to, etc.) and how does it write the content to boost SEO?"),
                    tips: z.string().describe("How could the text of this blog be improved to boost SEO?"),
                    similarTitles: z.array(z.string().describe("What is ONE title of a blog that would be similar to this one?")).max(1),
              }));
              const formatInstructions = parserFromZod.getFormatInstructions()
              const template =`You are the World's top SEO expert. Given the text of a blog and it's headers, answer the attached questions.
              HEADERS: ${arrayToString(headers)}\n\n
              CONTENT IN BLOG: ${paragraphText}\n\n
              {format_instructions}.`;
              const prompt = new PromptTemplate({
                template: template, 
                inputVariables: [], 
                partialVariables: { format_instructions: formatInstructions }
            });
              const input = await prompt.format();
              const model = new ChatOpenAI({modelName: "gpt-3.5-turbo-16k", temperature: 0, maxTokens: 1000, openAIApiKey: this.openAIKey});
              const response = await model.call([new HumanChatMessage(input)]);
              const parsed = await parserFromZod.parse(response.text);
              parsed.headers = headers;
              parsed.similarTitles = parsed.similarTitles[0];
              console.log(parsed)
              return parsed;
        } catch (e) {
            console.log('error parsing researched blog');
            console.log(e)
            return false;
        }
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
  