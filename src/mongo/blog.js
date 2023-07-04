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
    return await this.findById({ blogID: id });
};






  
BlogSchema.statics.getBlog = async function(blogID, version) {
  return await this.findOne({blogID, version})
}

// Method to check remaining posts
BlogSchema.statics.checkRemainingPosts = async function(blogID, version) {
  const today = new Date().setHours(0, 0, 0, 0);
  let blog = await this.findOne({ blogID, version });

  if (!blog) {
      blog = await this.createNewBlog(blogID, version);
  }

  if (blog.dateRecentlyPosted.setHours(0, 0, 0, 0) < today) {
    blog.postsLeftToday = blog.maxNumberOfPosts;
    await blog.save();
  }
  return {remainingPosts: blog.postsLeftToday, dailyPostCount: blog.maxNumberOfPosts};
};

// Method to add post
BlogSchema.statics.addPost = async function(blogID, version, postURL) {
  const today = new Date().setHours(0, 0, 0, 0);
  let blog = await this.findOne({ blogID, version });

  if (!blog) {
    blog = await this.createNewBlog(blogID, version);
  }

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

BlogSchema.statics.getOwner = async (blogID) => {
  const blog = await this.find({ blogID: blogID });
  return blog.userID;
}

// Create and export Blog Model
const BlogDB = mongoose.model('Blog', BlogSchema);
module.exports = BlogDB;
  