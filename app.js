//require dotenv
if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const app = express();
const { ChatOpenAI } = require("langchain/chat_models/openai");
const { StructuredOutputParser, CustomListOutputParser } = require("langchain/output_parsers");
const { PromptTemplate } = require("langchain/prompts");
const { HumanChatMessage, SystemChatMessage, AIChatMessage } = require("langchain/schema");
const bodyParser = require('body-parser');
const { error } = require('console');
const TESTING = false;



app.use(bodyParser.json(), bodyParser.urlencoded({ extended: false }))
app.use(cors());

//create a userClass
class User {
    constructor(jwt, blogID, content, loops, sendData) {
        this.jwt = jwt;
        this.blogID = blogID;
        this.content = content;
        this.loops = loops;
        this.sendData = sendData;
        this.model = new ChatOpenAI({ modelName: 'gpt-3.5-turbo', temperature: 0, maxTokens: 1000 });
        // this.model = new OpenAI({ temperature: 0.2, openAIApiKey: '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' });

    }
    run = async () => {
        if (TESTING) {
            for (let i = 0; i < 10; i++) {
                console.log('about to send');
                this.sendData({
                    title: 'Welcome to the Purrfect Blog!', content:
                        `${i}:    <div><p>Welcome to the Purrfect Blog!</p><p>As a cat lover, I know how important it is to stay up-to-date on all things feline. That's why I created this blog - to share my love of cats with the world!</p><p>Here, you'll find everything from cute cat videos to informative articles on cat health and behavior. I'll also be sharing my own experiences as a cat owner, so you can get to know me and my furry friends a little better.</p><p>So, whether you're a seasoned cat owner or just a cat enthusiast, I hope you'll find something here that you love. Thanks for stopping by!</p></div>`,
                    url: 'https://www.blogger.com/profile/05904937201937380783', type: 'success'
                });
                await new Promise(resolve => setTimeout(resolve, 1000));
                i++;
            }
        } else {
            console.log('running')
            const parser = new CustomListOutputParser({ length: this.loops, separator: "\n" });
            const formatInstructions = parser.getFormatInstructions();
            const prompt = new PromptTemplate({
                template:
                    `Provide an unordered and unumbered list of length ${this.loops} of catchy blog post titles for a blog called "{subject}". \n{format_instructions}`,
                inputVariables: ["subject"],
                partialVariables: { format_instructions: formatInstructions },
            });
            const input = await prompt.format({
                subject: this.content,
            });
            var titles = null;
            try {
                const response = await this.model.call([
                    new HumanChatMessage(input),
                ]);
                console.log(response)
                titles = response.text.split('\n');
            } catch (e) {
                console.log('we had an error')
                console.log(e);
                this.sendData({ type: 'ending', content: "To many errors, ending the program" });
                return;
            }
            var i = 0;
            console.log(titles);
            for (let title of titles) {
                i++;
                if (i > this.loops) {
                    break;
                }
                console.log('looop')
                console.log(title);
                var errorCount = 0;
                const result = await this.writePost(title);
                if (result === 'Formatting error' || result === 'Error posting to blogger') {
                    console.log('error');
                    errorCount++;
                    this.sendData({ type: 'error', error: result });
                    if (errorCount > 5) {
                        this.sendData({ type: 'ending', content: "To many errors, ending the program" });
                        break;
                    }
                } else {
                    this.sendData(result);
                }
            }
            this.sendData({ type: 'ending', content: "Process Complete" });
            return
        }
    }

    writePost = async (title) => {
        console.log('writing post');
        console.log(title);
        const input = `Write a blog post in HTML given the title: ${title}.  Do not restate the title. Start and end with a div, the content will be added inside the body`;
        const messages = [
            new SystemChatMessage(
                'You are an AI assitant that is a world class writer. You are given a blog title, then you write a blog post. You write all content only in valid HTML',
            ),
            new HumanChatMessage(input),
        ]
        var htmlContent = null;
        try {
            const response = await this.model.call(messages);
            console.log(response);
            htmlContent = response.text;
        } catch (e) {
            console.log('second error point');
            console.log(e);
            return 'Formatting error';
        }
        console.log(htmlContent);
        if (!htmlContent) {
            console.log('no html content');
            return 'Formatting error';
        }
        return await this.postToBlogger(htmlContent, title);
    }
    postToBlogger = async (content, title) => {
        const response = await fetch(`https://www.googleapis.com/blogger/v3/blogs/${this.blogID}/posts/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.jwt}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "kind": "blogger#post",
                "blog": {
                    "id": this.blogID
                },
                "title": title,
                "content": content
            })
        });
        if (response.status !== 200) {
            console.log(response);
            return 'Error posting to blogger';
        } else {
            const result = await response.json();
            console.log(result);
            return { title: title, content: content, url: result.selfLink, type: 'success' };
        }
    }
}



const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

let data = {};

//create a route that takes in a jwt, blogID, content, and loops and then runs the user class
app.post('/run', (req, res) => {
    console.log(req.body);
    const { jwt, blogID, content, loops } = req.body;
    const sendData = async (data) => {
        io.emit('updateData', data); // sends data to all connected sockets
    }
    const user = new User(jwt, blogID, content, loops, sendData);
    data[blogID] = user;
    user.run();
    res.send('running');
});


io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('addData', (newData) => {
        console.log('adding data');
        console.log(newData);
        const { id } = newData;
        const sendData = async (data123) => {
            socket.emit('updateData', data123); // sends data only to the connected socket
        }
        const user = new User(newData.jwt, newData.id, newData.content, newData.loops, sendData);
        data[id] = user;

        user.run();
        // if (!data[id]) data[id] = [];
        // data[id].push(newData);
    });


    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

server.listen(8000, () => console.log('Server is running on port 8000'));
