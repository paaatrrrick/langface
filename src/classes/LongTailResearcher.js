const { ChatOpenAI } = require("langchain/chat_models/openai");
const { PromptTemplate } = require("langchain/prompts");
const { HumanChatMessage, SystemChatMessage } = require("langchain/schema");
const { z } = require("zod");
const { StructuredOutputParser, CustomListOutputParser } = require("langchain/output_parsers");
const { parse } = require("path");
const { dummyBlueprint } = require("../constants/dummyData");
const AgentDB = require("../mongo/agent");
const PostDB = require("../mongo/post");
class LongTailResearcher {
    constructor(subject, loops=450, config, openAIApiKey, blogMongoID, BFSOrderedArrayOfPostMongoID, demo) {
        this.subject = subject;
        if(demo){
        this.loops = 3;
        }
        else{
          this.loops = loops;
        }
        this.config = config;
        this.openAIApiKey = openAIApiKey;
        this.hasInitialized = false;
        this.LongTailKeywords = [];
        this.blogMongoID = blogMongoID;
        this.BFSOrderedArrayOfPostMongoID = BFSOrderedArrayOfPostMongoID;
    }


    generatePostsTree = async () => {
      await this.generateKeywords();      
      // Put 1 blog post in posts DB with blueprint (no parent because it's the top post), push mongoID to parents queue
      // store mongoID in agent.BFS ordered array of mongoIDs + 
      // set "topPostID" property of agent in DB to top mongoID 
      //
      // While queue not empty:
      //    parentMongoID = pop
      //    For # of children:
      //        put blog post in DB with blueprint + parent ID 
      //        push mongoID to queue 
      //        store mongoID in agent.BFS ordered array of mongIDs
      //        update .children of the parent
      // 
      let currBlueprint = this.getNextBlueprint();     
      let currPost = await PostDB.createPost({blueprint: currBlueprint});
      this.BFSOrderedArrayOfPostMongoID.push(currPost._id);
      await AgentDB.updateBlog(this.blogMongoID, {topPostID: this.blogMongoID, BFSOrderedArrayOfPostMongoID: this.BFSOrderedArrayOfPostMongoID});
      const parentsQ = [];
      parentsQ.push(currPost._id);
      while (parentsQ){
        let parentMongoID = parentsQ.shift();
        for (i = 0; i < 3 /** children count hard coded until consensus*/; i++){
          let currBlueprint = this.getNextBlueprint();     
          let currPost = await PostDB.createPost({parentMongoID: parentMongoID, blueprint: currBlueprint});
          parentsQ.push(currPost._id);
          this.BFSOrderedArrayOfPostMongoID.push(currPost._id);
          await AgentDB.updateBlog(this.blogMongoID, {BFSOrderedArrayOfPostMongoID: this.BFSOrderedArrayOfPostMongoID});
          parent = PostDB.getPostById(parentMongoID);
          const childrenMongoID = parent.childrenMongoID;
          childrenMongoID.push(currPost._id);
          PostDB.updatePost(parentMongoID, {childrenMongoID: childrenMongoID});
        }
      }
      // Have all posts posted here.

      // Work Left: Generate posts, update rawHTML + url properties, go back and update internal links
      // 
      // For NextIndex in BFSOrderedArrayOfPostMongoIDs:
      //    if reached amount user wanted per day, then update NextIndex in DB and break
      //    generate top post
      //    prompt should include outlines of children post and fake links guidance
      //    update rawHTML + url in DB
      //    update parent rawHTML (switch out fake internal links) using parent ID
      // 
    }

    // TODO (Gautam): switch to getKeywords() to get keywords for Ads keyword planner OR SERP API
    generateKeywords = async () => {
        console.log("Writing titles...");
        const parser = new CustomListOutputParser({
          length: this.loops,
          separator: "\n",
        });
        const formatInstructions = parser.getFormatInstructions();
        const prompt = new PromptTemplate({
          template: `Provide an unordered list of length "{loops}" of Longtail keywords that you would expect to have few competitors and high volume traffic for a blog about "{subject}". \n{format_instructions}`,
          inputVariables: ["subject", "loops"],
          partialVariables: { format_instructions: formatInstructions },
        });
        const input = await prompt.format({
          subject: this.subject,
          loops: this.loops,
        });
        console.log(input);
        const model = new ChatOpenAI({modelName: "gpt-3.5-turbo-16k", temperature: 0, maxTokens: 3000, openAIApiKey: this.openaiKey});
        const response = await model.call([new HumanChatMessage(input)]);
        this.LongTailKeywords  = response.text.split("\n");
        return this.LongTailKeywords;
      };
    // initialize = async () => {
    //     //I want to do a loop that run the research in batches of 10. Perform batches of 10 for the number of loops. The last batch should be the remainder of the loops.
    //     const parserFromZod = StructuredOutputParser.fromZodSchema(
    //         z.array(z.string().describe(`List ${this.loops} Longtail keywords for my blog.`)
    //     ));
    //     const formatInstructions = parserFromZod.getFormatInstructions()
    //     const systemMessage =`You are a world class SEO expert who specializes in long tail keyword detections. You are hired by a company to make a list of ${this.loops} Longtail keywords that you would expect to have low competitior and high volume, making them perfect for their blog to target, meaning they would have high traffic and low competition. Clients give you the subject of their blog ${(this.content) &&` and then an very detailed specifications of what their blog, some of which might not be relevant to you.`}. Then you find the give them a list of keywords which follows the format instructions.`;
    //     const humanMessage = `Blog Subject: "${this.subject}"${(this.content) && `\n\nBLOG SPECIFICATIONS:\n\n "${this.content}" \n\n{format_instructions}`}`
    //     const humanPrompt = new PromptTemplate({template: humanMessage, inputVariables: [], partialVariables: { format_instructions: formatInstructions }});
    //     const humanInput = await humanPrompt.format();
    //     const model = new ChatOpenAI({modelName: "gpt-3.5-turbo-16k", temperature: 0, maxTokens: 6000, openAIApiKey: this.openaiKey});
    //     const response = await model.call([new SystemChatMessage(systemMessage), new HumanChatMessage(humanInput)]);
    //     const parsed = await parserFromZod.parse(response.text);
    //     this.LongTailKeywords = parsed;
    //     return this.LongTailKeywords;
    // }

