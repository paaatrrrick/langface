const { convertToObjectId } = require('../utils/helpers');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const blueprintSchema = Schema({
    blogTitle: {
      type: String,
      default: undefined
    },
    lsiKeywords: {
      type: String, 
      default: undefined
    },
    keyword: {
      type: String, 
      default: undefined
    },
    headers:  {
      type: String, 
      default: undefined
    },
});



const PostSchema = new Schema({
  parentMongoID: {
    type: String,
    default: null,
  },
  childrenMongoID: {
    type: [String],
    default: [],
  },
  url: {
    type: String,
    default: "",
  },
  blueprint: {
    type: blueprintSchema
  },
  rawHTML: {
    type: String,
    default: "",
  },
  postID: {
    type: String,
    default: "new",
  }
});

//get Post by ID
PostSchema.statics.getPostById = async function (id) {
  id = convertToObjectId(id);
  const post = await this.findById(id);
  return post;
};

//create Post from params
PostSchema.statics.createPost = async function (params) {
  const post = await this.create(params);
  return post;
};

//update Post from params
PostSchema.statics.updatePost = async function (id, params) {
  id = convertToObjectId(id);
  const post = await this.findByIdAndUpdate(id, params, { new: true });
  return post;
};




// Create and export Blog Model
const PostDB = mongoose.model('Post', PostSchema);
module.exports = PostDB;
  