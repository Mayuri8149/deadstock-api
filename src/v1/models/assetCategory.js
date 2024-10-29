const mongoose = require('mongoose');

const assetListSchema = new mongoose.Schema({
    assetName: {
        type: String
    },
    assetDescription: {
        type: String
    },
    status: {
        type: Boolean,
        default: false
    }   
});
const assetCategorySchema = new mongoose.Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'organizations',
        required: true,
    },
    assetCategory: {
        type: String
    },  
    assetCategoryDescription: {
        type: String
    },   
    assetList: {
        type: [assetListSchema],
        default: []
    },
    provenanceTemplatePath: {
        type: String
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
    is_deleted:{
        type: Boolean,
        default: false
    },
    status: {
        type: Boolean,
        default: false
    }   
});

const AssetCategory = mongoose.model('assetCategory', assetCategorySchema);
module.exports = {
    AssetCategory,
    ObjectId: mongoose.Types.ObjectId
}