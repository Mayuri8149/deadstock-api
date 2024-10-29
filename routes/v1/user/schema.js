var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const bcrypt = require('bcrypt');

var generatePassword = (text ) => {
    var salt = bcrypt.genSaltSync(10);
   
    var transactionid;
    if(!text ) {
        transactionid = new mongoose.Types.ObjectId;
    }
    else
    {
         transactionid = bcrypt.transactionidSync(text, salt);
    };
    return transactionid;
};

var schema = new Schema({
    email: {
        type: String,
    },
    firstName: {
        type: String,
    },
    lastName: {
        type: String,
    },
    companyName: {
        type: String,
    },
    verifierRefId: {
        type: mongoose.Types.ObjectId,
        ref: 'users'
    },
    password: {
        type: String,
    },
    phoneNumber: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
	did: {
		type: String
 	},
    signature: {
        type: String
    },
    privateKey: {
        type: String
    },
    profileImg: { 
        type: String 
    },
    publicKey: {
        type: String
    },
    newEmail: {
        type: String
    },
    // Start - Priyanka Patil (SCI-I791) 08-02-2021
    isStatus: {
        type: Boolean
        },
    // End - Priyanka Patil (SCI-I791) 08-02-2021
    //  Start- Shubhangi, 01-02-2020, SCI-I718
     timeZone:{type:String},
     //  End- Shubhangi, 02-02-2020, SCI-I718
    //  Start- Shubhangi, 05-02-2020, SCI-I749
    createdBy:{},//{firstName:'',lastName:'',email:''}
    updatedBy:{},//{firstName:'',lastName:'',email:''}
    //  End- Shubhangi, 05-02-2020, SCI-I749
    // ============================ Start - Shubhangi (SCI-I798-New) - 20-02-2021 ============================
    refresh_token:{
        type: String
    },
    access_token:{
        type: String
    },
    companyCode:{
        type:String
    },
    walletAddress:{
        type:String
    },
    // ============================ End - Shubhangi (SCI-I798-New) - 23-04-2021 ============================
},{
    timestamps: true
},
{strict: false})

//  Start- Shubhangi, 31-12-2020, SCI-I698
schema.index({ email:1});
schema.index({ did:1});
//  Start- Shubhangi, 31-12-2020, SCI-I698
module.exports = mongoose.model('user', schema);


// const Listing = mongoose.model('listings', listingSchema);
// const ListingLinks = mongoose.model('listing_links', links);

// module.exports = {
//     Listing,
//     ListingLinks,
//     setExpiryDate,
//     ObjectId: mongoose.Types.ObjectId
// }
