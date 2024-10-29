var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
	moduleId: {
		type: mongoose.Types.ObjectId,
        ref: 'module'
	},
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
	isActive: {
		type: Boolean,
		default: false
	}
},{
    timestamps: true
});

//  Start- Shubhangi, 31-12-2020, SCI-I698
schema.index({ moduleId: 1,affiliateId: 1});
//  End- Shubhangi, 31-12-2020, SCI-I698
module.exports = mongoose.model('affiliateModules', schema);