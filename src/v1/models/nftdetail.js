const mongoose = require('mongoose');

const nftSchema = new mongoose.Schema({
    tokenId:{
        type: String,
        required: true
    },
    token_address:{
        type: String,
        required: true,
    },
    assetId:{
        type: String,
        required: true,
    },
    assetId:{
        type: String,
        required: true,
    },
    transactionid:{
        type: String,
        required: true,
    },
    provenanceTemplatePath:{
        type: String,
        required: true,
    },
    provenanceHash:{
        type: String,
        required: true,
    },
    assetName: {
        type: String,
        required: true,
    },
    assetImg: {
        type: String,
        required: true,
    },
    no_of_copies: {
        type: Number,
        required: true,
    },
    creator: {
        type: String,
        required: true,
    },
    nft_sale: [{
        owner: {type:String, default: ''},
        ownerName: {type:String, default: ''},
        ownedCopies: {type:Number, default: 0},
        sale_copies: {type:Number, default: 0},
        fixedPrice: {type:Number, default: 0},
        fixedFlag:{type:String, default: ''},
        previous_owner:{type:String, default: ''},
        trx_hash:{type:String, default: ''}
    }],         
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
    }
    
}, { versionKey: false });

const Nft = mongoose.model('nft', nftSchema);
module.exports = {
    Nft,
    ObjectId: mongoose.Types.ObjectId
}
