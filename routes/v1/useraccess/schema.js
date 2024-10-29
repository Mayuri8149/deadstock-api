var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var defaultId = new mongoose.Types.ObjectId('111111111111111111111111');

var schema = new Schema({
    organizationId: {
        type: mongoose.Types.ObjectId,
        ref: 'organization',
    },
    moduleId: {
        type: mongoose.Types.ObjectId,
        ref: 'module',
    },
    batchId: {
        type: mongoose.Types.ObjectId,
        ref: 'batch',
    },
    transactionId: {
        type: mongoose.Types.ObjectId,
        ref: 'transtypes',
    },
    transTypeId: {
        type: mongoose.Types.ObjectId,
        ref: 'transactiontype',
    },
    partnerId: {
        type: mongoose.Types.ObjectId,
        ree:'user'
      
    },
    isRead: {
        type: Boolean,
        default: false
    },
    isWrite: {
        type: Boolean,
        default: false
    },
    isDelete: {
        type: Boolean,
        default: false
    },
    isUpdate: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'users'
    },
    updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'users'
    },
    status: {
        type: String,
        enum: ['active','inactive'], 
        trim: true
    },
},{
    timestamps: true
},
{strict: false})

schema.index({organizationId:1,moduleId:1,transactionId:1,partnerId:1}, { unique: true });
module.exports = mongoose.model('useraccess', schema);