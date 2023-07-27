const { ChatOpenAI } = require("langchain/chat_models/openai");
const { PromptTemplate } = require("langchain/prompts");
const { HumanChatMessage, SystemChatMessage } = require("langchain/schema");
const { z } = require("zod");
const { StructuredOutputParser, CustomListOutputParser } = require("langchain/output_parsers");
const { dummyBlueprint } = require("../constants/dummyData");
const AgentDB = require("../mongo/agent");
const PostDB = require("../mongo/post");
class LongTailResearcher {
    constructor(subject, loops=450, config, openAIApiKey, blogMongoID, BFSOrderedArrayOfPostMongoID, demo = false) {
        this.subject = subject;
        this.loops = loops;
        this.config = config;
        this.openAIApiKey = openAIApiKey;
        this.hasInitialized = false;
        this.demoKeywords = [];
        this.blogMongoID = blogMongoID;
        this.BFSOrderedArrayOfPostMongoID = BFSOrderedArrayOfPostMongoID;
        this.demo = demo;
        this.childrenCount = 3; /** children count hard coded until consensus*/
        this.keywords = [];
    }


    // generateKeywords, inLoop: generateOutline + makePost & Post it.
    generatePostsTree = async () => {
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
      let seedKeywordArr = await this.getKeywords(1);
      let currKeyword = seedKeywordArr[0];
      let currPost = await PostDB.createPost({blueprint: {keyword: currKeyword}});
      this.BFSOrderedArrayOfPostMongoID.push(currPost._id);
      await AgentDB.updateBlogSpecParam(this.blogMongoID, {topPostID: this.blogMongoID, BFSOrderedArrayOfPostMongoID: this.BFSOrderedArrayOfPostMongoID});
      const parentsQ = [];
      parentsQ.push(currPost._id);
      let postCount = 1;
      while (postCount <= parseInt(this.loops)){
        let parentMongoID = parentsQ.shift();
        let childrenKeywords = await this.getKeywords(this.childrenCount, currKeyword);
        for (let i = 0; i < childrenKeywords.length; i++){
          currKeyword = childrenKeywords[i];
          let currPost = await PostDB.createPost({parentMongoID: parentMongoID, blueprint: {keyword: currKeyword}});
          parentsQ.push(currPost._id);
          this.BFSOrderedArrayOfPostMongoID.push(currPost._id);
          await AgentDB.updateBlogSpecParam(this.blogMongoID, {BFSOrderedArrayOfPostMongoID: this.BFSOrderedArrayOfPostMongoID});
          let parent = await PostDB.getPostById(parentMongoID);
          const childrenMongoID = parent.childrenMongoID;
          childrenMongoID.push(currPost._id);
          await PostDB.updatePost(parentMongoID, {childrenMongoID: childrenMongoID});
        }
        postCount += 3;
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
    getKeywords = async(count, subject=this.subject) => {
        const tree = `Parent (Root) Query: 
        - Dustless blasting techniques
        
        Children Queries for "Dustless blasting techniques":
        1. Dustless blasting techniques for automotive restoration
        2. Environmental impact of dustless blasting methods
        3. Comparison of wet and dry dustless blasting techniques
        
        Children Queries for "Dustless blasting techniques for automotive restoration":
        1. Advantages of using dustless blasting on classic cars
        2. How dustless blasting can prevent metal warping in autos
        3. Safety measures to consider in automotive dustless blasting
        
        Children Queries for "Environmental impact of dustless blasting methods":
        1. Eco-friendly abrasives used in dustless blasting
        2. Water waste management in dustless blasting operations
        3. Air quality concerns with dustless blasting
        
        Children Queries for "Comparison of wet and dry dustless blasting techniques":
        1. Effectiveness of dry dustless blasting on concrete surfaces
        2. Benefits of wet dustless blasting in humid climates
        3. Cost analysis: wet vs. dry dustless blasting equipment
        
        Children Queries for "Advantages of using dustless blasting on classic cars":
        1. Preserving original paint layers with dustless blasting
        2. Dustless blasting for rust removal in vintage vehicles
        3. Time efficiency: dustless blasting in car restorations
        `
        const systemMessage = `I am trying to generate a tree of Google Search queries. I will give you a parent query and ask you to generate 3 children search queries. I want each of the children queries to add their own unique meaningful twists to the parent query and be very different from the parent query as well as from each other. My end goal is the root query of the tree should be extremely different from the leaf queries. The following is an example of such a tree: ${tree}`;
        const parser = new CustomListOutputParser({
          length: count,
          separator: "\n",
        });
        const formatInstructions = parser.getFormatInstructions();
        if (subject === this.subject){
          var template = `Provide an unordered list of length "{count}" search queries related to "{subject}". This will be the root query for a tree of Google Search queries. \n{format_instructions}`
        }
        else {
          var template = "Provide an unordered list of length {count} unique children search queries for the parent query {subject}. You have already generated the following queries: {keywords} so stray away from them. \n{format_instructions}"
        }
        const prompt = new PromptTemplate({
          template: template,
          inputVariables: ["count", "subject",/* "mainsubject",*/ "keywords"],
          partialVariables: { format_instructions: formatInstructions },
        });
        const input = await prompt.format({
          count: count,
          subject: subject,
          // mainsubject: this.subject,
          keywords: this.keywords.toString()
        });
        const model = new ChatOpenAI({modelName: "gpt-3.5-turbo-16k", temperature: 0, maxTokens: 3000, openAIApiKey: this.openaiKey});
        const response = await model.call([new SystemChatMessage(systemMessage), new HumanChatMessage(input)]);
        const keywords  = response.text.split("\n");
        console.log(keywords);
        this.keywords.concat(keywords);
        return keywords;
    }

    getNextBlueprint = async () => {
        if (process.env.MOCK_RESEARCH === 'true') return dummyBlueprint[0];
        try {
            if (this.demo && !this.hasInitialized) {
              this.demoKeywords = await this.getKeywords(this.loops);
              this.hasInitialized = true;
            } 
            if (this.demoKeywords.length === 0) {
                return false;
            }
            const nextKeyword = this.demoKeywords.shift(); // get first thing by shifting left
            const blueprint = await this.generateBlueprint(nextKeyword);
            return blueprint;
        } catch (error) {
            console.log(error);
            throw new Error('Error finding the best longtail keyword');
        }
    }


    generateBlueprint = async (keyword, post=undefined) => {
        if (!this.demo) await AgentDB.incrementNextPostIndex(this.blogMongoID);
        if (post?.blueprint?.blogTitle){
          await this.generateBlueprintForChildren(post);
          return post.blueprint;
        }
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
        try{
        const response = await model.call([new HumanChatMessage(input)]);
        const parsed = await parserFromZod.parse(response.text)   
        const { blogTitle, lsiKeywords, headers } = parsed;
        const blueprint = { blogTitle, lsiKeywords, keyword, headers };
        if (post){
          await PostDB.updatePost(post._id, {blueprint: blueprint});
          await this.generateBlueprintForChildren(post);
        }
        return blueprint;
        }catch(e){
          console.log(e);
          return {blogTitle:"BPerror", lsiKeywords:"BPerror", keyword:"BPerror", headers:"BPerror"};
        }
      };

      generateBlueprintForChildren = async(parent) => {
        for (let i = 0; i < parent.childrenMongoID.length; i++){
          const currChildID = parent.childrenMongoID[i];
          const currChild = await PostDB.getPostById(currChildID);
          const keyword = currChild.blueprint.keyword;
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
          try{
            const response = await model.call([new HumanChatMessage(input)]);
            const parsed = await parserFromZod.parse(response.text)   
            const { blogTitle, lsiKeywords, headers } = parsed;
            const blueprint = { blogTitle, lsiKeywords, keyword, headers };
            await PostDB.updatePost(currChildID, {blueprint: blueprint});
          }catch(e){
            console.log(e);
            return {blogTitle:"BPerror", lsiKeywords:"BPerror", keyword:"BPerror", headers:"BPerror"};
          }
        }
      }

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
        const keyword = blueprint.keyword;
        return { blogTitle, lsiKeywords, keyword, headers };
      }
}

module.exports = { LongTailResearcher };