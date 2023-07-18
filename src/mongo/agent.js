const trimStringToChars = (str, N) => {
  if (str.length > N) {
      return str.substring(0, N - 3) + "...";
  } else {
      return str;
  }
}

const { convertToObjectId } = require('../utils/helpers');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const PostDB = require("./post");


const messageSchema = Schema({
    title: String,
    config: String,
    url: String,
    type: String,
    html: String,
}, { _id: false });



const AgentSchema = new Schema({
    blogID: {
      type: String,
    },
    messages: {
      type: [messageSchema],
      default: []
    },
    topPostID: {
      type: String,
    },
    dateRecentlyPosted: {
      type: Date,
      default: Date.now
    },
    version: {
      type: String,
      enum: ['blogger', 'wordpress', 'html'],
    },
    postsLeftToday: {
      type: Number,
      default: 450
    },
    maxNumberOfPosts: {
        type: Number,
        default: 450,
    },
    userID: {
      type: String,
      required: true,
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
    newlyCreated: {
      type: Boolean,
      default: true
    },
    paymentID: {
      type: String,
      required: false,
    },
    BFSOrderedArrayOfPostMongoID: {
      type: [String],
      default: []
    },
    nextPostIndex: {
      type: Number,
      default: 0
    }
  });



//create a blog with default values
AgentSchema.statics.createEmptyBlog = async function(userID, paymentID) {
  const blog = new this({userID: userID, paymentID: paymentID});
  await blog.save();
  return blog;
}

//removeNewlyCreated
AgentSchema.statics.removeNewlyCreated = async function(id) {
  const blog = await this.findById(convertToObjectId(id));
  blog.newlyCreated = false;
  await blog.save();
  return blog;
}

// Method to create a new blog
// create a newschema that doesn't have sstatics and then export it as Blog
// setMaxNumberOfPosts
//set HasStarted
AgentSchema.statics.setHasStarted = async function(id, hasStarted) {
    id = convertToObjectId(id);
    const blog = await this.findById(id);
    blog.hasStarted = hasStarted;
    await blog.save();
    return blog;
};

//subtract days left
AgentSchema.statics.subtractDaysLeft = async function(id) {
  id = convertToObjectId(id);
  const blog = await this.findById(id);
  if (blog.daysLeft > 0) {
    blog.daysLeft = blog.daysLeft - 1;
    await blog.save();
  }
  return blog;
};
  
AgentSchema.statics.getBlog = async function(id) {
  id = convertToObjectId(id);
  return await this.findById(id);
}

//createBlog
AgentSchema.statics.updateBlog = async function(id, params) {
  id = convertToObjectId(id);
  const { blogID, version, userID, openaiKey, blogJwt, subject, config, loops, daysLeft, topPostID } = params;
  const blog = await this.findById(id);
  blog.set({blogID, version, userID, openaiKey,jwt: blogJwt,subject,config,loops,daysLeft, topPostID})
  return await blog.save();
}

AgentSchema.statics.updateBlogSpecParam = async function(id, params) {
  id = convertToObjectId(id);
  const blog = await this.findById(id);
  blog.set(params)
  return await blog.save();
}


AgentSchema.statics.checkRemainingPosts = async function(id) {
  let blog = await this.findById(convertToObjectId(id));
  return {postsLeftToday: blog.postsLeftToday, maxNumberOfPosts: blog.maxNumberOfPosts};
};

AgentSchema.statics.addPost = async function(id, postContent) {
  let blog = await this.findById(convertToObjectId(id));
  blog.messages.push(postContent);
  if (postContent.type === 'success' && blog.postsLeftToday > 0) {
    blog.postsLeftToday--;
  }
  blog.dateRecentlyPosted = Date.now();
  await blog.save();
  return {postsLeftToday: blog.postsLeftToday, maxNumberOfPosts: blog.maxNumberOfPosts };
};

AgentSchema.statics.getActive = async function() {
  return await this.find({ daysLeft: { $gt: 0 }, hasStarted: false });
}

AgentSchema.statics.getOwner = async (id) => {
  const blog = await this.findById(convertToObjectId(id));
  return blog.userID;
}

AgentSchema.statics.setUserId = async function(id, userID) {
  let blog = await this.findById(convertToObjectId(id));
  blog.userID = userID;
  await blog.save();
  return blog;
}

//increment nextPostIndex
AgentSchema.statics.incrementNextPostIndex = async function(id) {
  let blog = await this.findById(convertToObjectId(id));
  blog.nextPostIndex++;
  await blog.save();
  return blog;
}

//delete all blogPosts
AgentSchema.statics.deleteAllMessages = async function(id) {
  let blog = await this.findById(convertToObjectId(id));
  blog.messages = [];
  blog.nextPostIndex = 0;
  blog.BFSOrderedArrayOfPostMongoID = [];
  blog.topPostID = null;
  await blog.save();
  return blog;
}

AgentSchema.statics.getTree = async function(id) {
  try {
    let blog = await this.findById(convertToObjectId(id));
    if (!blog || !blog.BFSOrderedArrayOfPostMongoID || blog.BFSOrderedArrayOfPostMongoID.length === 0) {
      return false;
    }
    const recursTree = async (id) => {
      try {
        const post = await PostDB.getPostById(id);
        if (!post || !post.rawHTML || !post?.blueprint?.blogTitle) {
          return false;
        }
        const res = {name: trimStringToChars(post.blueprint.blogTitle, 30), children: []};
        for (let childID of post.childrenMongoID) {
            const child = await recursTree(childID);
            if (child) {
              res.children.push(child);
            }
        }
        if (res.children.length === 0) {
          delete res.children;
        }
        return res;
      } catch (err) {
        return false;
      }
    }
    const tree = await recursTree(blog.BFSOrderedArrayOfPostMongoID[0]);

    return tree
  } catch (err) {
    return false;
  }
}

AgentSchema.statics.changeBlog = async function(id, params) {
  id = convertToObjectId(id);
  const agent = await this.findById(id);
  agent.set(params);
  await agent.save();
  return agent;
};



// Create and export Blog Model
const AgentDB = mongoose.model('Agent', AgentSchema);
module.exports = AgentDB;
  