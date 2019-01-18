const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config/database');

//User Schema
const UserSchema = mongoose.Schema({
    name:{
        type: String,
    },
    email: {
        type: String,
        required: true,
        unique:true
    },
    username: {
        type: String,
        required: true,
        unique:true
    },
    password: {
        type: String,
        required: true
    },
    active: {
        type:Boolean,
        defaultValue:false, 
        required: true
    },
    token:
    {
        type:String,
        required:true
    },
    date: {
        type: Date,
        default: Date.now
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date
});

//Creating User Model and exporting it so to use in different file
const User = module.exports = mongoose.model('User', UserSchema);

//getuserid funtion and exporting it so to use in different file
module.exports.getUserById  = function(id, callback){
    User.findById(id, callback);
}
//getusername funtion and exporting it so to use in different file
module.exports.getUserByUsername = function(username, callback){
    const query = {username: username}
    User.findOne(query, callback);
}
//add user and exporting it so to use in different file
module.exports.addUser = function(newUser, callback){
    bcrypt.genSalt(9, (err, salt)  =>  {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
            if(err) throw err;
            console.log(hash)
            newUser.password = hash;
            newUser.save(callback);
        });
    });
}
////compare password and exporting it so to use in different file
module.exports.comparePassword = function(candidatePassword, hash, callback){
    bcrypt.compare(candidatePassword, hash, (err, isMatch) =>{
        if(err) throw err;
        callback(null, isMatch);
    });

}