import LibrarySvg from "./assets/library-outline.svg";
import ImageSvg from "./assets/image-outline.svg";
import StoreFrontSvg from "./assets/storefront-outline.svg";
const TESTING = (process.env.REACT_APP_RUNNING_LOCAL === "true");
const constants = {
  url: TESTING ? "http://localhost:8000" : "https://langface.up.railway.app",
  localUrl: TESTING ? "http://localhost:3000" : "https://langface.ai",
  WP_CLIENT_ID: 87563,
  maxWordpressPosts: 8,
  maxBloggerPosts: 25,
  GOOGLE_CLIENT_ID: "406198750695-i6p3k9r380io0tlre38j8jsvv2o4vmk7.apps.googleusercontent.com",
  authCookieName: "langface-token",
};


const defualtPills = [
  {
    version: "initializing",
    title: "Research",
    img: LibrarySvg,
    content: "For each blog post, our AI agent studies top performing articles in your niche to use as a model & identify gaps.",
  },
  {
    version: "initializing",
    title: "Image Generation",
    img: ImageSvg,
    content: "Our agent generates unique images to compliment the message of your blog and improve your search ranking.",
  },
  {
    version: "initializing",
    title: "Text Generation",
    img: StoreFrontSvg,
    content: `A Search Engine Optimized article is posted to your blog with specific long tail keywords & an optimal HTML header structure.`,
  }
];

const sampleBlog = {
  loops: 3,
  subject: "Adventures of Huckleberry Finn Book",
  content: "Have a fun and playful tone. Express the benefits of how reading this book is beneficial to the reader. Link to the book on Amazon: https://www.amazon.com/Adventures-Huckleberry-SeaWolf-Illustrated-Classic. Write everything for SEO standards. Refer to other similar books and compare them."
}

export default constants;
export { defualtPills, sampleBlog };