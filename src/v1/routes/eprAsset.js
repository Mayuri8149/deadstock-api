const express = require('express');
var router = express.Router();
const Joi = require('@hapi/joi');
const _ = require('lodash');
const assetService = require('../services/assetService');
const eprAssetService = require('../services/eprAssetService');
const { authenticateTransaction } = require('../middleware/transaction');
const transactionService = require('../services/transactionServices');
const SUCCESSMSG = require("../lang/success");
const ERRORMSG = require("../lang/error");

router.get('/printEPRCertificate', async (req, res) => {
    let objectID= {}
    objectID.assetObjectId = req.query.assetObjectId;
    const assetDetails = await eprAssetService.getEPRAssetFullDetails(objectID);

    const eprPrint = await eprAssetService.eprPrint(assetDetails)

    let responseObj = assetDetails;
    responseObj['message'] = SUCCESSMSG[4001];
    
    return req.app.responseHelper.send(res, true, responseObj, [], 200);
});

router.post('/add_asset', authenticateTransaction, async (req, res) => {
    req.body.eprAssetId = req.transactionData.validTransactionEntityData.transtypes.transactionAutoNumber;

     req.body.creator_id = req.user.userId;
    req.body.modifier_id = req.user.userId;

    req.body.created_by = req.user.email;
    req.body.modified_by = req.user.email;

    req.body.creator_role = req.user.role;
    req.body.modifier_role = req.user.role;

    req.body.assetType = req.transactionData.validTransactionEntityData.transtypes.assetType;
    req.body.provenance = req.transactionData.validTransactionEntityData.transtypes.provenance;
    
    if(!req.transactionData.validTransactionEntityData.corporates)
    req.body.eprTransactionid = req.transactionData.validTransactionEntityData.code+'.'+req.transactionData.validTransactionEntityData.branches.code+'.'+req.transactionData.validTransactionEntityData.transtypes.transactionAutoNumber;
    else req.body.eprTransactionid = req.transactionData.validTransactionEntityData.corporates.code+'.'+req.transactionData.validTransactionEntityData.transtypes.transactionAutoNumber;
    req.body.eprEntityAsset = req.body.eprTransactionid;

    let payloadData = req.body;
    payloadData.certificateNumber = 'EPR_'+Math.floor( Math.random() * 1000 )+'.pdf';
    // EPR_'+certificateNumber+'.pdf
    // if(!req.transactionData.validTransactionEntityData.transtypes.epr && !req.transactionData.validTransactionEntityData.transtypes.inputAsset){
        // const assetQuantityAssetType = await assetService.assetQuantityOnAssetType(payloadData);    
        const eprassetQuantity = await eprAssetService.eprassetQuantity(payloadData)
        const result = await eprAssetService.addEPRAsset(payloadData);
        if(payloadData.inputEprAssets.length){
            let objectID= {}
            objectID.assetObjectId = result._id;
            const assetDetails = await eprAssetService.getEPRAssetFullDetails(objectID);
            const eprPrint = await eprAssetService.eprPrint(assetDetails)
        }       

        var responseObj = {  
            'message': SUCCESSMSG[1001],      
            result
        }
    // }
    let eprPayloadData = {};
    eprPayloadData.organizationId = payloadData.organizationId
    eprPayloadData.moduleCode = payloadData.moduleCode
    eprPayloadData.transtypeCode = payloadData.transtypeCode
    eprPayloadData.eprAssetId = payloadData.assetId
    eprPayloadData.eprTransactionid = payloadData.transactionid
    eprPayloadData.transactionEntity = payloadData.transactionEntity
    eprPayloadData.transactionEntityBranch = payloadData.transactionEntityBranch
    eprPayloadData.transactionEntityType = payloadData.transactionEntityType
    eprPayloadData.refEntity = payloadData.refEntity
    eprPayloadData.refEntityBranch = payloadData.refEntityBranch
    eprPayloadData.refEntityType = payloadData.refEntityType
    eprPayloadData.eprEntityAsset = payloadData.entityAsset
    eprPayloadData.eprRefOrder = payloadData.eprRefOrder
    eprPayloadData.eprOrderId = payloadData.orderId
    eprPayloadData.eprAssetCategory = payloadData.assetCategory
    eprPayloadData.eprAssetType = payloadData.assetType
    eprPayloadData.eprAssetName = payloadData.assetName
    eprPayloadData.eprAssetQuantity = payloadData.assetQuantity
    eprPayloadData.eprAssetUom = payloadData.assetUom
    eprPayloadData.inputEprAssets = payloadData.inputAssets
    if(req.transactionData.validTransactionEntityData.transtypes.epr && eprPayloadData.inputEprAssets){
        // const eprresult = await eprAssetService.addEPRAsset(eprPayloadData);
        const eprassetQuantity = await eprAssetService.eprassetQuantity(eprPayloadData)
            console.log('51---eprassetQuantity---',eprassetQuantity)
            var responseObj = {  
                'message': SUCCESSMSG[1001],      
                eprassetQuantity
            }
        }
    // const inventory_result = await assetService.updateAssetInventory(result);
    // let responseObj = {  
    //     'message': SUCCESSMSG[1001],      
    //     result
    // }
    return req.app.responseHelper.send(res, true, responseObj, [], 200);
});

router.get('/', async (req, res) => {
    const assetType = req.query && req.query.assetType ? req.query.assetType.split(",") : [];
    req.query.assetType = assetType;
    const { error } = validateGeteprAssets(req.query);
    if (error) return req.app.responseHelper.send(res, false, {}, [{ "msg": error.details[0].message }], 500);
    const result = await eprAssetService.geteprAssets(req.query);
    let responseObj = result;
    responseObj['message'] = SUCCESSMSG[4001];
    
    return req.app.responseHelper.send(res, true, responseObj, [], 200);
});

