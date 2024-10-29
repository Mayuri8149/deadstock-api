var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var defaultId = new mongoose.Types.ObjectId('111111111111111111111111');

var schema = new Schema({
	batchId: {
		type: mongoose.Types.ObjectId,
		ref: 'batches'
	},
	//  Start- Priyanka Patil, 10-02-2021, SCI-I744
	moduleId: {
		type: mongoose.Types.ObjectId,
		ref: 'modules'
	},
	//  End- Priyanka Patil, 10-02-2021, SCI-I744
	affiliateId: {
		type: mongoose.Types.ObjectId,
		ref: 'affiliates'
	},
	organizationId: {
		type: Schema.Types.ObjectId,
		ref: 'organizations'
	},
	// Start- Priyanka Patil, 10-03-2021, SCI-I821
	transactiontypeId: {
		type: Schema.Types.ObjectId,
		ref: 'transtypes'
	},
	// End- Priyanka Patil, 10-03-2021, SCI-I821
	code: {
		type: String
	},
	firstName: {
		type: String
	},
	lastName: {
		type: String
	},
	father: {
		type: String
	},
	dob: {
		type: Date
	},
	aadhar: {
		type: String
	},
	email: {
		type: String
	},
	phoneNumber: {
		type: String
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
	reviewers: {
		type: Schema.Types.Mixed,
		default: {}
	},
	comments: {
		type: Schema.Types.Mixed,
		default: []
	},
	userId: {
		type: Schema.Types.ObjectId,
		ref: 'users',
		default: defaultId
	},
	did: {
		type: Schema.Types.Mixed
	},
	newEmail: {
		type: String
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
schema.index({ code: 1 });
schema.index({ userId: 1 });
schema.index({ did: 1 });
schema.index({ batchId: 1, organizationId: 1, affiliateId: 1, code: 1, status: 1 });
schema.index({ did: 1, status: 1 });
schema.index({ affiliateId: 1, batchId: 1, status: 1 });
//  Start- Shubhangi, 31-12-2020, SCI-I698
module.exports = mongoose.model('partners', schema);
