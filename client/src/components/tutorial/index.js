import React from "react";
import "./tutorial.css";

const Template = () => {
    return (
      <div className="Tutorial">
          <h1>Getting Started with BloggerGPT</h1>
          <hr/>
          <h6>BloggerGPT is an AI agent that manages your website's SEO. By providing access to your blog and its theme, the system will create and post optimized blog articles on your behalf.</h6>
          <h2 style={{marginTop: "40px", marginBottom: '10px'}}>Quick Start</h2>
          <hr/>
          <p>1: Input the theme of your blog on the home screen.</p>
          <p>2: Provide additional details you would like the agent to consider. This could be links to include or styling suggestions.</p>
          <p>3: Specify the number of posts you want (the maximum is 3 for the demo account).</p>
          <p>4: Click Run!</p>
          <h2 style={{marginTop: "20px", marginBottom: '10px'}}>A More Detailed Start</h2>
          <hr/>
          <p>1: Go to the home screen and identify your blog's niche. For instance, if you work for Rolex, the niche would be luxury watches.</p>
          <p>2: Configure your agent: The config textbox is an optional set of instructions you can provide the Agent to better tailor blog posts on your behalf.</p>
          <p style={{marginLeft: "10px"}}>2b: We recommend keeping this section under 500 words. You might want to add a more detailed product description, the style of the posts, keywords, or links to include.</p>
          <p>3: Connect to your blog website.</p>
          <p style={{marginLeft: "10px"}}>3a: If you don't currently have a blog, we recommend selecting Raw Text. This won't post the articles, but will provide you with copies to keep and share.</p>
          <p style={{marginLeft: "10px"}}>3b: The most common option is using <a href="https://wordpress.com/" target="_blank">Wordpress</a>. Select "Post to Wordpress" then press login. This will redirect you to a Wordpress page where you'll need to authenticate your blog. </p>
          <p style={{marginLeft: "10px"}}>3c: If you're interested in trying live posting and don't have a Wordpress account, <a href="https://www.blogger.com/" target="_blank">Blogger.com</a> is a quick option. After creating an account, locate your blogger ID. It's the first large number in the URL. For example, if your URL is blogger.com/blog/posts/23908234, 23908234 is your blogger ID.</p>
          <p>4: Determine the number of posts you wish to publish each day (the maximum is 3 for the demo account).</p>
          <p>5: If you have a paid agent, specify the number of days you want the agent to run for. The total number of posts created is the product of posts per day and total posts. Note, you will not be able to modify your agent until it has completed its run.</p>
          <p>Finally, Click Run!</p>
          <p style={{marginBottom: "150px"}}>If you encounter any issues, don't hesitate to contact us on Discord.</p>
      </div>
      );
}
export default Template;