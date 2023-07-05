const { truncate } = require('fs');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BlogSchema = new Schema({
    blogID: {
      type: String,
      required: true,
      unique: true
    },
    blogPosts: {
      type: [String],
      default: []
    },
    dateRecentlyPosted: {
      type: Date,
      default: Date.now
    },
    version: {
      type: String,
      enum: ['blogger', 'wordpress'],
      required: true
    },
    postsLeftToday: {
      type: Number,
      default: function() {
        return this.version === 'wordpress' ? 8 : 25;
      }
    },
    maxNumberOfPosts: {
        type: Number,
        default: function() {
            return this.version === 'wordpress' ? 8 : 25;
          }
    },
    userID: {
      type: String,
      default: ''
    },
    openaiKey: {
      type: String
    },
    jwt: {
      type: String
    },
    subject: {
      type: String
    },
    config: {
      type: String
    },
    loops: {
      type: String
    },
    daysLeft: {
      type: Number,
      default: 0
    }
  });

// Method to create a new blog
//create a newschema that doesn't have sstatics and then export it as Blog
//setMaxNumberOfPosts

BlogSchema.statics.setMaxNumberOfPosts = async function(blogID, version, maxNumberOfPosts) {
    const blog = await this.findOne({ blogID, version });
    blog.maxNumberOfPosts = maxNumberOfPosts;
    await blog.save();
    return blog;
}

BlogSchema.statics.createNewBlog = async function(agent) {
  const existing = await this.findById(agent.blogID);
  if (existing) {
    existing.set({
      blogID: agent.blogID,
      version: agent.version,
      userID: agent.uid,
      version: agent.version,
      openaiKey: agent.openAIKey,
      jwt: agent.jwt,
      subject: agent.subject,
      config: agent.config,
      loops: agent.loops,
      daysLeft: agent.daysLeft
    })
    return await existing.save();
  }
  const blog = new this({
    blogID: agent.blogID,
    version: agent.version,
    userID: agent.uid,
    version: agent.version,
    openaiKey: agent.openAIKey,
    jwt: agent.jwt,
    subject: agent.subject,
    config: agent.config,
    loops: agent.loops,
    daysLeft: agent.daysLeft
  });
  return await blog.save();
};

BlogSchema.statics.getByMongoID = async function(id) {
  return await this.findById(id);
};

  
BlogSchema.statics.getBlog = async function(id) {
  return await this.findById(id);
}

//createBlog
BlogSchema.statics.createBlog = async function(params) {
  const blog = new this({...params});
  return await blog.save();
}

BlogSchema.statics.getBlogByBlogID = async function(blogID, version) {
  let blog = await this.findOne({ blogID, version });
  const id = blog._id;
  return await this.findById(id);
}

// Method to check remaining posts
BlogSchema.statics.checkRemainingPosts = async function(id) {
  console.log('at check remaining posts');
  console.log(blogID, version);
  const today = new Date().setHours(0, 0, 0, 0);
  let blog = await this.findById(id);
  if (blog.dateRecentlyPosted.setHours(0, 0, 0, 0) < today) {
    blog.postsLeftToday = blog.maxNumberOfPosts;
    await blog.save();
  }
  return {remainingPosts: blog.postsLeftToday, dailyPostCount: blog.maxNumberOfPosts};
};

// Method to add post
BlogSchema.statics.addPost = async function(id, postURL) {
  const today = new Date().setHours(0, 0, 0, 0);
  let blog = await this.findById(id);
  if (blog.dateRecentlyPosted.setHours(0, 0, 0, 0) < today) {
    blog.postsLeftToday = blog.maxNumberOfPosts;
  }

  if (blog.postsLeftToday > 0) {
    blog.blogPosts.push(postURL);
    blog.postsLeftToday--;
    blog.dateRecentlyPosted = Date.now();
    await blog.save();
  } else {
    return false;
  }
  return {remainingPosts: blog.postsLeftToday, dailyPostCount: blog.maxNumberOfPosts};
};

BlogSchema.statics.getActive = async () => {
  const activeBlogs = await this.find({ daysLeft: { $gt: 0 } });
  return activeBlogs; 
}

BlogSchema.statics.getOwner = async (id) => {
  const blog = await this.findById(id);
  return blog.userID;
}

// Create and export Blog Model
const BlogDB = mongoose.model('Blog', BlogSchema);
module.exports = BlogDB;
  