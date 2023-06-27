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

BlogSchema.statics.createNewBlog = async function(blogID, version) {
    const blog = new this({
      blogID,
      version
    });
    return await blog.save();
  };
  
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
  
  // Create and export Blog Model
  const Blog = mongoose.model('Blog', BlogSchema);
  module.exports = Blog;
  