    getNextBlueprint = async () => {
        if (process.env.MOCK_RESEARCH === 'true') return dummyBlueprint[0];
        try {
            if (this.LongTailKeywords.length === 0) {
                return false;
            }
            const nextKeyword = this.LongTailKeywords.shift(); // get first thing by shifting left
            return await this.generateBlueprint(nextKeyword);
        } catch (error) {
            console.log(error);
            throw new Error('Error finding the best longtail keyword');
        }
    }


    generateBlueprint = async (keyword) => {
        // const parserFromZod = StructuredOutputParser.fromZodSchema(z.object({
        //       usableKeyword: z.string().describe("A boolean, true if the keyword could be used in a title of a blog post for the config provided. Otherwise false"),
        //       blogTitle: z.number().describe("If usableKeyword is false, write NA. Otherwise, write an SEO optimized title for a blog post which contains the keyword and is relevant to the config provided"),
        //       lsiKeywords: z.number().describe("If usableKeyword is false, write NA. Otherwise, what are 5 other comma separated keywords that are semantically relevant to the keyword provided. For example, the keyword 'credit cards' should return: money, credit score, credit limit, loans, interest rate."),
        //       headers: z.array(z.string().describe("If usableKeyword is false, write NA. Write a list of ten headers that act as a blueprint for a blog post designed to rank highlighy for this keyword. This should leverage the keywords, config provided, and your knowledge of the subject."))
        // }));
        const parserFromZod = StructuredOutputParser.fromZodSchema(z.object({
                blogTitle: z.string().describe("Write an SEO optimized title for a blog post which contains the keyword and is relevant to the config provided"),
                lsiKeywords: z.string().describe("What are 5 other comma separated keywords that are semantically relevant to the keyword provided. For example, the keyword 'credit cards' should return: money, credit score, credit limit, loans, interest rate."),
                headers: z.string().describe("What are ten comma seperated headers that act as a blueprint for a blog post designed to rank highlighy for this keyword. This should leverage the keywords, config provided, and your knowledge of the subject.")
        }));
        const formatInstructions = parserFromZod.getFormatInstructions()
        const template = `You are worldclass SEO expert. You have been hired by a company to write a blog. The company wants to rank for the keyword "${keyword}". The blog is about "${this.subject}"${(this.config) && ` and has the following specifications: "${this.config}"`}. \n\n{format_instructions}`;
        const prompt = new PromptTemplate({template: template, inputVariables: [], partialVariables: { format_instructions: formatInstructions }});
        const input = await prompt.format();
        const model = new ChatOpenAI({modelName: "gpt-3.5-turbo-16k", temperature: 0, maxTokens: 6000, openAIApiKey: this.openaiKey});
        const response = await model.call([new HumanChatMessage(input)]);
        const parsed = await parserFromZod.parse(response.text)   
        const { blogTitle, lsiKeywords, headers } = parsed;
        console.log(parsed);
        return { blogTitle, lsiKeywords, keyword, headers };
      };

      rewriteBlueprint = async(blueprint) => {
        const parserFromZod = StructuredOutputParser.fromZodSchema(z.object({
          blogTitle: z.string().describe(`Write an SEO optimized title for a blog post which contains the keyword and is relevant to the config provided. Your title should not be similar to ${blueprint.blogTitle}.`),
          lsiKeywords: z.string().describe(`What are 5 other comma separated keywords that are semantically relevant to the keyword provided. For example, the keyword 'credit cards' should return: money, credit score, credit limit, loans, interest rate. Your LSI keywords should not be similar to ${blueprint.lsiKeywords}.`),
          headers: z.string().describe(`What are ten comma seperated headers that act as a blueprint for a blog post designed to rank highlighy for this keyword. This should leverage the keywords, config provided, and your knowledge of the subject. Your headers should not be similar to ${blueprint.headers}`)
        }));
        const formatInstructions = parserFromZod.getFormatInstructions()
        const template = `You are worldclass SEO expert. You have been hired by a company to write a blog. The company wants to rank for the keyword "${keyword}". The blog is about "${this.subject}"${(this.config) && ` and has the following specifications: "${this.config}"`}. \n\n{format_instructions}`;
        const prompt = new PromptTemplate({template: template, inputVariables: [], partialVariables: { format_instructions: formatInstructions }});
        const input = await prompt.format();
        const model = new ChatOpenAI({modelName: "gpt-3.5-turbo-16k", temperature: 0, maxTokens: 6000, openAIApiKey: this.openaiKey});
        const response = await model.call([new HumanChatMessage(input)]);
        const parsed = await parserFromZod.parse(response.text)   
        const { blogTitle, lsiKeywords, headers } = parsed;
        console.log(parsed);
        const keyword = blueprint.keyword;
        return { blogTitle, lsiKeywords, keyword, headers };
      }
}

module.exports = { LongTailResearcher };