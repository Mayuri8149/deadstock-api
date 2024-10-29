const mongoose = require('mongoose');

const assetProvenanceSchema = new mongoose.Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'organization',
    },
    assetProvenanceField: {
        type: Array,
        default: []
    },    
    created_on: {
        type: Date,
        default: Date.now
    },
    modified_on: {
        type: Date,
        default: Date.now
    }, 
    creator_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        default: null
    },
    
    modifier_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        default: null
    },

    created_by: {
        type: String,
        default: ""
    }, 

    modified_by: {
        type: String,
        default: ""
    },
});

const assetprovenance = mongoose.model('assetprovenancesetup', assetProvenanceSchema);
module.exports = {
    assetprovenance,
    ObjectId: mongoose.Types.ObjectId
}
