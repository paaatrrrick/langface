import React from "react";
const Blogger = () => {
  return (
    <div className="Tutorial">
      <h1>How to Get Started</h1>
      <p>1: Create an account on{" "}
            <a href="https://www.blogger.com/" target="_blank">
              blogger.com
            </a>
        </p>
        <p>2: Create a new blog and style it the way you'd like</p>
        <p>
        3: Your blogger ID is the first large number in the URL. For
        example, if your URL is blogger.com/blog/posts/23908234, 23908234 is
        your blogger ID
        </p>
        <p>4: The `Subject` field should be a short title of your blog's niche. If your blog is about a dog leash that can help to better train dogs, the niche would be dog leashes </p>
        <p>5: The config section is completely optional. However, this is the place to give more insight into your blog, what it is about, how to style posts. You can even add URLs here to be linked</p>
        <p>6: Click Run!</p>
        <p>If you run into any issues, feel free to reach out on the discord</p>
    </div>
  );
};

export default Blogger;
