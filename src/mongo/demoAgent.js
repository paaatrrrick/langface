const { convertToObjectId } = require('../utils/helpers');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DemoAgentSchema = new Schema({
    ip: {
      type: String,
    },
    dateRecentlyPosted: {
      type: Date,
      default: Date.now
    },
    postsLeftToday: {
      type: Number,
      default: 3
    },
    maxNumberOfPosts: {
        type: Number,
        default: 3
    },
});

  
DemoAgentSchema.statics.getBlog = async function(id) {
  id = convertToObjectId(id);
  return await this.findById(id);
}

//createBlog
DemoAgentSchema.statics.createBlog = async function(params) {
  const { ip } = params;
  var blog = await this.findOne({ ip });
  if (blog) {
    return blog;
  }
  blog = new this({ip});
  return await blog.save();
}

// Method to check remaining posts
DemoAgentSchema.statics.checkRemainingPosts = async function(id) {
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
DemoAgentSchema.statics.addPost = async function(id, postContent) {
    id = convertToObjectId(id);
    const today = new Date().setHours(0, 0, 0, 0);
    let blog = await this.findById(id);
    if (blog.dateRecentlyPosted.setHours(0, 0, 0, 0) < today) {
      blog.postsLeftToday = blog.maxNumberOfPosts;
    }
    if (postContent.type === 'success' && blog.postsLeftToday > 0) {
      blog.postsLeftToday--;
    }
    blog.dateRecentlyPosted = Date.now();
    await blog.save();
    return {postsLeftToday: blog.postsLeftToday, maxNumberOfPosts: blog.maxNumberOfPosts};
};

// Create and export Blog Model
const DemoAgent = mongoose.model('DemoAgent', DemoAgentSchema);
module.exports = DemoAgent;
  