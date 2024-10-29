const mongoose = require('mongoose');

const uomSchema = new mongoose.Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'organizations',
        required: true,
    },
    uom: {
        type: String
    },  
    decimal: {
        type: Number
    },  
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }, 
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        default: null
    },
    
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        default: null
    }
    
});

const UOM = mongoose.model('uom', uomSchema);
module.exports = {
    UOM,
    ObjectId: mongoose.Types.ObjectId
}