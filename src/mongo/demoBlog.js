const { convertToObjectId } = require('../utils/helpers');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DemoBlogSchema = new Schema({
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

  
DemoBlogSchema.statics.getBlog = async function(id) {
  id = convertToObjectId(id);
  return await this.findById(id);
}

//createBlog
DemoBlogSchema.statics.createBlog = async function(params) {
  const { blogID, version } = params;
  var blog = await this.findOne({ blogID, version });
  if (blog) {
    return blog;
  }
  blog = new this({version: version, blogID: blogID});
  return await blog.save();
}

DemoBlogSchema.statics.getBlogByBlogID = async function(blogID, version) {
  let blog = await this.findOne({ blogID, version });
  const id = blog._id;
  return await this.findById(id);
}

// Method to check remaining posts
DemoBlogSchema.statics.checkRemainingPosts = async function(id) {
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
DemoBlogSchema.statics.addPost = async function(id, postContent) {
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
const DemoBlog = mongoose.model('DemoBlog', DemoBlogSchema);
module.exports = DemoBlog;
  