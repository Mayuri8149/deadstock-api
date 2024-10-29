var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'user'
    },
    refreshToken: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    ipAddress: {
        type: String
    }
},{
    timestamps: true
},
{strict: false})

//  Start- Shubhangi, 31-12-2020, SCI-I698
schema.index({ userId:1});
schema.index({ refreshToken:1});
//  Start- Shubhangi, 31-12-2020, SCI-I698
module.exports = mongoose.model('session', schema);