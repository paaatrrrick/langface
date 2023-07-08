const { object, string } = require('zod');
const { convertToObjectId } = require('../utils/helpers');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = Schema({
    title: String,
    content: String,
    url: String,
    type: String,
}, { _id: false });



const BlogSchema = new Schema({
    blogID: {
      type: String,
      required: true,
      unique: true
    },
    blogPosts: {
      type: [postSchema],
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
    },
    hasStarted: {
      type: Boolean,
      default: false
    },
  });

// Method to create a new blog
//create a newschema that doesn't have sstatics and then export it as Blog
//setMaxNumberOfPosts

//set HasStarted
BlogSchema.statics.setHasStarted = async function(id, hasStarted) {
    id = convertToObjectId(id);
    const blog = await this.findById(id);
    blog.hasStarted = hasStarted;
    await blog.save();
    return blog;
};

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
    openaiKey: agent.openAIKey,
    jwt: agent.jwt,
    subject: agent.subject,
    config: agent.config,
    loops: agent.loops,
    daysLeft: agent.daysLeft
  });
  return await blog.save();
};

  
BlogSchema.statics.getBlog = async function(id) {
  id = convertToObjectId(id);
  return await this.findById(id);
}

//createBlog
BlogSchema.statics.createBlog = async function(params) {
  const { blogID, version, userID, openAIKey, blogJwt, subject, config, loops, daysLeft } = params;
  var blog = await this.findOne({ blogID, version });
  if (blog) {
    blog.set({
      openaiKey: openAIKey,
      jwt: blogJwt,
      userID: userID,
      subject: subject,
      config: config,
      loops: loops,
      daysLeft: daysLeft
    })
    return await blog.save();
  }
  blog = new this({
    blogID: blogID,
    version: version,
    userID: userID,
    openaiKey: openAIKey,
    jwt: blogJwt,
    subject: subject,
    config: config,
    loops: loops,
    daysLeft: daysLeft
  });
  return await blog.save();
}

BlogSchema.statics.getBlogByBlogID = async function(blogID, version) {
  let blog = await this.findOne({ blogID, version });
  const id = blog._id;
  return await this.findById(id);
}

// Method to check remaining posts
BlogSchema.statics.checkRemainingPosts = async function(id) {
  id = convertToObjectId(id);
  const today = new Date().setHours(0, 0, 0, 0);
  let blog = await this.findById(id);
  if (blog.dateRecentlyPosted.setHours(0, 0, 0, 0) < today) {
    blog.postsLeftToday = blog.maxNumberOfPosts;
    await blog.save();
  }
  return {postsLeftToday: blog.postsLeftToday, maxNumberOfPosts: blog.maxNumberOfPosts};
};

// Method to add post
BlogSchema.statics.addPost = async function(id, postContent) {
  id = convertToObjectId(id);
  const today = new Date().setHours(0, 0, 0, 0);
  let blog = await this.findById(id);
  if (blog.dateRecentlyPosted.setHours(0, 0, 0, 0) < today) {
    blog.postsLeftToday = blog.maxNumberOfPosts;
  }
  blog.blogPosts.push(postContent);
  if (postContent.type === 'success' && blog.postsLeftToday > 0) {
    blog.postsLeftToday--;
  }
  blog.dateRecentlyPosted = Date.now();
  await blog.save();
  return {postsLeftToday: blog.postsLeftToday, maxNumberOfPosts: blog.maxNumberOfPosts};
};

BlogSchema.statics.getActive = async () => {
  const activeBlogs = await this.find({ daysLeft: { $gt: 0 } });
  return activeBlogs; 
}

BlogSchema.statics.getOwner = async (id) => {
  id = convertToObjectId(id);
  const blog = await this.findById(id);
  return blog.userID;
}

BlogSchema.statics.setUserId = async function(id, userID) {
  id = convertToObjectId(id);
  let blog = await this.findById(id);
  blog.userID = userID;
  await blog.save();
  return blog;
}

//delete all blogPosts
BlogSchema.statics.deleteAllBlogPosts = async function(id) {
  id = convertToObjectId(id);
  let blog = await this.findById(id);
  blog.blogPosts = [];
  await blog.save();
  return blog;
}

// Create and export Blog Model
const BlogDB = mongoose.model('Blog', BlogSchema);
module.exports = BlogDB;
  