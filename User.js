const { ChatOpenAI } = require("langchain/chat_models/openai");
const { CustomListOutputParser } = require("langchain/output_parsers");
const { PromptTemplate } = require("langchain/prompts");
const {
  HumanChatMessage,
  SystemChatMessage,
} = require("langchain/schema");
const TESTING = process.env.TESTING === "true";

class User {
    constructor(jwt, blogID, content, loops, openAIKey, variation, sendData) {
        this.jwt = jwt;
        this.blogID = blogID;
        this.content = content;
        this.loops = loops;
        this.sendData = sendData;
        this.openAIKey = openAIKey ? openAIKey : process.env.OPENAI_API_KEY;
        this.variation = variation;
        console.log(this.openAIKey);
        this.model = new ChatOpenAI({
            modelName: "gpt-3.5-turbo",
            temperature: 0.1,
            maxTokens: 3000,
            openAIApiKey: this.openAIKey,
        });
    }

    run = async () => {
        if (TESTING) {
            for (let i = 0; i < 5; i++) {
            console.log("about to send");
            this.sendData({
                title: "Welcome to the Purrfect Blog!",
                content: `${i}:    <div><p>Welcome to the Purrfect Blog!</p><p>As a cat lover, I know how important it is to stay up-to-date on all things feline. That's why I created this blog - to share my love of cats with the world!</p><p>Here, you'll find everything from cute cat videos to informative articles on cat health and behavior. I'll also be sharing my own experiences as a cat owner, so you can get to know me and my furry friends a little better.</p><p>So, whether you're a seasoned cat owner or just a cat enthusiast, I hope you'll find something here that you love. Thanks for stopping by!</p></div>`,
                url: "https://www.blogger.com/profile/05904937201937380783",
                type: "success",
            });
            await new Promise((resolve) => setTimeout(resolve, 1000));
            }
            this.sendData({ type: "ending", content: "Process Complete" });
        } else {
            console.log("running");

            // Writing all the titles
            const titles = writeTitles();
            console.log(`Done writing titles... ${titles}`);
            var errorCount = 0;

            // Writing and posting blog posts for each title
            for (let i = 0; i < this.loops; i++){

                // Writing a blog post
                const title = titles[i];
                const post = await this.writePost(title);
                console.log(`Done writing post for ${title}... ${post}`);
                if (post === "Formatting error"){
                    errorCount++;
                    this.handleError(post, errorCount);
                    continue; // do not post the error to the blog
                } else {
                    this.sendData(post);
                }

                // Posting the blog post
                var result;
                if (this.variation === "blogger") {
                    result = await this.postToBlogger(post, title);
                } else {
                    result = await this.postToWordpress(post, title);
                }
                console.log(`Done posting: ${result}`);        
                if (
                    result === "Error posting to blogger" ||
                    result === "Error posting to wordpress"
                ) {
                    errorCount++;
                    this.handleError(result, errorCount);
                } else {
                    this.sendData(result);
                }
            }
            this.sendData({ type: "ending", content: "Process Complete" });
            return;
        }
    };

    handleError = async (err, errorCount) => {
        console.log(err);
        this.sendData({ type: "error", error: err });
        if (errorCount > 5) {
            this.sendData({
                type: "ending",
                content: "To many errors, ending the program",
            });    
            break;
        }
        return errorCount;
    }

    writeTitles = async () => {
        console.log("Writing titles...");
        const parser = new CustomListOutputParser({
            length: this.loops,
            separator: "\n",
          });
        const formatInstructions = parser.getFormatInstructions();
        const prompt = new PromptTemplate({
            template: `Provide an unordered list of length ${this.loops} of niche blog titles:\n It's a blog about "{subject}". \n{format_instructions} The titles should not be number.`,
            inputVariables: ["subject"],
            partialVariables: { format_instructions: formatInstructions },
        });
        const input = await prompt.format({
            subject: this.content,
        });
        var titles = null;
        try {
            const response = await this.model.call([new HumanChatMessage(input)]);
            console.log(response);
            titles = response.text.split("\n");
        } catch (e) {
            console.log("we had an error");
            console.log(e);
            this.sendData({
              type: "ending",
              content: "To many errors, ending the program",
            });
            return;
        }
        return titles;
    }
  
    writePost = async (title) => {
      console.log(`Writing post for ${title}`);
      const input = `Write a blog post in HTML given the title: ${title}. Here is a description and guidance about the blog as a whole:\n It's a blog about ${this.content}\n\n\n. Formatting Instructions: Write only HTML. Start and end with a div, the content will be added inside the body tags. Give the blog structure with various html headers and lists as needed. DO NOT SAY THE TITLE. YOU SHOULD START WITH THE FIRST CONTENT SENTENCE, WHICH SHOULD BE A DIV, then a p tag, then the first sentence.`;
      const messages = [
        new SystemChatMessage(
          "You are an AI assitant that is a world class writer. You are given a blog title and a description/guidance about the blog, then you write a blog post. You write all content only in valid HTML"
        ),
        new HumanChatMessage(input),
      ];
      var htmlContent = null;
      try {
        const response = await this.model.call(messages);
        console.log(response);
        htmlContent = response.text;
      } catch (e) {
        return "Formatting error";
      }
      console.log(htmlContent);
      if (!htmlContent) {
        return "Formatting error";
      }
      return htmlContent;
    };
  
    postToWordpress = async (content, title) => {
      console.log("at post to wordpres");
      const response = await fetch(
        `https://public-api.wordpress.com/rest/v1/sites/${this.blogID}/posts/new`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.jwt}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: content,
          }),
        }
      );
      if (response.status !== 200) {
        console.log(response);
        return "Error posting to wordpress";
      } else {
        const result = await response.json();
        console.log(result);
        return {
          title: title,
          content: content,
          url: result.URL,
          type: "success",
        };
      }
    };
  
    postToBlogger = async (content, title) => {
      const response = await fetch(
        `https://www.googleapis.com/blogger/v3/blogs/${this.blogID}/posts/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.jwt}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            kind: "blogger#post",
            blog: {
              id: this.blogID,
            },
            title: title,
            content: content,
          }),
        }
      );
      if (response.status !== 200) {
        console.log(response);
        return "Error posting to blogger";
      } else {
        const result = await response.json();
        console.log(result);
        return {
          title: title,
          content: content,
          url: result.url,
          type: "success",
        };
      }
    };
}

module.exports = {
    User,
};