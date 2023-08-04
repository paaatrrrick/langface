const { ChatOpenAI } = require("langchain/chat_models/openai");
const { PromptTemplate } = require("langchain/prompts");
const { HumanChatMessage, SystemChatMessage } = require("langchain/schema");
const { z } = require("zod");
const { StructuredOutputParser, CustomListOutputParser } = require("langchain/output_parsers");
const { dummyBlueprint } = require("../constants/dummyData");
const AgentDB = require("../mongo/agent");
const PostDB = require("../mongo/post");
const Replicate = require("replicate");

class LongTailResearcher {
    constructor(subject, loops=450, config, openAIApiKey, blogMongoID, BFSOrderedArrayOfPostMongoID, demo = false, businessData) {
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
        this.treeMade = false;
        this.nextKeywordsIndex = 1;
        this.businessData = businessData;
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
      while (postCount < parseInt(this.loops)){
        let parentMongoID = parentsQ.shift();
        console.log(postCount, this.loops)
        let childrenKeywords = await this.getKeywords(this.childrenCount, currKeyword);
        for (let i = 0; i < childrenKeywords.length; i++){
          if (postCount === parseInt(this.loops)) {
            break;
          }
          currKeyword = childrenKeywords[i];
          let currPost = await PostDB.createPost({parentMongoID: parentMongoID, blueprint: {keyword: currKeyword}});
          parentsQ.push(currPost._id);
          this.BFSOrderedArrayOfPostMongoID.push(currPost._id);
          await AgentDB.updateBlogSpecParam(this.blogMongoID, {BFSOrderedArrayOfPostMongoID: this.BFSOrderedArrayOfPostMongoID});
          let parent = await PostDB.getPostById(parentMongoID);
          const childrenMongoID = parent.childrenMongoID;
          childrenMongoID.push(currPost._id);
          await PostDB.updatePost(parentMongoID, {childrenMongoID: childrenMongoID});
          postCount += 1;
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
    getKeywords = async(count, subject=this.subject) => {
      if (!this.treeMade) {
        const exampleTree = 
        `
        What Is SEO? A Comprehensive Guide for 2023,
          10 Best Website Builder Options for 2023 and How to Choose the Best One,
              
              Website Builder vs Web Hosting,
                  Understanding the Technicalities: An In-Depth Look into Web Hosting Infrastructure,
                  The Budget Talk: Pricing Comparisons of Website Builders and Web Hosts,
                  The Speed Factor: How Hosting Impacts Your Site's Performance,
              
              Website Builder vs Web Developer,
                  Bridging the Gap: Leveraging Developer Skills in Website Builders,
                  Customization vs Templates: Which Approach Suits Your Business?,
                  Maintenance Aspects: Pros and Cons of Using Developers vs Website Builders,
      
              15 Best StoryBrand Website Examples to Help You Connect With Customers,
                  Engaging Visuals: Top StoryBrand Design Trends for 2023,
                  Maximizing User Engagement: StoryBrand Call-to-Action Best Practices,
                  Diversifying Your Brand Narrative: Incorporating Diverse Voices in Your StoryBrand,
      
      
          B2B Website Best Practices to Enhance Client Experience and Generate Leads + Examples,
              Strategizing Lead Magnets: Effective B2B Offerings for 2023,
                  The Psychology Behind B2B Offers: What Attracts Enterprises Most?,
                  Crafting the Perfect B2B Landing Page: A Step-by-step Guide,
                  Lead Nurturing in B2B: The Art of Maintaining Client Interest,
      
              B2B Client Testimonials: How Authentic Reviews Boost Business Credibility,
                  Video vs Text Testimonials: Which Resonates More with B2B Clients?,
                  Curating Impactful B2B Testimonials: Best Practices and Common Pitfalls,
                  Incorporating Client Logos: Enhancing Credibility Through Visual Representation,
      
              B2B Content Strategies: Tailoring Articles and Videos for a Professional Audience,
                  Engaging the Corporate Mind: Writing B2B Articles that Resonate,
                  Video Production for B2B: Key Considerations for 2023,
                  Distribution Strategies: Getting Your B2B Content in Front of Decision Makers,
      
          8 Best WordPress Hosting in 2023 + How to Choose the Right WordPress Hosting,
              Security Aspects: Safeguarding Your WordPress Site in 2023,
                  The Role of SSL: Why Every WordPress Site Needs It,
                  Firewalls and WordPress: Best Practices for Site Safety,
                  Regular Backups: Ensuring Data Integrity for Your WordPress Site,
      
              Scalability in Hosting: Preparing Your WordPress Site for Growth,
                  Evaluating Hosting Plans: Which One Suits Your Traffic Expectations?,
                  Managing Spikes: How Good Hosting Can Handle Sudden Traffic Surges,
                  Beyond Hosting: Other Factors in Ensuring WordPress Scalability,
      
              WordPress-Specific Features: What Sets Specialized Hosting Apart,
                  1-Click Installations: The Ease of Setting up WordPress,
                  Staging Environments: Testing Changes Before Going Live,
                  Optimized Speed: How WordPress-specific Hosting Boosts Performance     
        `
        const businessData = 
        `
        productName: ${this.businessData.name},
        productDescription: ${this.businessData.product},
        valueProposition: ${this.businessData.valueProposition},
        uniqueInsightsAndExpertKnowledge: ${this.businessData.insights.toString()} 
        `
        const systemMessage = `You are a blog title generator. Specifically, you generate titles for blog marketing. Blog marketing is the strategic creation and distribution of valuable, relevant content to attract and engage a target audience, with the goal of driving traffic or conversions to your business website. You will be provided with marketing-relevant data about the business (include their expert knowledge and unique insights). Your job is to generate titles for that business’ blog marketing blog in a tree-like manner. You will start with a root title. Then you will generate 3 children titles for that root title. You will continue to generate 3 children titles for each new child until you reach the total number of titles requested. Each child title should be unique and should add its own meaningful change to the parent title such that it strays away from both the parent title as well as the root title such that the leaf titles should not be more than 1% similar to the root title.  I will now provide you with an example of such a tree of blog titles for a business that offers a web hosting platform. Their marketing-relevant data has a lot of expertise and insights in web hosting, website making, SEO, and generating leads, and this expertise guides their blog posts and titles. Here is the a list of title strings where the first title is the root and the next 3 titles are its children, followed by the 3 children of the first child, etc: ${exampleTree}`;
        const parser = new CustomListOutputParser({
          length: count,
          separator: "\n",
        });
        const formatInstructions = parser.getFormatInstructions();
        var template = "Generate a {totalcount} unique blog titles in a tree-like manner (where each parent has {childrencount} children) for a blog marketing blog for the following business: {businessdata}. You must generate {totalcount} real titles, no empty titles. \n{format_instructions}";
        const prompt = new PromptTemplate({
          template: template,
          inputVariables: ["totalcount", "childrencount", "businessdata"],
          partialVariables: { format_instructions: formatInstructions },
        });
        const input = await prompt.format({
          totalcount: parseInt(this.loops),
          childrencount: this.childrenCount,
          businessdata: businessData
        });
        const model = new ChatOpenAI({modelName: "gpt-3.5-turbo-16k", temperature: 0, maxTokens: 3000, openAIApiKey: this.openaiKey});
        const response = await model.call([new SystemChatMessage(systemMessage), new HumanChatMessage(input)]);
        console.log('r:' + response);
        const keywords  = response.text.split("\n");
        console.log(keywords);
        this.keywords.push(...keywords);
        console.log(this.keywords);
        this.treeMade = true;
        return this.keywords;
      }
      const kw = this.keywords.slice(this.nextKeywordsIndex, this.nextKeywordsIndex + 3);
      console.log("kw: " + kw);
      this.nextKeywordsIndex += 3;
      return kw;
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
        console.log('generating blueprint');
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