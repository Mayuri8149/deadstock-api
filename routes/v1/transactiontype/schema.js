var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var defaultId = new mongoose.Types.ObjectId('111111111111111111111111');

var schema = new Schema({
    organizationId: {
        type: mongoose.Types.ObjectId,
        ref: 'organization',
        default: defaultId
    },
    departmentId: {
        type: mongoose.Types.ObjectId,
        ref: 'department',
        default: defaultId
    },
    moduleId: {
		type: mongoose.Types.ObjectId,
		ref: 'module'
    },
    // Start - Priyanka Patil (SNA-17) 18-05-2021
    corporateId:{
        type: mongoose.Types.ObjectId,
        ref: 'corporates',
        default:null
    },
    // End - Priyanka Patil (SNA-17) 18-05-2021
    transactionTypeName: {
        type: String
    },
    additionalDescription : {
        type: String
    },
    transactionTypePrefix : {
        type: String
    },
    transactionTypeAutoNumber : {
        type: Number
    },
    transactionAutoNumber: {
        type: String,
        default: null
    },
    orderReference: {
        type: String,
        default: ''
    },
    // review: {
    //     type: Boolean
    // },
    // certify: {
    //     type: Boolean
    // },
    // approve: {
    //     type: Boolean
    // },
    asset: {
        type: Boolean
    },
    pdffield: {
        type: Boolean
    },
    viewPDF: {
        type: Boolean
    },
    transaction: {
        type: String
    },
    serialized: {
        type: Boolean
    },
    provenance: {
        type: Boolean
    },
    htmlFile:{
        type: String
    },
    assetType: {
        type: String
    },    
    assetWithoutReference: {
        type: Boolean
    },
    fromToEntity: {
        type: String
    },
    verifiable: {
        type: Boolean
    },
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
    staticFields : {
        type: Array
    },
    isPublic: {
        type: Boolean
    },
    transactionTypeId : {
        type: String
    } ,
    transactionTypeCode : {
        type: String
    },
    referenceId: {
        type: String,
    },
    referenceCreatedBy: {
        type: String,
    },
    status: {
        type: Boolean,
        default: false
    },
    // ============================ Start - Shubhangi (SCI-I798-New) - 20-02-2021 ============================
    isDigilockar:{
        type: Boolean,
        default: false
    },
    // Start - Priyanka Patil (SNA-I11) 02-06-2021
    is_deleted:{
        type: Boolean,
        default: false
    },
    // End - Priyanka Patil (SNA-I11) 02-06-2021
    docType:{
        type: String
    },
    isExpiry: {
        type: Boolean
    },
    refModule: {
        type: String
    },
    refTransType: {
        type: String
    },
    inputAsset: {
        type: Boolean
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
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
		type : Date, 
		default : Date.now
	},
    // ============================ Start - Shubhangi (SCI-I798-New) - 07-05-2021 ============================
    // End - Priyanka Patil 23-02-2021 (SCI-I681)
    //  Start- Shubhangi, 05-02-2020, SCI-I749
    createdBy:{},//{firstName:'',lastName:'',email:''}
    updatedBy:{},//{firstName:'',lastName:'',email:''}
    outside_docs:{
        type: Boolean,
        default:false
    },
    nft: {
        type: Boolean,
        default: false
    },
},
{strict: false})

//  Start- Shubhangi, 31-12-2020, SCI-I698
schema.index({ moduleId: 1});
schema.index({ transactionTypeName: 1});
schema.index({ transactionTypeId: 1});
schema.index({ transactionTypeName: 1,moduleId: 1});
schema.index({ transactionTypeId: 1,organizationId: 1});
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

module.exports = mongoose.model('transtype', schema);