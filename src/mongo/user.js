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

// Create and export User Model
const User = mongoose.model('User', userSchema);
module.exports = User;
  