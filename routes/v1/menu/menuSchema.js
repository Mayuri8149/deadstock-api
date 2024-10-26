var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
	Id: {
		type: mongoose.Types.ObjectId
	},
	name: {
		type: String
	},
	file: {
		type: String
	},
	createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'users'
    },
    updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'users'
    }
},{
    timestamps: true
},
{strict: false})
module.exports = mongoose.model('menu', schema);