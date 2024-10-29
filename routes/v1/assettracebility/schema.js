var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
    organizationId: {
        type: mongoose.Types.ObjectId,
        ref: 'organization',
    },
    label: {
        type: String
    },
    isTransactionType: {
        type: Boolean
    },
    isAssetName: {
        type: Boolean
    },
    isAssetCategory: {
        type: Boolean
    },
    isInputAsset: {
        type: Boolean
    },
    isBranch: {
        type: Boolean
    },
    isAssetLocation: {
        type: Boolean
    },
    isQuantity: {
        type: Boolean
    },
    isUom: {
        type: Boolean
    },
    isEffectiveDate: {
        type: Boolean
    },
    isExpiryDate: {
        type: Boolean
    },
    fields: {
        type: Schema.Types.Mixed,
        default: {}
    },
    assetTraceabilityField: {
        type: Schema.Types.Mixed,
        default: {}
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'users'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    transactionTypeCode:{
        type: String
    },
    updatedAt: {
		type : Date, 
		default : Date.now
	},
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'users'
    },
    updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'users'
    },
},
{strict: false})

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

module.exports = mongoose.model('assettracebilitysetup', schema);