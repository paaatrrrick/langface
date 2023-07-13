const dummyblog = `
<article>
<h1>Marvel Characters</h1>
<p>
Marvel has taken the world by storm with its incredible cinematic universe and beloved comic book characters. From Iron Man to Spider-Man, the Marvel universe has captured the hearts of fans young and old. In this blog post, we'll take a closer look at some of the most iconic Marvel characters and their impact on popular culture.
</p>
<h2>Iron Man</h2>
<p>
Tony Stark, also known as Iron Man, is one of the most popular Marvel characters of all time. With his quick wit and technological prowess, he has become a fan favorite in both the comics and the movies. Robert Downey Jr.'s portrayal of the character in the Marvel Cinematic Universe has only added to his popularity, making him a household name.
</p>
<h2>Spider-Man</h2>
<p>
Peter Parker, aka Spider-Man, is another beloved Marvel character. His relatable struggles as a teenager trying to balance his personal life with his superhero duties have made him a favorite among fans. With multiple movie adaptations and appearances in the Avengers films, Spider-Man has cemented his place in the Marvel universe.
</p>
<h2>The Avengers</h2>
<ul>
<li>Iron Man</li>
<li>Thor</li>
<li>Captain America</li>
<li>Hulk</li>
<li>Black Widow</li>
<li>Hawkeye</li>
</ul>
<p>
The Avengers are a team of superheroes who have come together to save the world from various threats. With a star-studded cast and incredible special effects, the Avengers movies have become some of the highest-grossing films of all time. Each character brings their own unique skills and personality to the team, making for an unforgettable viewing experience.
</p>
<h2>X-Men</h2>
<ol>
<li>Wolverine</li>
<li>Storm</li>
<li>Cyclops</li>
<li>Rogue</li>
<li>Beast</li>
<li>Professor X</li>
</ol>
<p>
The X-Men are a group of mutants who fight for justice and equality in a world that fears and hates them. With a diverse cast of characters and complex storylines, the X-Men comics and movies have become a cultural phenomenon. Wolverine, in particular, has become one of the most popular Marvel characters of all time, with Hugh Jackman's portrayal of the character in the X-Men movies earning critical acclaim.
</p>
<img src="image1.png" alt="Marvel Logo">
<p>
Marvel has created a universe that has captured the hearts and imaginations of fans around the world. With iconic characters, thrilling storylines, and incredible special effects, it's no wonder that Marvel has become a cultural phenomenon. Whether you're a die-hard fan or a casual viewer, there's something for everyone in the Marvel universe.
</p>
<img src="image2.png" alt="Marvel Characters">
</article>`;

const summarizeImages = [
    {
      prompt: 'An image featuring the Marvel logo, representing the iconic brand and its impact on popular culture.',
      width: 512,
      height: 512
    },
    {
      prompt: 'An image showcasing a group of Marvel characters, such as Iron Man, Spider-Man, and Wolverine, highlighting their popularity and significance in the Marvel universe.',
      width: 512,
      height: 512
    }
  ]

const dummyImagePrompts = [
    {
      prompt: 'Create an image featuring the Marvel logo, representing the iconic brand and its impact on popular culture.',
      style: 'digital-art'
    },
    {
      prompt: 'Design an image showcasing a group of Marvel characters, such as Iron Man, Spider-Man, and Wolverine, highlighting their popularity and significance in the Marvel universe.',
      style: 'cinematic'
    }
  ];

const dummyWordpressPhotos = [
  'https://animameart.files.wordpress.com/2023/06/kh1wpsqpuxhvktwlnhwd.png',
  'https://animameart.files.wordpress.com/2023/06/b88bfzitqrqdzmfwzo7c.png'
]


