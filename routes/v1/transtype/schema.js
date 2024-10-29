var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var schema = new Schema({
    organizationId: {
        type: mongoose.Types.ObjectId,
        ref: 'organization'
    },
    // Start - Priyanka Patil 14-12-2020 
    departmentId: {
        type: mongoose.Types.ObjectId,
        ref: 'department'
    },
    // End - Priyanka Patil 14-12-2020 
    transactionTypeName: {
        type: String
    },
    // Start- Rohini Kamble, 10-02-2021, SCI-I618
    transactionTypeCode : {
        type: String
    },
    // End- Rohini Kamble, 10-02-2021, SCI-I618
    additionalDescription : {
        type: String
    },
    transactionTypePrefix : {
        type: String
    },
    transactionTypeAutoNumber : {
        type: Number
    },
    orderReference: {
        type: String,
        default: ''
    },
    review: {
        type: Boolean
    },
    certify: {
        type: Boolean
    },
    approve: {
        type: Boolean
    },
    asset: {
        type: Boolean
    },
    pdffield: {
        type: Boolean
    },
    viewPDF: {
        type: Boolean
    },
    verifiable: {
        type: Boolean
    },
    // landscapeLayout: {
    //     type: Boolean
    // },
    // potraitLayout: {
    //     type: Boolean
    // },
    credImg: {
        type: String
    },
    credFileType: {
        type: String
    },
    credFileWidth: {
        type: Number
    },
    credFileHeight: {
        type: Number
    },
    staticCredImg: {
        type: String
    },
    fields : {
        type: Array
    },
    //  Start- Mayuri, 23-01-2021, SCI-I618
    staticFields : {
        type: Array
    }, 
    transRole: {
        type: String
    },
    epr:{
        type: Boolean
    },
    eprReceive:{
        type: Boolean
    },
    eprConsume:{
        type: Boolean
    },
    eprPrint:{
        type: Boolean
    },   
    transRole: {
        type: String
    },
    isPublic: {
        type: Boolean
    }, 
    referenceCreatedBy: {
        type: String,
    },
    // Start - Priyanka Patil 23-02-2021 (SCI-I681)
    status: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
		type : Date, 
		default : Date.now
	},
    // End - Priyanka Patil 23-02-2021 (SCI-I681)
    //  End- Mayuri, 23-01-2021, SCI-I618
    //  Start- Shubhangi, 05-02-2020, SCI-I749
    createdBy:{},//{firstName:'',lastName:'',email:''}
    updatedBy:{},//{firstName:'',lastName:'',email:''}
    // ============================ Start - Shubhangi (SCI-I798-New) - 20-02-2021 ============================
    docType:{
        type: String
    },
    // ============================ Start - Shubhangi (SCI-I798-New) - 07-05-2021 ============================
    //  End- Shubhangi, 05-02-2020, SCI-I749
    assetType: {
        type: String
    },    
    assetWithoutReference: {
        type: Boolean
    },
    nft: {
        type: Boolean,
        default: false
    },
},{ strict: false })

//  Start- Shubhangi, 31-12-2020, SCI-I698
schema.index({ organizationId: 1});
schema.index({ transactionTypeName: 1});
schema.index({ organizationId: 1,departmentId: 1,transactionTypeName: 1});
schema.pre('save', function preSave(next) {
    var that = this;
    var now = new Date().getTime();
    this.updatedAt = now;
    if (!this.createdAt) {
        this.createdAt = now;
    }
    if (!that.isNew) return next();
    // Any way call next
    next();

});
//  End- Shubhangi, 31-12-2020, SCI-I698
module.exports = mongoose.model('transactiontype', schema);