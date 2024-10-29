var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var defaultId = new mongoose.Types.ObjectId('111111111111111111111111');

var schema = new Schema({
    entity: {
        type: String,
        enum: ['corporate'], 
        trim: true
    },
    entityId:{
        type: String,
    },
    entityName:{
        type: String,
        trim: true
    },
    email: {
        type: String,
        trim: true
    },
    organizationId: {
        type: mongoose.Types.ObjectId,
        ref: 'organization',
    },
    partnerEntity: {
        type: mongoose.Types.ObjectId,
    },
    childEntity: {
        type: mongoose.Types.ObjectId,
        ref: 'corporate',
        default: defaultId
    },
    status: {
        type: String,
        enum: ['invited', 'approved','signedUp','inactive'], 
        trim: true
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'users'
    },
    updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'users'
    }
},{
    timestamps: true
},
{strict: false})


module.exports = mongoose.model('relationship', schema);