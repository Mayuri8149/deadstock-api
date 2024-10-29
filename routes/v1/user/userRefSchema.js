var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var defaultId = new mongoose.Types.ObjectId('111111111111111111111111');

var schema = new Schema({
	userId: {
		type: mongoose.Types.ObjectId,
		ref: "user"
	},
	userName: {
		type: String
	},
	organizationId: {
		type: mongoose.Types.ObjectId,
		ref: "organization",
		default: defaultId
	},
	departmentId: {
		type: mongoose.Types.ObjectId,
		ref: "department",
		default: defaultId
	},
	affiliateId: {
		type: mongoose.Types.ObjectId,
		ref: "affiliate",
		default: defaultId
	},
	corporateId: {
		type: mongoose.Types.ObjectId,
		ref: "corporate",
		default: defaultId
	},
	entity: {
		type: String
	},
	role: {
		type: String
	},
	//============================ Start - Shubhangi (SNA-I5) - 13-05-2021 ============================
	roleName: {
		type: String
	},
	//============================ End - Shubhangi (SNA-I5) - 26-05-2021 ============================
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
},{
    timestamps: true
},
{strict: false})

//  Start- Shubhangi, 31-12-2020, SCI-I698
schema.index({ organizationId:1,affiliateId:1,entity:1,role:1});
//  Start- Shubhangi, 31-12-2020, SCI-I698
module.exports = mongoose.model('userReference', schema);