const mongoose = require('mongoose')

const userSchema  = mongoose.Schema({
    firstName : String,
    lastName : String,
    email : {type: String , required : true , lowercase: true,} ,
    password : String,
    profilePic : String,

})


const userModel = mongoose.model('user', userSchema)
module.exports = userModel;
