const { arrayToString } = require("../utils/helpers");

const nLengthArray = (n, array) => {
    if (array.length <= n) return array;
    if (array.length > n) {
        let newArray = [];
        for (let i = 0; i < n; i++) {
            newArray.push(JSON.stringify(array[Math.floor(Math.random() * array.length)]));
        }
        return newArray;
    }
};


const blogPost = (keyword, lsiKeyword, title, headers, config, previousArticles, imageNames, childrenTitles=undefined) => {
  var previousArticlesString = `-Add a tags throughout the blog to reference these blog articles you previously wrote: ${arrayToString(nLengthArray(3, previousArticles))}.\n`;
  if (previousArticles.length === 0) { 
    previousArticlesString = ``;
  }
  return `
  You are an AI assitant that is a worldclass SEO class writer. Given the following list of instructions write a blog post. \n
  -Blog title: ${title}. \n
  -Use the following headers in for the blog with each being an h2: ${headers}. \n
  -EACH header MUST HAVE 3 PARAGRAPHS beneath it! EACH PARAGRAPH MUST HAVE A MINIMUM OF 8 SENTENCES!\n
  ${previousArticlesString}
  -All config in the blog should only be relvant to to articles's goal. Do not reference social media pages (twitter, instagram, youtube, etc) or other things unrelated to the config. Do not talk about about our team members or authors. \n
  -Use the following longtail keyword EXTREMELY frequently "${keyword}" as well as these other relvant keywords: "${lsiKeyword}". \n
  ${(config) && `-${config}\n`}
  ${(imageNames.length > 0) && `-Include exactly ${imageNames.length} img tag in the blog. They should have the following src's respsectively: ${arrayToString(imageNames)}. Each img should have inline styles for a width and height, which are between 256px and 1280px.\n`}
  -Output only valid HTML. Add inline styles of margin and padding to headers and paragraphs to add elegant spacing. DO NOT STATE THE TITLE. Start with an article tag and then an h2 tag.
  `
};

const blogPostForBlogger = (keyword, lsiKeyword, title, headers, config, previousArticles) => {
  return blogPost(keyword, lsiKeyword, title, headers, config, previousArticles, []);
}

const text2ImgPrompt = (imageDescriptions, style) => {
    return `Attached is list of paragraphs explaining, each explaining a different photos. 
    Given the guide below on how to write a strong prompt, write a prompt for each of the ${imageDescriptions.length} images. Order you list in the same way the paragraph description appears.\n\n
    IMAGES:\n ${arrayToString(imageDescriptions)} with each being in the ${style} style\n\n
    HOW TO WRITE A GOOD PROMPT: \n
    Core Prompt: This is the central theme or subject of your prompt, such as "Panda" or "A warrior with a sword". It is the foundation around which the rest of the prompt is built.

    Style: This is a crucial part of the prompt that determines the artistic style of the generated image. The AI model defaults to the most common style related to the core prompt if no specific style is requested. Examples of styles include "Realistic", "Oil painting", "Pencil drawing", and "Concept art".

    Artist: To make your style more specific, you can use artists’ names in your prompt. For instance, if you want a very abstract image, you can add “in the style of Pablo Picasso” or just simply, “Picasso”.

    Finishing touches: These are additional elements added to your prompt to make it look how you envision it. Examples include "Highly-detailed", "surrealism", "trending on artstation", "triadic color scheme", "smooth", "sharp focus", "matte", "elegant", "illustration", "digital paint", "dark", "gloomy", "octane render", "8k", "4k", "washed-out colors", "sharp", "dramatic lighting", "beautiful", "post-processing", "picture of the day", "ambient lighting", "epic composition".
  
    Designs should be of one things, such as an animal or object. They should not have text in them.

    Picture a scene that would convey an artist message about the subject. You're a worldclass artists, let it shine.

    Here is a list of six amazing prompts to take inspiration of. Your prompts should have a similar level of detail and creativity:
    1: crane buckskin bracelet with crane features, rich details, fine carvings, studio lighting
    2: Cute small dog sitting in a movie theater eating popcorn watching a movie ,unreal engine, cozy indoor lighting, artstation, detailed, digital painting,cinematic,character design by mark ryden and pixar and hayao miyazaki, unreal 5, daz, hyperrealistic, octane render
    3: young Disney socialite wearing a beige miniskirt, dark brown turtleneck sweater, small neckless, cute-fine-face, anime. illustration, realistic shaded perfect face, brown hair, grey eyes, fine details, realistic shaded lighting by ilya kuvshinov giuseppe dangelico pino and michael garmash and rob rey, iamag premiere, wlop matte print, a masterpiece
    5: dark room with volumetric light god rays shining through window onto stone fireplace in front of cloth couch
    6: higly detailed, majestic royal tall ship on a calm sea,realistic painting, by Charles Gregory Artstation and Antonio Jacobsen and Edward Moran, (long shot), clear blue sky, intricated details, 4k\n\n`
}


module.exports = { blogPost, text2ImgPrompt, blogPostForBlogger };