router.get('/get_epr_entityAssets', async (req, res) => {
    const { error } = validateGetEntityAssets(req.query);
    if (error) return req.app.responseHelper.send(res, false, {}, [{ "msg": error.details[0].message }], 500);

    const result = await eprAssetService.getEprEntityAssets(req.query);
    let responseObj = result;
    responseObj['message'] = SUCCESSMSG[4001];

    return req.app.responseHelper.send(res, true, responseObj, [], 200);
});


router.get('/getEprAssetsByTargetOrder', async (req, res) => {
    const { error } = validateGetEntityAssetsByOrderId(req.query);
    if (error) return req.app.responseHelper.send(res, false, {}, [{ "msg": error.details[0].message }], 500);

    const result = await eprAssetService.getEprEntityAssetsByOrder(req.query);
    let responseObj = result;
    responseObj['message'] = SUCCESSMSG[4001];

    return req.app.responseHelper.send(res, true, responseObj, [], 200);
});



router.get('/getEprAssetsByEntityAsset', async (req, res) => {
    const { error } = validateGetEntityAssetsByEntityAsset(req.query);
    if (error) return req.app.responseHelper.send(res, false, {}, [{ "msg": error.details[0].message }], 500);
    const result = await eprAssetService.getEprAssetDetailsByEntityAsset(req.query);
    let responseObj = result;
    responseObj['message'] = SUCCESSMSG[4001];

    return req.app.responseHelper.send(res, true, responseObj, [], 200);
});



router.get('/:assetObjectId', async (req, res) => {
    req.query.assetObjectId = req.params.assetObjectId;
    const result = await eprAssetService.getEPRAssetFullDetails(req.query);
    if (!result) {
        return req.app.responseHelper.send(res, false, {}, [{ "msg": ERRORMSG[50001] }], 404);
    }
    let responseObj = result;
    responseObj['message'] = SUCCESSMSG[5002];

    return req.app.responseHelper.send(res, true, responseObj, [], 200);
});

router.post('/edit',  async(req, res) => {
    var payloadData = req.body
    
    const result = await eprAssetService.updateEprData(payloadData);
    if (!result) {
        let errors = [{
            "msg": "Something went wrong!"
        }];
        return req.app.responseHelper.send(res, false, errors, [], 500);
    }
    return req.app.responseHelper.send(res, true, {}, [], 200);
});

function validateGetEntityAssets(payloadData) {
    const schema = {
        _id: Joi.string(),
        transactionEntity: Joi.string().required(),
        transactionEntityBranch: Joi.string(),
        organizationId: Joi.string(),
        startIndex: Joi.string(),
        limit: Joi.string(),
        state: Joi.string(),
        eprAssetCategory: Joi.string(),
        eprAssetCategoryId: Joi.string(),
        eprAssetType: Joi.string(),
        allFields: Joi.boolean(),
        eprAssetId: Joi.string().allow(''),
        eprAssetName: Joi.string().allow(''),
        payloadDate: Joi.string().allow(''),
        transactionEntityName: Joi.string().allow(''),
        assetType: Joi.string().allow(''),
        eprTransactionId: Joi.string(),
        assetLocation: Joi.string(),
        sortKey: Joi.string().allow(''),
        sortOrder: Joi.string().valid(["ASC", "DESC", ""]).insensitive(),
        getAllBalancedQuantity: Joi.boolean(),
        inputAssetSearch_key: Joi.string()
    }
    return Joi.validate(payloadData, schema);
}

function validateGetEntityAssetsByOrderId(payloadData) {
    const schema = {
        _id: Joi.string(),
        organizationId: Joi.string(),
        startIndex: Joi.string(),
        limit: Joi.string(),
        eprOrderId: Joi.string().allow(''),
        eprAssetType: Joi.string().allow(''),
        eprEntityAsset: Joi.string().allow(''),
    }
    return Joi.validate(payloadData, schema);
}


function validateGetEntityAssetsByEntityAsset(payloadData) {
    const schema = {
        _id: Joi.string(),
        organizationId: Joi.string(),
        startIndex: Joi.string(),
        limit: Joi.string(),
        eprEntityAsset: Joi.string().allow(''),
        assetType: Joi.string().allow(''),
        eprAssetType: Joi.string().allow(''),
        eprAssetCategory: Joi.string().allow(''),
        eprRefOrder: Joi.string().allow(''),
    }
    return Joi.validate(payloadData, schema);
}



function validateGeteprAssets(payloadData) {
    const schema = {
        transactionEntity: Joi.string().required(),
        transactionid: Joi.string(),
        organizationId: Joi.string(),
        transactionTypeCode: Joi.string(),
        startIndex: Joi.string(),
        limit: Joi.string(),
        assetType: Joi.array().items(Joi.string()),
        allFields: Joi.boolean(),
        eprAssetId: Joi.string().allow(''),
        eprAssetName: Joi.string().allow(''),
        moduleId: Joi.string().allow(''),
        moduleName: Joi.string().allow(''),
        transactionTypeName: Joi.string().allow(''),
        transactionTypeCode: Joi.string().allow(''),
        assetLocation: Joi.string(),
        eprTransactionId: Joi.string(),
        branchLocation: Joi.string(),
        eprAssetCategory: Joi.string(),
        inputAssetFlag: Joi.string(),
        status: Joi.string(),
        sortKey: Joi.string().allow(''),
        sortOrder: Joi.string().valid(["ASC", "DESC", ""]).insensitive(),
        statusFlag: Joi.string().allow('')
    }
    return Joi.validate(payloadData, schema);
}

module.exports = router;