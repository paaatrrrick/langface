const mongoose = require('mongoose');
const { use } = require('../endpoints/basicRoutes');
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
    profilePicture: {
        type: String,
    },
});


userSchema.statics.login = async function (id, params) {
    const user = await this.findById(id);
    if (user) {
        const { email, profilePicture } = user;
        const updateParams = {email, profilePicture, ...params};
        user.set(updateParams);
        await user.save();
        return user;
    }
    const newUser = new this({ _id: id, ...params });
    await newUser.save();
    return newUser;
}



// Create and export User Model
const User = mongoose.model('User', userSchema);
module.exports = User;
  