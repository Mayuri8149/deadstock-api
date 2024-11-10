var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const submenuSchema = new Schema({
    name: { type: String, required: true },
    url: { type: String, required: true }
});

var menuSchema = new Schema({
    Id: {
        type: mongoose.Types.ObjectId,
        auto: true  
    },
    name: {
        type: String,
        required: true 
    },
    file: {
        type: String
    },
    submenu: [submenuSchema], 
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'users' 
    },
    updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'users'
    }
}, {
    timestamps: true,  
    strict: false      
});

module.exports = mongoose.model('menu', menuSchema);