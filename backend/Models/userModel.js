const mongoose = require('mongoose');

const userSchema  = new mongoose.Schema({
    username : {
        type : String,
        required  : true,
        unique : true
    },
    password : {
        type : String,
    }
})

const user = mongoose.model('user',userSchema);


module.exports = user;