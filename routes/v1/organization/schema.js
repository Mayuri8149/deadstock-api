var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
    // type: {
    //     type: String,
    // },
    code: {
        type: String,
    },
    name: {
        type: String,
    },
    // doe: {
    //     type: Date
    // },
    address: {
        type: String
    },
    locationCoordinates:{},
    // address2: {
    //     type: String
    // },
    // state: {
    //     type: String
    // },
    // city: {
    //     type: String
    // },
    // boardLineNumber: {
    //     type: String
    // },
    // administratorName: {
    //     type: String
    // },
    // administratorPhoneNumber: {
    //     type: Number
    // },
    // address: {
        // address_line_1: {
        //     type: String
        // },
        // address_line_2: {
        //     type: String
        // },
        // state: {
        //     type: String
        // },
        // city: {
        //     type: String
        // },
        // boardLineNumber: {
            // type: String
        // }
    // },
    // requester: {
    //     name: {
    //         type: String,
    //     },
    //     email: {
    //         type: String,
    //     },
    //     phoneNumber: {
    //         type: String,
    //     }
    // },
    // head: {
    //     name: {
    //         type: String
    //     },
    //     email: {
    //         type: String
    //     },
    //     phoneNumber: {
    //         type: String
    //     }
    // },
    // administrator: {
    //     name: {
    //         type: String
    //     },
    //     email: {
    //         type: String
    //     },
    //     phoneNumber: {
    //         type: String
    //     },
    //     landineNumber: {
    //         type: String
    //     }
    // },
    location: {
        type: String
    },
    website: {
        type: String
    },
    // academicName: {
    //     type: String
    // },
    // academicPhone: {
    //     type: String
    // },
    // affiliateOrganization: {
    //     name: {
    //         type: String
    //     },
    //     type: {
    //         type: String
    //     },
    //     approvedBy: {
    //         type: String
    //     },
    //     requlatoryBody: {
    //         type: String
    //     }
    // },
    isActive: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        default: "new"
    },
    // queueName: {
    //     type: String
    // },
    logo: { 
        type: String 
    },
    // verificationCost: {
    //     type: String 
    // },
     //  Start- Shubhangi, 06-04-2021, SCI-I832
    // wallet: {
    //     type: Number,
    //     default: 0
    // },
    // expiryType:{
    //     type: String 
    // },
    // expiryDate:{
    //     type: Date,
    // },
    // Start - Priyanka Patil (SCI-I832) 05-05-2021
    // isPayModStatus:{
    //     type: Boolean
    // },
    // End - Priyanka Patil (SCI-I832) 05-05-2021
    // Start - Priyanka Patil (SNA-18) 07-06-2021
    fabricChannelId: {
        type: String
    },
    fabricOrgId: {
        type: String
    },
    entityType: {
        type: String
    },
    
    isBlockchainService: {
        type: Boolean,
        default: false
    },
    // End - Priyanka Patil (SNA-18) 07-06-2021
     //  End- Shubhangi, 06-04-2021, SCI-I832
     //  Start- Shubhangi, 05-02-2020, SCI-I749
     //  Start- Shubhangi, 05-02-2020, SCI-I749
     createdBy:{},//{firstName:'',lastName:'',email:''}
     updatedBy:{}//{firstName:'',lastName:'',email:''}
     //  End- Shubhangi, 05-02-2020, SCI-I749
},{
    timestamps: true
},
{strict: false})

//  Start- Shubhangi, 31-12-2020, SCI-I698
schema.index({ name:1});
schema.index({ code:1});
//  end- Shubhangi, 31-12-2020, SCI-I698
module.exports = mongoose.model('organization', schema);