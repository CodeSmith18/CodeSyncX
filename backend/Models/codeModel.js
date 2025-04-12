const mongoose = require('mongoose');

const codeSchema  = new mongoose.Schema({
    code : {
        type : String,
    },

    input : {
        type : String,
    },

    output : {
        type: String,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',  
        required: true
    }
})

const code = mongoose.model('code',codeSchema);


module.exports = code;