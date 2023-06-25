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
    constructor(query, openAIKey) {
        this.query = query;
        this.usedSearches = new Set();
        this.mostRecentQuery = null;
        this.openAIApiKey = openAIKey;
        console.log(this.openAIApiKey);
        this.model = new ChatOpenAI({
            modelName: "gpt-3.5-turbo",
            temperature: 0,
            maxTokens: 3000,
            openAIApiKey: openAIKey
          });   
        this.nextGoogleQuery = []
        this.attempts = 0;  
    }

    findInitializeBlogTitle = async () => {
        const text = `For the following description of a blog: ${this.query}. Given that description, in 10 words or less, write a generic google search query that would return blog articles similar to what I am describing.\n\n BLOG DESCRIPTION: ${this.query}`;
        const response = await this.model.call([new HumanChatMessage(text)]);
        const query = response.text;
        this.nextGoogleQuery.push(query);
    }

    getExecutor = async () => {
        const model = new OpenAI({ temperature: 0, openAIApiKey: this.openAIApiKey });
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
        if (this.mostRecentQuery === null) {
            await this.findInitializeBlogTitle(this.query);
        }
        for (var j = 0; j < 3; j++) {
            try {
                var query;
                if (this.nextGoogleQuery.length > 0) {
                    query = this.nextGoogleQuery.shift();
                } else {
                    query = await this.getSimilarQueries(this.mostRecentQuery);
                }
                console.log('at get model urls')
                console.log(query)
                this.mostRecentQuery = query;
                var data = false;
                search.json({engine: "google", q: query}, (res) => {data = res;});
                while (!data) {
                    await new Promise(resolve => setTimeout(resolve, 30));
                }
                var tempUrl;
                var k = 0;
                while (k < 10) {
                    try {
                        tempUrl = data["organic_results"][Math.min(this.attempts, 5) + k].link;
                        const blogResponse = await axios.get(tempUrl);
                        const $ = cheerio.load(blogResponse.data);
                        var paragraphText = $('p').text();
                        if (paragraphText.length > 1000) {
                            console.log('found a good url')
                            console.log(tempUrl)
                            break;
                        }
                        k++;
                    } catch (e) {
                        k++;
                    }
                }
                for (let i = 0; i < 5; i++) {
                    try {
                        const nextQuery = data["related_searches"][i].query;
                        if (!this.usedSearches.has(nextQuery)) {
                            this.nextGoogleQuery.push(nextQuery);
                            this.usedSearches.add(nextQuery);
                        }
                    } catch(e) {
                        break;
                    }
                }
                const parsed = await this.parseBlogPost(tempUrl);
                if (parsed !== false) {
                    this.attempts += 1;
                    return parsed;
                }
            } catch (e) {
                console.log('error in getModelURLs')
                console.log(e);
            }
        }
        throw new Error("Struggled to successfully research for this blog");
    }
    getSimilarQueries = async (query) => {
        const parser = new CommaSeparatedListOutputParser();
        const formatInstructions = parser.getFormatInstructions(); 
        const prompt = new PromptTemplate({
            template: "List 5 {subject}.\n{format_instructions}",
            inputVariables: ["subject"],
            partialVariables: { format_instructions: formatInstructions },
            });
        const input = await prompt.format({ subject: `Google search query for blogs that is different, but related to ${query}` });
        const response = await this.model.call([new HumanChatMessage(`${input}`)]);
        const formattedResponse =  await parser.parse(response.text);
        console.log(formattedResponse)
        for (let res of formattedResponse) {
            this.nextGoogleQuery.push(res);
        }
        return query;
    }

    parseBlogPost = async (blogURL) => {
        if (!blogURL) throw new Error("Struggled to find a relevant blog post.");
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
            return parsed;
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
  