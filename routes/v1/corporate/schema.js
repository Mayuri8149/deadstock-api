var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
    
    companyName: {
        type: String,
    },
    name: {
        type: String,
    },
    emailId: {
        type: String
    },
    phoneNumber: {
        type: String,
    },
    verifiertype: {
        type: String,
    },
    isActive: {
        type: Boolean,
        default: true
    },
    status: {
        type: String,
        default: "new"
    },
    logo: {
        type: String
    },
    // Start - Priyanka Patil (SCI-I832) 05-05-2021
    isPayModStatus:{
        type: Boolean
    },
    // End - Priyanka Patil (SCI-I832) 05-05-2021
    entityType:{
        type: String
    },
     //  Start- Shubhangi, 05-02-2020, SCI-I749
     createdBy:{
        type: Schema.Types.ObjectId,
        ref: 'users'
    },
     updatedBy:{
          type: Schema.Types.ObjectId,
          ref: 'users'
    },
     //  Start- Shubhangi, 06-04-2021, SCI-I832
     wallet: {
        type: Number,
        default: 0
    },
    expiryType:{
        type: String 
    },
    expiryDate:{
        type: Date,
    },
     //  End- Shubhangi, 06-04-2021, SCI-I832
     //  End- Shubhangi, 05-02-2020, SCI-I749
     //============================ Start - Shubhangi (SNA-I5) - 13-05-2021 ============================
     code: {
        type: String,
    },
    //============================ End - Shubhangi (SNA-I5) - 26-05-2021 ============================
     // Start - Priyanka Patil (SNA-I13) 31-05-2021
     location: {
        type: String,
        default: ""
    },
    locationCoordinates:{},
    address: {
        type: String,
    },
    organizationId: {
        type: Schema.Types.ObjectId,
        ref: 'organizations'
    },
    fabricChannelId: {
        type: String
    },
    fabricOrgId: {
        type: String
    },
    isBlockchainService: {
        type: Boolean,
        default: false
    },
    // End - Priyanka Patil (SNA-I13) 31-05-2021
},{
    timestamps: true
},
{strict: false})

//  Start- Shubhangi, 31-12-2020, SCI-I698
schema.index({ name: 1});
//  End- Shubhangi, 31-12-2020, SCI-I698
module.exports = mongoose.model('corporate', schema);