const dummyResearcher  = {
  longTailKeywords: 'best trekking poles, trekking poles 2023, top trekking poles, trekking poles for stability, trekking poles for less pain',
  blogStrucutre: 'This blog is a list of the best trekking poles of 2023. It provides detailed information about each pole, including their features, pros, and cons. The blog also includes a trekking pole comparison table and buying advice to help readers make an informed decision. The content is written in a way that highlights the key features and benefits of each pole, which helps boost SEO by targeting relevant keywords and providing valuable information to readers.',
  tips: "To improve the SEO success of this blog, it could benefit from incorporating more long-tail keywords throughout the content. Additionally, optimizing the meta tags, headings, and image alt tags with relevant keywords can further enhance the blog's visibility in search engine results.",
  similarTitles: 'Top Hiking Poles for Outdoor Adventures',
  headers: [
    '<h1> Best Trekking Poles of 2023 </h1>',
    '<h2> For more stability and less pain on the trail, we’ve tested and picked the top trekking poles </h2>',
    '<h2> Breadcrumb </h2>',
    "<h2> Our Team's Trekking Pole Picks </h2>",
    '<h2> Best Overall Trekking Pole </h2>',
    '<h2> Best Budget Trekking Pole </h2>',
    '<h2> Best Ultralight Collapsible Pole </h2>',
    '<h2> Best Shock-Absorbing Trekking Pole </h2>',
    '<h2> Best Four-Season Trekking Pole </h2>',
    '<h2>  </h2>',
    '<h2> Best of the Rest </h2>',
    '<h2> Trekking Pole Comparison Table </h2>',
    '<h2> Trekking Pole Buying Advice </h2>',
    '<h2> Learn More About Hiking Gear </h2>',
    '<h2> Add adventure to your inbox </h2>',
    '<h2> Mobile Menu </h2>',
    '<h2> Megamenu - Desktop Hamburger Menu </h2>',
    '<h2> Add adventure to your inbox </h2>',
    '<h3> 1. Black Diamond Pursuit ($170) </h3>',
    '<h3> 2. REI Co-op Trailmade ($80) </h3>',
    '<h3> 3. Black Diamond Distance Carbon Z ($190) </h3>',
    '<h3> 4. LEKI Legacy Lite AS ($120) </h3>',
    '<h3> 5. Black Diamond Alpine Carbon Cork ($200) </h3>',
    '<h3> 6. Gossamer Gear LT5 ($195) </h3>',
    '<h3> 7. REI Co-op Traverse ($110) </h3>',
    '<h3> 8. Black Diamond Trail Back ($100) </h3>',
    '<h3> 9. REI Co-op Flash Carbon ($159) </h3>',
    '<h3> 10. MSR DynaLock Ascent Carbon ($170) </h3>',
    '<h3> 11. LEKI Makalu FX Carbon ($230) </h3>',
    '<h3> 12. Black Diamond Distance FLZ ($160) </h3>',
    '<h3> 13. LEKI Khumbu Lite ($120) </h3>',
    '<h3> 14. Mountainsmith Dolomite OLS ($30) </h3>',
    '<h3> 15. LEKI Cross Trail FX.One Superlite ($240) </h3>',
    '<h3> 16. Cascade Mountain Tech Carbon Fiber Quick Lock ($42) </h3>',
    '<h3> Trekking Pole Types: Telescoping, Folding, and Fixed </h3>',
    '<h3> Shaft Materials </h3>',
    '<h3> Locking Mechanisms </h3>',
    '<h3> Trekking Pole Grip Construction </h3>',
    '<h3> Weight </h3>',
    '<h3> Packed Size </h3>',
    '<h3> Durability </h3>',
    '<h3> Winter Use </h3>',
    '<h3> Shock-Absorbing Poles </h3>',
    '<h3> Women’s-Specific Trekking Poles </h3>',
    '<h3> Cheap Trekking Poles </h3>',
    '<h3> Hiking with One Trekking Pole </h3>',
    '<h3> Trekking Pole Tents and Shelters </h3>',
    '<h3> Hiking Gear Reviews </h3>',
    '<h3> Best Hiking Shoes of 2023 </h3>',
    '<h3> Best Backpacking Tents of 2023 </h3>',
    '<h3> Salomon X Ultra 4 Mid GTX Hiking Boot Review </h3>',
    '<h3> Best Backpacking Sleeping Bags of 2023 </h3>',
    '<h3> Best Headlamps of 2023 </h3>',
    '<h3> Backpacking Checklist for 2023 </h3>',
    '<h3> Best Baby Carriers for Hiking of 2023 </h3>',
    '<h3> Best Backpacking Sleeping Pads of 2023 </h3>'
  ]
};

const dummyBlueprint = [
  {
      "keyword": "best long tail keyword research tool",
      "blogTitle": "Best Long Tail Keyword Research Tool",
      "lsiKeywords": "This is the best long tail keyword researc",
      "headers": "Best Long Tail Keyword Research Tool",
  },
  {
      "keyword": "best long tail keyword research tool",
      "blogTitle": "Best Long Tail Keyword Research Tool",
      "lsiKeywords": "This is the best long tail keyword researc",
      "headers": "Best Long Tail Keyword Research Tool",
  },
]


module.exports = { dummyblog, summarizeImages, dummyImagePrompts, dummyWordpressPhotos, dummyResearcher, dummyBlueprint };
