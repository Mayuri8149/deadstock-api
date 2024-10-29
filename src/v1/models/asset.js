const mongoose = require('mongoose');

const inputAssetsSchema = new mongoose.Schema({
    inputAssetId: {
        type: String
    }, // Need to add transactionid for getasset details API 
    entity_asset: {
        type: String
    },
    inputAssetQuantity: Number,
    
    inputAssetUom: {
        type: String
    },
    line_level_fields: {
        type: Object,
        default: {}
    },
    inputAssetStatus : {
        type: String,
        enum: ['New','Active','Inactive','Revoked'],
        default: "New"
    } 
});

const refAssetsSchema = new mongoose.Schema({
    refAssetId:{
        type: String,
    },
    refTransactionid:{
        type: String,
    },
    refEntityAsset: {
        type: String,
        default:''
    }
});

 const consumeAssetReferenceSchema =  new mongoose.Schema({
    consumeAssetId:{
        type: String,
    },
    consumeTransactionid:{
        type: String,
    },
    consumeEntityAsset: {
        type: String,
        default:''
    },
    consumeObjectId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'assets',
        default: null,
    },
    consumeDate: {
        type: Date,
        default: Date.now
    }
});

const assetSchema = new mongoose.Schema({
    assetId:{
        type: String,
    },
    transactionid:{
        type: String,
    },
    entityAsset: { //transactionid of asset entry
        type: String,
        default:''
    }, //transactionid
    refOrder: { // transactionid of reference order
        type: String,
        default:''
    },
    orderId : { // transactionid of order entry
        type: String,
        default:''
    },
    assetCategory:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'assetcategories',
        default: null,
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'organizations',
        required: true,
    },
    moduleCode: {
        type: mongoose.Schema.Types.Mixed,
        ref: 'modules',
        // required: true
    },
    transtypeCode: {
        type: mongoose.Schema.Types.Mixed,
        ref: 'transtypes',
        // required: true
    },
    assetType: {
        type: String,
        // required: true
    },
    transactionEntity: {
        type: String,
        required: true
    },
    transactionEntityBranch: {
        type: String,
        default: ""
    },
    transactionEntityType: {
        type: String,
        default: ""
    },
    refEntity: {
        type: String,
        required: true
    },
    refEntityBranch: {
        type: String,
        default: ""
    },
    refEntityType: {
        type: String,
        default: ""
    },
    assetName: {
        type: String,
        default: ""
    },
    location: {
        type: String,
        default: ""
    },
    geolocation: {
        type: Object,
        default: {}
    },
    inputAssets: {
        type: [inputAssetsSchema],
        default: []
    },
    refAsset: { // Details of Poduced Assets
        type: [refAssetsSchema],
        default: []
    },
    consumeInputAssetReferences: { //Details of Consumed Assets
        type: [consumeAssetReferenceSchema],
        default: []
    },
    assetQuantity: {
        type: Number,
        required: true
    },    
    assetUom: {
        type: String,
        required: true
    },
    expiryDate: {
        type: Date,
        default: null
    },
    effectiveDate: {
        type: Date,
        default: null
    },
    provenance:{
        type: Boolean,
        default: false
    },
    fields: {
        type: Object,
        default: {}
    },
    upload_file: {
        type: String,
        default: ""
    }, 
    upload_certificate: {
        type: String,
        default: ""
    }, 
    outside_docs: {
        type: Object,
        default: {}
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

    creator_role: {
        type: String,
        default: ""
    }, 

    modifier_role: {
        type: String,
        default: ""
    }, 
    status :{
        type: String,
        enum: ['New', 'Revoked'],
        default: "New"
    },
    is_deleted:{
        type: Boolean,
        default: false
    },
    nft_status :{
        type: String,
        //enum: ['Not Created', 'Created', 'Onsale', 'Sold'],
        default: "Not Created"
    },
    nftDetails: {
        type: Object,
        default: {}
    },
    
});

const assetInventorySchema = new mongoose.Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'organizations',
        required: true,
    },
    entity: {
        type: String,
        required: true
    },
    entityBranch: {
        type: String,
        default: ""
    },
    entityType: {
        type: String,
        default: ""
    },
    assetId:{
        type: String,
        required: true
    },
    transactionid:{
        type: String,
        //required: true
    },
    entityAsset: {
        type: String,
        default:''
    },     
    
    assetMfgDate:{
        type: Date,
        default: null
    },

    assetExpiryDate: {
        type: Date,
        default: null
    },

    assetUom: {
        type: String,
        required: true
    },
    
    producedQuantity: {
        type: Number,
        dafault: 0
    },  
   
    receivedQuantity: {
        type: Number,
        dafault: 0
    }, 
    consumedQuantity: {
        type: Number,
        dafault: 0
    },
    rejectedQuantity:{
       type: Number,
        dafault: 0
    },

    balancedQuantity: {
        type: Number,
        dafault: 0
    },
    assetStatus : {
        type: String,
        enum: ['Active','Inactive', 'Revoked'],
        default: "Active"
    }
    
});
//////////////////////////////////////////////////////////////////////

