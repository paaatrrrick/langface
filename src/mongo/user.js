const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    userID: {
        type: String,
        required: true,
        unique: true  
    },
    blogs: {
        type: [],
        default: function() {
            return []
        }
    }
});

userSchema.statics.createNewUser = async function(userID) {
    let user = await this.findOne({ userID })
    if (user){
        return user;
    }
    user = new this({
        userID
    });
    return await user.save();
}


userSchema.statics.addBlog = async function(userID, blogID) {
    let user = await this.findOne({ userID });
    if (!user){
        user = await this.createNewUser(userID);
    }

    let agentExists = this.findOne({ blogID });
    if (agentExists) {
        return false;
    }

    user.blogs.push(blogID);
    await user.save();

    return user;
}

userSchema.statics.getBlogs = async function(userID) {
    let user = await this.findOne({ userID });
    if (!user){
        user = await this.createNewUser(userID);
    }

    const blogs = user.blogs;
    return blogs;
}
  
// Create and export User Model
const User = mongoose.model('User', userSchema);
module.exports = User;
  