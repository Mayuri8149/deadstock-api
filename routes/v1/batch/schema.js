var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
	organizationId: {
		type: mongoose.Types.ObjectId,
        ref: 'organization'
	},
	departmentId: {
		type: mongoose.Types.ObjectId,
		ref: 'department'
	},
	affiliateId: {
		type: mongoose.Types.ObjectId,
		ref: 'affiliate'
	},
	moduleId: {
		type: mongoose.Types.ObjectId,
		ref: 'module'
	},
	code: {
		type: String
	},
	year: {
		type: String
	},
	start: { 
		type: Date,
		// Start - Priyanka Patil (SNA-17) 27-05-2021
		default : Date.now
		// End - Priyanka Patil (SNA-17) 27-05-2021
	},
	end: {
		type: Date,
		// Start - Priyanka Patil (SNA-17) 27-05-2021
		default : Date.now
		// End - Priyanka Patil (SNA-17) 27-05-2021
	},
	minCredits: {
		type: Number
	},
	minCgpa: {
		type: Number
	},
	totalCgpa: {
		type: Number
	},
	minScore: {
		type: Number
	},
	totalScore: {
		type: Number
	},
	isDeleted: {
		type: Boolean,
		default: false
	},
	type: {
		type: String
	},
	organizationid: {
		type: String
	},
	departmentid: {
		type: String
	},
	affiliateid: {
		type: String
	},
	moduleid: {
		type: String
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
schema.index({ code: 1});
schema.index({ code: 1,moduleid:1});
schema.index({ organizationId: 1,departmentId: 1,moduleId:1,affiliateId:1,code: 1 });
//  End- Shubhangi, 31-12-2020, SCI-I698


module.exports = mongoose.model('batches', schema);