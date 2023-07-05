const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const BlogDB = require('./blog');

const userSchema = new Schema({
    blogs: {
        type: [],
        default: function() {
            return []
        }
    },
    email: {
        type: String,
    },
    photoURL: {
        type: String,
    },
    name: {
        type: String,
    },    
});


userSchema.statics.login = async function (id, params = {}) {
    const user = await this.findById(id);
    if (user) {
        if (Object.keys(params).length === 0) {
         return user; 
        }
        const { email, photoURL, name } = user;
        const updateParams = {email, photoURL, name, ...params};
        user.set(updateParams);
        await user.save();
        return user;
    }
    console.log({ _id: id, ...params })
    const newUser = new this({ _id: id, ...params });
    console.log(newUser)
    return await newUser.save();

    // const blog = new this({
    //     blogID,
    //     version
    //   });
    //   return await blog.save();
}

//getUserByID
userSchema.statics.getUserByID = async function (id) {
    const user = await this.findById(id);
    return user;
}

userSchema.statics.addBlog = async function (id, blogID) {
    const user = await this.findById(id);
    if (BlogDB.getOwner(blogID)){
        // if user is running multiple agents on the same blog, we don't need to push the blogID to the array multiple times
        return user;
    }
    user.blogs.push(blogID);
    await user.save();
    return user;
}

// Create and export User Model
const User = mongoose.model('User', userSchema);
module.exports = User;
  