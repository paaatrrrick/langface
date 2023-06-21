const { arrayToString } = require("../utils/helpers");

//nlength array take an array of length k. If k < n, then it returns an array of length n with the same elements as the original array. If k > n, then it returns an array of length n random elements of the array. If k == n, then it returns the original array.
const nLengthArray = (n, array) => {
    if (array.length <= n) return array;
    if (array.length > n) {
        let newArray = [];
        for (let i = 0; i < n; i++) {
            newArray.push(array[Math.floor(Math.random() * array.length)]);
        }
        return newArray;
    }
};



const blogPost = (title, summary, content, imageNames, previousArticles) => {
  var previousArticlesString = `Feel free to write backlinks to these previous articles: ${arrayToString(nLengthArray(3, previousArticles))}.`;
  if (previousArticles.length === 0) { 
    previousArticlesString = ``;
  }
    return `Write a blog post in HTML given the title: ${title}. Here is a summary of the blog post: ${summary}. The blog post should be filled with a specific 
    long tail key word and other relvant LSI keywords as well for SEO. ${previousArticlesString}
    Here is a description and guidance about the blog as a whole:\n It's a blog about ${content}\n\n\nFormatting Instructions: Write only HTML. 
    Start and end with an article tag, the content will be added inside the body tags. Give the blog structure with various html headers and lists as needed. 
    Include exactly ${imageNames.length} imgs with the following src's respsectively: ${arrayToString(imageNames)}. 
    Each img should have inline styles for a width and height. DO NOT STATE THE TITLE. START WITH AN ARTICLE, then a p tag, then the first sentence. Optimize every aspect for SEO ranking. Add whatever is needed`;
}


const text2ImgPrompt = (imageDescriptions) => {
    return `Attached is list of paragraphs explaining, each explaining a different photos. 
    Given the guide below on how to write a strong prompt, write a prompt for each of the ${imageDescriptions.length} images. Order you list in the same way the paragraph description appears.\n\n
    IMAGES:\n
    ${arrayToString(imageDescriptions)}\n\n
    HOW TO WRITE A GOOD PROMPT: \n
    Core Prompt: This is the central theme or subject of your prompt, such as "Panda" or "A warrior with a sword". It is the foundation around which the rest of the prompt is built.

    Style: This is a crucial part of the prompt that determines the artistic style of the generated image. The AI model defaults to the most common style related to the core prompt if no specific style is requested. Examples of styles include "Realistic", "Oil painting", "Pencil drawing", and "Concept art".

    Artist: To make your style more specific, you can use artists’ names in your prompt. For instance, if you want a very abstract image, you can add “in the style of Pablo Picasso” or just simply, “Picasso”.

    Finishing touches: These are additional elements added to your prompt to make it look how you envision it. Examples include "Highly-detailed", "surrealism", "trending on artstation", "triadic color scheme", "smooth", "sharp focus", "matte", "elegant", "illustration", "digital paint", "dark", "gloomy", "octane render", "8k", "4k", "washed-out colors", "sharp", "dramatic lighting", "beautiful", "post-processing", "picture of the day", "ambient lighting", "epic composition".
`
}

const SystemChatMessageForBlog = "You are an AI assitant that is a worldclass SEO class writer. You are given a blog title and a description/guidance about the blog, then you write a blog post. You write all content only in valid HTML that is highligy optimized for SEO."



module.exports = { blogPost, SystemChatMessageForBlog, text2ImgPrompt };