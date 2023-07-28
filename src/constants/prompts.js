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

// Then you will generate the HTML for a blog post written in first-person (as though you are the business owner) such that people who look up the question it addresses will find the article useful and will become interested in the business. 

// ${(parent?.url && parent?.blueprint?.blogTitle) ? `-You MUST include the following <a> tag as an in-context reference in your blog: <a href=${parent.url}>${parent.blueprint.blogTitle}</a>. In-context means naturally placed in the middle of a sentence under a relevant header.\n` : ''}
//${(childrenTitles) && `-You MUST include exactly ${childrenTitles.length} additional <a> tags with the following as href: ${arrayToString(childrenTitles)}. The <a> tags should be dispersed throughout the blog in-context. The tags should not just be crammed in at the end. DO NOT INCLUDE ANY MORE THAN  ${childrenTitles.length} ADDTIONAL TAGS.`}


// Include a <meta> tag:

// -In HTML's <head> & summarizes page.
// -Informative, relevant & search display-friendly length.
// -No generic or keyword-only descriptions.
// -No content duplication.
// -Distinct.




const newBlogPost = (keyword, lsiKeyword, headers, previousArticles, imageNames, businessData, urls) => {
  let prompt = `You are a marketing blog writer.

  I will give you (1) some context about the business you are marketing (2) the title of your blog post (3) guidelines for writing a Google optimal blog post (4) additional content guidlines

  Then you will generate the HTML for a blog post written such that people who look up the question it addresses will find the article useful and will become interested in the business. 

  1) Here is the relevant data about the business:
  {
  Name: ${businessData.name},
  productDescription: ${businessData.product},
  valueProposition: ${businessData.valueProposition},
  uniqueInsights:  ${businessData.insights.toString()},
  }

  2) The title of your blog post should be: ${keyword} 

  3) Follow these Google-Optimal Writing Guidelines:

  Content:
  
  Include Headings:

  -Highlight topics & structure content.
  -Outline-like planning.
  -Avoid unhelpful text.
  -Use <em>/<strong> for emphasis.
  -Consistent size progression.
  -Use wisely; avoid overuse/confusion.
  -Concise & structurally prioritized.
  -Include TEN unique headings

  -Clear & readable.
  -Well-structured with topic divisions.
  -Original & user-centric.
  -Highlight expertise & cite sources.
  -Comprehensive, unique insights, & trustworthy.
  -Descriptive, accurate titles.
  -Reference quality; prioritize quality.
  -Define primary focus.
  -Inform & satisfy readers.

  4) Follow these additional content guidelines:
  -Title your introduction or conclusion headings/paragraphs creatively. Do not use the words “Introduction” or “Conclusion”.
  -MUST use subheadings, lists, or tables. 
  -ABSOLUTELY MUST include a table of contents with links that jump to the headers near the start of the post. 
  -EACH of the TEN heading MUST have 3 paragraphs with 10 sentences with 10 words each for a total of 1000 words while maintaining your readability, succinctness, engagingness, and coherence. Include so much insightful information and so many useful and entertaining facts that you naturally meet the word count. Often you don’t meet the word count, so be extra sure that include at least 10 sentences and 3 paragraphs for each of the the headings. Again, you MUST include 10 sentences and 3 paragraphs for each of the 10 heading.
  -While you should number the headers in your head, do not number the headers in the blog or state they are headers. Just say the header's title. Do not state the string 'header' in your headers. They should be immediately digestable in the article.
  -Generate a complete post. Do not ask me to fill things in.
  -Include expert-level information (things beyond what the layman knows). Incorporate the business insights.
  -Include real-world examples whenever applicable.
  -Do not make anything up. No fictional or fake quotes, studies, authors, links, news etc. You absolutely must be sure it’s real.
  -Don’t focus too much on selling the business, most of your content should be thoroughly answering the question. For example, you should include alternative solutions and compare them.
  -Do not include a discussion of the business if it is not relevant to answering the main question.
  -You must specific actionable step-by-step instructions to address the problem.
  ${urls.length > 2 && `-Include EVERY url in this list throughout this article EXACTLY once: ${urls}. Link to them with an <a> tag and set the href to the url. Place them accordingly based on their descriptions.\n`}
  ${(imageNames && imageNames.length) && `-The blog should have EXACTLY ${imageNames.length} img tags in the blog. One at the close to the beginning and one close to the end. They should have the following src's respsectively: ${arrayToString(imageNames)}. Each img should have inline styles for a width and height, which are between 256px and 1280px.\n`}
  -Output only valid HTML. Add inline styles of margin and padding to headers and paragraphs to add elegant spacing. Start with an article tag and end with its respective closing article tag.
  -Above all, your job is to answer the specific question as comprehensively as possible and improve the end-user’s life.`;
  return prompt;

  }
  const blogPost = (keyword, lsiKeyword, title, headers, config, previousArticles, imageNames, parent, childrenTitles=undefined) => {
    var previousArticlesString = `-Add a tags throughout the blog to reference these blog articles you previously wrote: ${arrayToString(previousArticles)}.\n`;
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
    -The blog should have EXACTLY ${imageNames.length} img tags in the blog. One at the close to the beginning and one close to the end. They should have the following src's respsectively: ${arrayToString(imageNames)}. Each img should have inline styles for a width and height, which are between 256px and 1280px. \n
    -Output only valid HTML. Add inline styles of margin and padding to headers and paragraphs to add elegant spacing. DO NOT STATE THE TITLE. Start with an article tag and then an h2 tag. \n
    ${(parent?.url && parent?.blueprint?.blogTitle) ? `-You MUST include the following <a> tag as an in-context reference in your blog: <a href=${parent.url}>${parent.blueprint.blogTitle}</a>. In-context means naturally placed in the middle of a sentence under a relevant header.\n` : ''}
    ${(childrenTitles) && `-You MUST include exactly ${childrenTitles.length} additional <a> tags with the following as href: ${arrayToString(childrenTitles)}. The <a> tags should be dispersed throughout the blog in-context. The tags should not just be crammed in at the end. DO NOT INCLUDE ANY MORE THAN  ${childrenTitles.length} ADDTIONAL TAGS.`}
    `
};
//  -The blog should have EXACTLY ${imageNames.length} img tags in the blog. One at the close to the beginning and one close to the end. They should have the following src's respsectively: ${arrayToString(imageNames)}. Each img should have inline styles for a width and height, which are between 256px and 1280px. \n


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


module.exports = { newBlogPost, blogPost, text2ImgPrompt };