const inputEprAssetsSchema = new mongoose.Schema({
    inputEprAssetId: {
        type: String
    },
    entity_epr_asset: {
        type: String
    },
    inputEprAssetQuantity: Number,
    
    inputEprAssetUom: {
        type: String
    },
    line_level_fields: {
        type: Object,
        default: {}
    }
});

const eprRefAssetsSchema = new mongoose.Schema({
    refEprAssetId:{
        type: String,
    },
    refEprTransactionid:{
        type: String,
    },
    refEprEntityAsset: {
        type: String,
        default:''
    }
});

const eprAssetSchema = new mongoose.Schema({
    eprAssetId:{
        type: String,
    },
    eprTransactionid:{
        type: String,
    },
    eprEntityAsset: {
        type: String,
        default:''
    }, //transactionid
    eprRefOrder: {
        type: String,
        default:''
    },
    eprOrderId : {
        type: String,
        default:''
    },
    eprAssetCategory:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'assetcategories',
        default: null,
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'organizations',
        required: true,
    },
    moduleCode: {
        type: mongoose.Schema.Types.Mixed,
        ref: 'modules',
        // required: true
    },
    transtypeCode: {
        type: mongoose.Schema.Types.Mixed,
        ref: 'transtypes',
        // required: true
    },
    assetType: {
        type: String,
        // required: true
    },
    eprAssetType: {
        type: String,
        enum: ['Certificate', 'Credit'],
        default: 'Certificate'
    },
    certificateNumber: {
        type: String,
    },
    transactionEntity: {
        type: String,
        required: true
    },
    transactionEntityBranch: {
        type: String,
        default: ""
    },
    transactionEntityType: {
        type: String,
        default: ""
    },
    refEntity: {
        type: String,
        required: true
    },
    refEntityBranch: {
        type: String,
        default: ""
    },
    refEntityType: {
        type: String,
        default: ""
    },
    eprAssetName: {
        type: String,
        default: ""
    },
    location: {
        type: String,
        default: ""
    },
    geolocation: {
        type: Object,
        default: {}
    },
    state: {
        type: String,
        default: ""
    },
    inputEprAssets: {
        type: [inputEprAssetsSchema],
        default: []
    },
    eprRefAsset: {
        type: [eprRefAssetsSchema],
        default: []
    },
    eprAssetQuantity: {
        type: Number,
        required: true
    },    
    eprAssetUom: {
        type: String,
        required: true
    },
    eprAssetExpiryDate: {
        type: Date,
        default: null
    },
    eprAssetMfgDate: {
        type: Date,
        default: null
    },
    provenance:{
        type: Boolean,
        default: false
    },
    fields: {
        type: Object,
        default: {}
    },
    outside_docs: {
        type: Object,
        default: {}
    },
    upload_file: {
        type: String,
        default: ""
    },
    upload_certificate: {
        type: String,
        default: ""
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

    creator_role: {
        type: String,
        default: ""
    }, 

    modifier_role: {
        type: String,
        default: ""
    }, 
    status :{
        type: String,
        enum: ['New', 'Revoked'],
        default: "New"
    },
    is_deleted:{
        type: Boolean,
        default: false
    },
    
});

const eprAssetInventorySchema = new mongoose.Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'organizations',
        required: true,
    },
    entity: {
        type: String,
        required: true
    },
    entityBranch: {
        type: String,
        default: ""
    },
    entityType: {
        type: String,
        default: ""
    },
    eprAssetId:{
        type: String,
        required: true
    },
    eprTransactionid:{
        type: String,
        //required: true
    },
    eprEntityAsset: {
        type: String,
        default:''
    },     
    
    eprAssetMfgDate:{
        type: Date,
        default: null
    },

    eprAssetExpiryDate: {
        type: Date,
        default: null
    },

    eprAssetUom: {
        type: String,
        required: true
    },
    
    producedQuantity: {
        type: Number,
        dafault: 0
    },  
   
    receivedQuantity: {
        type: Number,
        dafault: 0
    }, 
    consumedQuantity: {
        type: Number,
        dafault: 0
    },
    rejectedQuantity:{
       type: Number,
        dafault: 0
    },

    balancedQuantity: {
        type: Number,
        dafault: 0
    },
    eprAssetStatus : {
        type: String,
        enum: ['Active','Inactive', 'Revoked'],
        default: "Active"
    }
    
});

const Asset = mongoose.model('asset', assetSchema);
const AssetInventory = mongoose.model('asset_inventory', assetInventorySchema);

const EprAsset = mongoose.model('epr_asset', eprAssetSchema);
const EprAssetInventory = mongoose.model('epr_asset_inventory', eprAssetInventorySchema);

module.exports = {
    Asset,
    AssetInventory,
    EprAsset,
    EprAssetInventory,
    ObjectId: mongoose.Types.ObjectId
}
