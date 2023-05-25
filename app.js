const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const app = express();
const { ChatOpenAI } = require("langchain/chat_models/openai");
const { StructuredOutputParser } = require("langchain/output_parsers");
const { PromptTemplate } = require("langchain/prompts");
const { HumanChatMessage, SystemChatMessage, AIChatMessage } = require("langchain/schema");
const bodyParser = require('body-parser');
const TESTING = false;



app.use(bodyParser.json(), bodyParser.urlencoded({ extended: false }))
app.use(cors());


function extractJson(json) {
    try {
        JSON.parse(json);
        return json
    } catch (e) {
        var startPattern = '```json';
        var endPattern = '```';
        let startIndex = json.indexOf(startPattern);
        let endIndex = json.lastIndexOf(endPattern);
        if (startIndex !== -1 && endIndex !== -1) {
            let cleanedString = json.slice(startIndex + startPattern.length, endIndex);
            return cleanedString.trim();
        }
        var startPattern = '{';
        var endPattern = '}';
        startIndex = json.indexOf(startPattern);
        endIndex = json.lastIndexOf(endPattern);
        if (startIndex !== -1 && endIndex !== -1) {
            let cleanedString = json.slice(startIndex + startPattern.length, endIndex);
            return cleanedString.trim();
        }
        return json;
    }
}

//create a userClass
class User {
    constructor(jwt, blogID, content, loops, sendData) {
        console.log('creating user');
        console.log(jwt, blogID, content, loops, sendData);
        this.jwt = jwt;
        this.blogID = blogID;
        this.content = content;
        this.loops = loops;
        this.sendData = sendData;
        this.model = new ChatOpenAI({ modelName: 'gpt-3.5-turbo', temperature: 0.35, openAIApiKey: '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' });
        // this.model = new OpenAI({ temperature: 0.2, openAIApiKey: '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' });

    }
    run = async () => {
        var errorCount = 0;
        var i = 0;
        console.log('running');
        while (i < this.loops) {
            console.log('looping')
            if (TESTING) {
                console.log('about to send');
                this.sendData({
                    title: 'Welcome to the Purrfect Blog!', content:
                        `${i}:    <div><p>Welcome to the Purrfect Blog!</p><p>As a cat lover, I know how important it is to stay up-to-date on all things feline. That's why I created this blog - to share my love of cats with the world!</p><p>Here, you'll find everything from cute cat videos to informative articles on cat health and behavior. I'll also be sharing my own experiences as a cat owner, so you can get to know me and my furry friends a little better.</p><p>So, whether you're a seasoned cat owner or just a cat enthusiast, I hope you'll find something here that you love. Thanks for stopping by!</p></div>`,
                    url: 'https://www.blogger.com/profile/05904937201937380783', type: 'success'
                });
                await new Promise(resolve => setTimeout(resolve, 1000));
                i++;
            } else {
                const result = await this.writePost();
                if (result === 'Formatting error' || result === 'Error posting to blogger') {
                    console.log('error');
                    errorCount++;
                    this.sendData({ type: 'error', error: result });
                    if (errorCount > 5) {
                        this.sendData({ type: 'ending', error: "To many errors, ending the program" });
                        break;
                    }

                } else {
                    this.sendData(result);
                    i++;
                }
            }
        }
        console.log('loop ended')
    }

    writePost = async () => {
        const input = 'Write a blog post HTML and a title for the following prompt ' + this.content + 'Output format: only a valid JSON string in the format of ```json{"body": "CONTENT_HERE", "title": "TITLE_HERE"}```. An example output (assume a much large body) would be ```json{"body": "<div><p>This is a blog post</p></div>", "title": "My Blog Post"}```.';
        console.log(input);
        const messages = [
            new HumanChatMessage(input),
        ]
        const response = await this.model.call(messages);

        var answer = response.text;
        //trim whitespace
        answer = answer.trim();
        console.log(answer);
        const jsonString = extractJson(answer);
        const json = JSON.parse(jsonString);
        console.log('4')
        console.log(json);
        const title = json.title || json.Title || json.TITLE;
        const body = json.body || json.Body || json.BODY;
        if (!title || !body) {
            return 'Formatting error'
        }
        return await this.postToBlogger(body, title);
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
            return { title, content, url: response.selfLink, type: 'success' };
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
