var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
    name: {
        type: String,
    },
    organizationId: {
        type: mongoose.Types.ObjectId,
        ref: 'organization'
    },
    code: {
        type: String,
    },
    // Start - Priyanka Patil (SNA-I12) 19-05-2021
    branch_location: {
        type: String,
    },
    branch_address: {
        type: String,
    },
    locationCoordinates:{},
    // End - Priyanka Patil (SNA-I12) 19-05-2021
    isActive: {
        type: Boolean,
        default: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    //  Start- Shubhangi, 05-02-2020, SCI-I749
    createdBy:{},//{firstName:'',lastName:'',email:''}
    updatedBy:{}//{firstName:'',lastName:'',email:''}
    //  End- Shubhangi, 05-02-2020, SCI-I749
},{
    timestamps: true
},
{strict: false})

//  Start- Shubhangi, 31-12-2020, SCI-I698
schema.index({ isActive: 1});
schema.index({ name: 1});
schema.index({ isActive: 1,organizationId:1});
schema.index({ organizationId:1,code:1});
schema.index({ organizationId:1,name:1});
//  End- Shubhangi, 31-12-2020, SCI-I698
module.exports = mongoose.model('department', schema);