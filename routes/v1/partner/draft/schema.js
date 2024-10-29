var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var defaultId = new mongoose.Types.ObjectId('111111111111111111111111');


var schema = new Schema({
	batchId: {
		type: Schema.Types.ObjectId,
		ref: 'batches'
	},
	//  Start- Priyanka Patil, 10-02-2021, SCI-I744
	moduleId: {
		type: mongoose.Types.ObjectId,
		ref: 'modules'
	},
	//  End- Priyanka Patil, 10-02-2021, SCI-I744
	affiliateId: {
		type: Schema.Types.ObjectId,
		ref: 'affiliates'
	},
	organizationId: {
		type: Schema.Types.ObjectId,
		ref: 'organizations'
	},
	code: {
		type: Object
	},
	firstName: {
		type: Object
	},
	lastName: {
		type: Object
	},
	father: {
		type: Object
	},
	dob: {
		type: Object
	},
	aadhar: {
		type: Object
	},
	email: {
		type: Object
	},
	phoneNumber: {
		type: Object
	},
	isActive: {
		type: String,
		default: true
	},
	status: {
		type: String,
		default: "new"
	},
	date: {
		type: Date,
		default: Date.now
	},
	userId: {
		type: Schema.Types.ObjectId,
		ref: 'users',
		default: defaultId
	},
	did: {
		type: Schema.Types.Mixed
	},
	//  Start- Shubhangi, 05-02-2020, SCI-I749
	createdBy: {
		type: Schema.Types.ObjectId,
		ref: 'users'
	},
	updatedBy: {
		type: Schema.Types.ObjectId,
		ref: 'users'
	}
	//  End- Shubhangi, 05-02-2020, SCI-I749  
}, {
	timestamps: true
},
	{ strict: false })

//  Start- Shubhangi, 31-12-2020, SCI-I698
schema.index({ affiliateId: 1 });
//  Start- Shubhangi, 31-12-2020, SCI-I698
module.exports = mongoose.model('partnerdrafts', schema);
