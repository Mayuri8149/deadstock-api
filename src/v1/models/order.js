const mongoose = require('mongoose');

const orderDetailSchema = new mongoose.Schema({
    referredAsset: {
        type: Boolean,
        default: false
    },
    referredOrder: {
        type: Boolean,
        default: false
    },
    orderItems:   [{
        order_item: {type:String, default: ''},
        line_number: {type:String, default: '001'},
        order_quantity: {type:Number, default: 0},
        order_uom: {type:String, default: ''},      // PO
        asset_category: {type: mongoose.Schema.Types.ObjectId, ref: 'assetcategories',},
        ordered_assetId:{type:String, default: ''},
        ref_order:{type:String, default: ''},
        ref_order_transactionid:{type:String, default: ''},
        entity_asset:{type:String, default: ''},
        accepted_quantity:{type:Number, default:0},
        rejected_quantity:{type:Number, default:0},
        rejection_note:{type:String, default: ''},
        line_level_fields: {
            type: Object,
            default: {}
        },
        quantity_data:[{
            refStepOrder: {type:String, default: ''},
            refStepOrderTransactionid:{type:String, default: ''},
            refStepQuantity: {type:Number, default:0},
            refRemainedQuantity:{type:Number, default:0},
            refStepDate:{
                type: Date,
                default: Date.now}
        }],
        status : {
            type: String,
            enum: ['New', 'Cancelled', 'Rejected' ,'Closed', 'Revoked'],
            default: 'New'
        },
        nft_status :{
            type: String,
            //enum: ['Not Created', 'Created', 'Onsale', 'Sold'],
            default: "Not Created"
        }
    }],   
});

const orderSchema = new mongoose.Schema({
    orderId:{
        type: String,
        required: true
    },
    transactionid:{
        type: String,
        required: true,
        // unique: true
    },
    refOrder:{
        type: Array,
        default: []
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'organizations',
        required: true,
    },
    moduleCode: {
        type: mongoose.Schema.Types.Mixed,
        ref: 'modules',
        required: true
    },
    transtypeCode: {
        type: mongoose.Schema.Types.Mixed,
        ref: 'transtypes',
        required: true
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
    location: {
        type: String,
        default: ""
    },
    state: {
        type: String,
        default: ""
    },
    geolocation: {
        type: Object,
        default: {}
    },
    orderDetails: {
        type: [orderDetailSchema],
        default: []
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
        enum: ['New', 'Cancelled', 'Rejected' ,'Closed', 'Revoked'],
        default: 'New'
      },
      
    is_deleted:{
        type: Boolean,
        default: false
      },     
      trans_from_address :{
        type: String
    }
    
}, { versionKey: false });


////////////////////////////////////////////////////////
const eprOrderDetailSchema = new mongoose.Schema({
    referredEprAsset: {
        type: Boolean,
        default: false
    },
    referredEprOrder: {
        type: Boolean,
        default: false
    },
    orderEprItems:   [{
        epr_order_item: {type:String, default: ''},
        epr_line_number: {type:String, default: '001'},
        epr_order_quantity: {type:Number, default: 0},
        epr_order_uom: {type:String, default: ''},      // PO
        epr_asset_category: {type: mongoose.Schema.Types.ObjectId, ref: 'assetcategories',},
        epr_ordered_assetId:{type:String, default: ''},
        epr_asset_type: {type:String, default: ''},
        epr_ref_order:{type:String, default: ''},
        epr_ref_order_transactionid:{type:String, default: ''},
        epr_entity_asset:{type:String, default: ''},
        epr_accepted_quantity:{type:Number, default:0},
        epr_rejected_quantity:{type:Number, default:0},
        epr_rejection_note:{type:String, default: ''},
        state:{type:String, default: ''},
        epr_line_level_fields: {
            type: Object,
            default: {}
        },
        epr_quantity_data:[{
            eprRefStepOrder: {type:String, default: ''},
            eprRefStepOrderTransactionid:{type:String, default: ''},
            eprRefStepQuantity: {type:Number, default:0},
            eprRefRemainedQuantity:{type:Number, default:0},
            eprRefStepDate:{
                type: Date,
                default: Date.now}
        }]
    }],   
});

const eprOrderSchema = new mongoose.Schema({
    eprOrderId:{
        type: String,
        required: true
    },
    eprTransactionid:{
        type: String,
        required: true,
        // unique: true
    },
    eprRefOrder:{
        type: Array,
        default: []
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'organizations',
        required: true,
    },
    moduleCode: {
        type: mongoose.Schema.Types.Mixed,
        ref: 'modules',
        required: true
    },
    transtypeCode: {
        type: mongoose.Schema.Types.Mixed,
        ref: 'transtypes',
        required: true
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
    location: {
        type: String,
        default: ""
    },
    geolocation: {
        type: Object,
        default: {}
    },
    eprOrderDetails: {
        type: [eprOrderDetailSchema],
        default: []
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
        enum: ['New', 'Cancelled', 'Rejected' ,'Closed', 'Revoked'],
        default: 'New'
      },
      
    is_deleted:{
        type: Boolean,
        default: false
      }
    
});

const Order = mongoose.model('order', orderSchema);
const EprOrder = mongoose.model('epr_order', eprOrderSchema);
module.exports = {
    Order,
    EprOrder,
    ObjectId: mongoose.Types.ObjectId
}
