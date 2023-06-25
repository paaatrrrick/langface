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

const blogPost = (longTailKeywords, blogStrucutre, tips, headers, similarTitles, content, previousArticles, imageNames) => {
  var previousArticlesString = `Write backlinks throughout the blog to these articles as needed: ${arrayToString(nLengthArray(3, previousArticles))}.`;
  if (previousArticles.length === 0) { 
    previousArticlesString = ``;
  }
  var addReq = (!content && !previousArticlesString) ? `None` : ``;
    return `Write a blog post in HTML given the title: ${similarTitles}. Frequently use these longtail keyword: ${longTailKeywords}.
    It should follow the following structure: \n\n${blogStrucutre}.\n\n Take inspiration from using this header strucutre:\n\n ${arrayToString(headers)}. \n\n Here are some tips to help you write the post:\n\n ${tips}.
    \n\n Additional Blog Requirements: ${content}. ${previousArticlesString} ${addReq}\n\n\n 
    Formatting Instructions: The blog should be EXTREMELY LONG with roughly 2500 words, if it was raw text, this blog would take over 3 pages of times new roman 12pt font. 
    Write only HTML. Start and end with an article tag, the content will be added inside the body tags. Give the blog structure with various html headers and lists as needed. 
    Include exactly ${imageNames.length} imgs with the following src's respsectively: ${arrayToString(imageNames)}. They should be imbedded throughout the blog.
    Each img should have inline styles for a width and height, which are between 256px and 1280px. Add inline styles of margin and padding to headers and paragraphs to add elegant spacing. DO NOT STATE THE TITLE. START WITH AN ARTICLE, then a p tag, then the first sentence. Optimize every HTML aspect for SEO ranking.`;
}

const blogPostForBlogger = (longTailKeywords, blogStrucutre, tips, headers, similarTitles, content, previousArticles) => {
    var previousArticlesString = `Write backlinks throughout the blog to these articles as needed: ${arrayToString(nLengthArray(3, previousArticles))}.`;
    if (previousArticles.length === 0) { 
      previousArticlesString = ``;
    }
    var addReq = (!content && !previousArticlesString) ? `None` : ``;
      return `Write a blog post in HTML given the title: ${similarTitles}. Frequently use these longtail keyword: ${longTailKeywords}.
      It should follow the following structure: \n\n${blogStrucutre}.\n\n Take inspiration from using this header strucutre:\n\n ${arrayToString(headers)}. \n\n Here are some tips to help you write the post:\n\n ${tips}.
      \n\n Additional Blog Requirements: ${content}. ${previousArticlesString} ${addReq}\n\n\n 
      Formatting Instructions: The blog should be EXTREMELY LONG with roughly 2500 words, if it was raw text, this blog would take over 3 pages of times new roman 12pt font. 
      Write only HTML. Start and end with an article tag, the content will be added inside the body tags. Give the blog structure with various html headers and lists as needed.
       Add inline styles of margin and padding to headers and paragraphs to add elegant spacing. DO NOT STATE THE TITLE. START WITH AN ARTICLE, then a p tag, then the first sentence. Optimize every HTML aspect for SEO ranking.`;
  }


const text2ImgPrompt = (imageDescriptions) => {
    return `Attached is list of paragraphs explaining, each explaining a different photos. 
    Given the guide below on how to write a strong prompt, write a prompt for each of the ${imageDescriptions.length} images. Order you list in the same way the paragraph description appears.\n\n
    IMAGES:\n ${arrayToString(imageDescriptions)}\n\n
    HOW TO WRITE A GOOD PROMPT: \n
    Core Prompt: This is the central theme or subject of your prompt, such as "Panda" or "A warrior with a sword". It is the foundation around which the rest of the prompt is built.

    Style: This is a crucial part of the prompt that determines the artistic style of the generated image. The AI model defaults to the most common style related to the core prompt if no specific style is requested. Examples of styles include "Realistic", "Oil painting", "Pencil drawing", and "Concept art".

    Artist: To make your style more specific, you can use artists’ names in your prompt. For instance, if you want a very abstract image, you can add “in the style of Pablo Picasso” or just simply, “Picasso”.

    Finishing touches: These are additional elements added to your prompt to make it look how you envision it. Examples include "Highly-detailed", "surrealism", "trending on artstation", "triadic color scheme", "smooth", "sharp focus", "matte", "elegant", "illustration", "digital paint", "dark", "gloomy", "octane render", "8k", "4k", "washed-out colors", "sharp", "dramatic lighting", "beautiful", "post-processing", "picture of the day", "ambient lighting", "epic composition".

    Here is a list of six amazing prompts to take inspiration of:
    1: crane buckskin bracelet with crane features, rich details, fine carvings, studio lighting
    2: Cute small dog sitting in a movie theater eating popcorn watching a movie ,unreal engine, cozy indoor lighting, artstation, detailed, digital painting,cinematic,character design by mark ryden and pixar and hayao miyazaki, unreal 5, daz, hyperrealistic, octane render
    3: young Disney socialite wearing a beige miniskirt, dark brown turtleneck sweater, small neckless, cute-fine-face, anime. illustration, realistic shaded perfect face, brown hair, grey eyes, fine details, realistic shaded lighting by ilya kuvshinov giuseppe dangelico pino and michael garmash and rob rey, iamag premiere, wlop matte print, 4k resolution, a masterpiece
    4: Pope Francis wearing biker (leather jacket), 4k resolution, a masterpiece
    5: dark room with volumetric light god rays shining through window onto stone fireplace in front of cloth couch
    6: higly detailed, majestic royal tall ship on a calm sea,realistic painting, by Charles Gregory Artstation and Antonio Jacobsen and Edward Moran, (long shot), clear blue sky, intricated details, 4k\n\n`
}

const SystemChatMessageForBlog = "You are an AI assitant that is a worldclass SEO class writer. You are given a blog title and a description/guidance about the blog, then you write a blog post. You write all content only in valid HTML that is highligy optimized for SEO."



module.exports = { blogPost, SystemChatMessageForBlog, text2ImgPrompt, blogPostForBlogger };