const { convertToObjectId } = require('../utils/helpers');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const blueprintSchema = Schema({
    blogTitle: String,
    lsiKeywords: String,
    keyword: String,
    headers: String,
}, { _id: false });



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
  },
  blueprint: {
    type: blueprintSchema,
  },
  rawHTML: {
    type: String,
  },
});

// Create and export Blog Model
const PostDB = mongoose.model('Post', PostSchema);
module.exports = PostDB;
  