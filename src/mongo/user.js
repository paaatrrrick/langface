const { convertToObjectId } = require('../utils/helpers');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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

userSchema.statics.login = async function (uid) {
    let id = convertToObjectId(uid);
    return await this.findById(id);
}


userSchema.statics.loginOrSignUp = async function (uid, params = {}) {
    let id = convertToObjectId(uid);
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
    const newUser = new this({ _id: id, ...params });
    return await newUser.save();
}



//getUserByID
userSchema.statics.getUserByID = async function (id) {
    id = convertToObjectId(id);
    const user = await this.findById(id);
    return user;
}

//delete all users
userSchema.statics.deleteAllUsers = async function () {
    await this.deleteMany({});
}



userSchema.statics.addBlog = async function (id, blogID) {
    id = convertToObjectId(id);
    blogID = convertToObjectId(blogID);
    const user = await this.findById(id);
    if (user.blogs.includes(blogID)){
        return user;
    }
    user.blogs.push(blogID);
    await user.save();
    return user;
}

// Create and export User Model
const User = mongoose.model('User', userSchema);
module.exports = User;
  