const { ChatOpenAI } = require("langchain/chat_models/openai");
const { PromptTemplate } = require("langchain/prompts");
const { HumanChatMessage, SystemChatMessage } = require("langchain/schema");
const { z } = require("zod");
const { StructuredOutputParser } = require("langchain/output_parsers");

class LongTailResearcher {
    constructor(subject, loops, content, openAIApiKey) {
        this.subject = subject;
        this.loops = loops;
        this.content = content;
        this.openAIApiKey = openAIApiKey;
        this.hasInitialized = false;
        this.LongTailKeywords = [];
    }
    initialize = async () => {
        
        //I want to do a loop that run the research in batches of 10. Perform batches of 10 for the number of loops. The last batch should be the remainder of the loops.
        const parserFromZod = StructuredOutputParser.fromZodSchema(
            z.array(z.string().describe(`A list of ${this.loops} Longtail keywords that should be targetted by the client's blog.`)
        ));
        const formatInstructions = parserFromZod.getFormatInstructions()
        const systemMessage =`You are a world class SEO expert who specializes in long tail keyword detections. You are hired by a company to make a list of ${this.loops} Longtail keywords that would be perfect for their blog to target, meaning they would have high traffic and low competition. Clients give you the subject of their blog ${(this.content) &&` and then an very detailed specifications of what their blog, some of which might not be relevant to you`}. \n{format_instructions}`;
        const systemPrompt = new PromptTemplate({template: systemMessage, inputVariables: [], partialVariables: { format_instructions: formatInstructions }});
        const systemFormated = await systemPrompt.format();
        const humanMessage = `Blog Subject: "${this.subject}"${(this.content) && `\n\nSpecifications: "${this.content}"`}`
        console.log(systemFormated);
        console.log(humanMessage);
        const model = new ChatOpenAI({modelName: "gpt-3.5-turbo-16k", temperature: 0.1, maxTokens: 6000, openAIApiKey: this.openAIKey});
        const response = await model.call([new SystemChatMessage(systemFormated), new HumanChatMessage(humanMessage)]);
        const parsed = await parserFromZod.parse(response.text);
        console.log(parsed)
        this.LongTailKeywords = parsed;
        return this.LongTailKeywords;
    }

    getNextBlueprint = async () => {
        try {
            if (!this.hasInitialized) {
                await this.initialize();
                this.hasInitialized = true;
            }
            if (this.LongTailKeywords.length === 0) {
                return false;
            }
            const nextKeyword = this.LongTailKeywords.pop();
            return await this.validate(nextKeyword);
        } catch (error) {
            throw new Error('Error finding the best longtail keyword');
        }
    }


    validate = async (keyword) => {
        // const parserFromZod = StructuredOutputParser.fromZodSchema(z.object({
        //       usableKeyword: z.string().describe("A boolean, true if the keyword could be used in a title of a blog post for the content provided. Otherwise false"),
        //       blogTitle: z.number().describe("If usableKeyword is false, write NA. Otherwise, write an SEO optimized title for a blog post which contains the keyword and is relevant to the content provided"),
        //       lsiKeywords: z.number().describe("If usableKeyword is false, write NA. Otherwise, what are 5 other comma separated keywords that are semantically relevant to the keyword provided. For example, the keyword 'credit cards' should return: money, credit score, credit limit, loans, interest rate."),
        //       headers: z.array(z.string().describe("If usableKeyword is false, write NA. Write a list of ten headers that act as a blueprint for a blog post designed to rank highlighy for this keyword. This should leverage the keywords, content provided, and your knowledge of the subject."))
        // }));
        const parserFromZod = StructuredOutputParser.fromZodSchema(z.object({
                blogTitle: z.string().describe("Write an SEO optimized title for a blog post which contains the keyword and is relevant to the content provided"),
                lsiKeywords: z.string().describe("What are 5 other comma separated keywords that are semantically relevant to the keyword provided. For example, the keyword 'credit cards' should return: money, credit score, credit limit, loans, interest rate."),
                headers: z.array(z.string().describe("Write a list of ten headers that act as a blueprint for a blog post designed to rank highlighy for this keyword. This should leverage the keywords, content provided, and your knowledge of the subject."))
        }));
        const formatInstructions = parserFromZod.getFormatInstructions()
        const template = `You are worldclass SEO expert. You have been hired by a company to write a blog. The company wants to rank for the keyword "${keyword}". The blog is about "${this.subject}"${(this.content) && ` and has the following specifications: "${this.content}"`}. \n{format_instructions}`;
        const prompt = new PromptTemplate({template: template, inputVariables: [], partialVariables: { format_instructions: formatInstructions }});
        const input = await prompt.format();
        console.log(input);
        const model = new ChatOpenAI({modelName: "gpt-3.5-turbo-16k", temperature: 0.1, maxTokens: 6000, openAIApiKey: this.openAIKey});
        const response = await model.call([new HumanChatMessage(input)]);
        const parsed = await parserFromZod.parse(response.text)   
        console.log(parsed);
        const { blogTitle, lsiKeywords, headers } = parsed;
        return { blogTitle, lsiKeywords, keyword, headers };
      };
}

module.exports = { LongTailResearcher };