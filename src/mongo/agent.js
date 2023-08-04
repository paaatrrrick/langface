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

const linksSchema = Schema({
    description: String,
    url: String,
}, { _id: false });

const businessDataSchema = Schema({
    name: {
      type: String,
      default: ""
    },
    product: {
      type: String,
      default: ""
    },
    valueProposition: {
      type: String,
      default: ""
    },
    insights: [String],
    links: [linksSchema],
}, { _id: false });
    


const AgentSchema = new Schema({
    blogID: {
      type: String,
    },
    messages: {
      type: [messageSchema],
      default: []
    },
    businessData: {
      type: businessDataSchema,
      default: {}
    },
    topPostID: {
      type: String,
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
    includeAIImages: {
      type: Boolean,
      default: false,
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
    },
    totalPostsToMake: {
      type: Number,
      default: 0
    },
    nextPostCountResetDate: {
      type: Date,
      required: true,
    }
  });


// AgentSchema.statics.updateAllToAMonthLater = async function() {
//   const allBlogs = await this.find({});
//   for (let blog of allBlogs) {
//     const dateCreated = blog._id.getTimestamp();
//     const oneMonthLater = new Date(dateCreated);
//     oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
//     const DateNow = new Date();
//     blog.nextPostCountResetDate = oneMonthLater;
//     await blog.save();
//   }
//   //2023-07-26T21:08:10.000Z
//   return 'done';
// }


//create a blog with default values
AgentSchema.statics.createEmptyBlog = async function(userID, paymentID) {
  const oneMonthLater = new Date();
  oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
  const blog = new this({userID: userID, paymentID: paymentID, nextPostCountResetDate: oneMonthLater});
  await blog.save();
  return blog;
}

AgentSchema.statics.updateBusinessData = async function(id, newSpecs) {
  const blog = await this.findById(convertToObjectId(id));
  //set business data to be the union with the new specs and the old business data. Have new overwite old if there is a conflict
  // for (let key of Object.keys(newSpecs)) {
  //   if (newSpecs[key] === "" || (typeof newSpecs[key] === "object" && newSpecs[key].length === 0)) {
  //     delete newSpecs[key];
  //   }
  // }
  const oldBusinessData = blog.businessData.toObject();
  const newBusinessData =  {...oldBusinessData, ...newSpecs};
  blog.set({businessData: newBusinessData})
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
  //call checkRemainingPosts
  await this.checkRemainingPosts(id);
  return await this.findById(id);
}

//createBlog
AgentSchema.statics.updateBlog = async function(id, params) {
  id = convertToObjectId(id);
  const { blogID, version, userID, blogJwt, businessData, loops, daysLeft, topPostID, includeAIImages } = params;
  const totalPostsToMake = loops * daysLeft;
  const blog = await this.findById(id);
  blog.set({blogID, version, userID,jwt: blogJwt, businessData,loops,daysLeft, topPostID, includeAIImages, totalPostsToMake})
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
  const dateNow = new Date();
  const oneMonthLater = new Date(blog.nextPostCountResetDate); 
  if (dateNow && oneMonthLater && dateNow > oneMonthLater) {
    while (dateNow > oneMonthLater) {
      oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
    }
    blog.nextPostCountResetDate = oneMonthLater;
    blog.postsLeftToday = blog.maxNumberOfPosts;
    await blog.save();
  }
  var dateString = "";
  try {
    const standarized = blog.nextPostCountResetDate;
    const month = standarized.getMonth() + 1;
    const day = standarized.getDate();
    const year = standarized.getFullYear();
    const dateString = month + "/" + day + "/" + year;
  } catch {
    
  }
  return {postsLeftToday: blog.postsLeftToday, maxNumberOfPosts: blog.maxNumberOfPosts, dateString };
};

AgentSchema.statics.addPost = async function(id, postContent) {
  let blog = await this.findById(convertToObjectId(id));
  blog.messages.push(postContent);
  if (postContent.type === 'success' && blog.postsLeftToday > 0) {
    blog.postsLeftToday--;
  }
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
  const nextPostIndex = blog.nextPostIndex + 1;
  blog.nextPostIndex = nextPostIndex;
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
  