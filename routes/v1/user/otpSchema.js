var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
    email: {
        type: String,
    },
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'user'
    },
    code: {
        type: String
    },
    expiry: {
        type: Date,
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isVerified: {
        type: Boolean,
        default: false
    }
},{
    timestamps: true
},
{strict: false})

//  Start- Shubhangi, 31-12-2020, SCI-I698
schema.index({ code:1});
schema.index({ userId:1});
//  Start- Shubhangi, 31-12-2020, SCI-I698
module.exports = mongoose.model('otp', schema);