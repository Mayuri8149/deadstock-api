const express = require('express');
var router = express.Router();
const Joi = require('@hapi/joi');
const _ = require('lodash');
const orderService = require('../services/orderService');
const assetService = require('../services/assetService');
const eprAssetService = require('../services/eprAssetService');
const eprOrderService = require('../services/eprOrderService');
const transactionService = require('../services/transactionServices');
const { authenticateTransaction } = require('../middleware/transaction');
const SUCCESSMSG = require("../lang/success");
const ERRORMSG = require("../lang/error");

router.post('/add_eprorder', authenticateTransaction, async (req, res) => {
    const { error } = validateEprAddOrder(req.body);
        if (error) return req.app.responseHelper.send(res, false, {}, [{ "msg": error.details[0].message}], 500);
    
    if (req.transactionData.validTransactionEntityData.branches)
        req.body.eprTransactionid = req.transactionData.validTransactionEntityData.code + '.' + req.transactionData.validTransactionEntityData.branches.code + '.' + req.transactionData.validTransactionEntityData.transtypes.transactionAutoNumber;
    else req.body.eprTransactionid = req.transactionData.validTransactionEntityData.corporates.code + '.' + req.transactionData.validTransactionEntityData.transtypes.transactionAutoNumber;

    req.body.entityAsset = req.body.eprTransactionid;
    
    const refTransactionTypeResult = await transactionService.getTransTypeData(req.transactionData.validTransactionEntityData.transtypes);
    
    let payloadData = req.body;
    
    payloadData.creator_id =  req.user.userId;
    payloadData.modifier_id = req.user.userId;
    payloadData.created_by = req.user.email;
    payloadData.modified_by = req.user.email;
    payloadData.creator_role = req.user.role;
    payloadData.modifier_role = req.user.role;
    payloadData.eprOrderId = req.transactionData.validTransactionEntityData.transtypes.transactionAutoNumber;
    payloadData.eprConsume = req.transactionData.validTransactionEntityData.transtypes.eprConsume;
    payloadData.eprReceive = req.transactionData.validTransactionEntityData.transtypes.eprReceive;
    var result = await eprOrderService.addEprOrder(payloadData);
    const refOrderId = result.eprTransactionid;
    payloadData.refOrderId = refOrderId;

    if(result.eprOrderDetails[0].referredEprOrder){
        const updateresult = await eprOrderService.updateEprOrderStatus(payloadData.eprOrderDetails[0].orderEprItems, result);            
        if(!result.eprOrderDetails[0].referredEprAsset && refTransactionTypeResult.assetWithoutReference){
            result.creator_id = req.user.userId;
            result.modifier_id = req.user.userId;

            result.created_by = req.user.email;
            result.modified_by = req.user.email;

            result.creator_role = req.user.role;
            result.modifier_role = req.user.role;
            result.eprConsume = req.transactionData.validTransactionEntityData.transtypes.eprConsume;
            result.eprReceive = req.transactionData.validTransactionEntityData.transtypes.eprReceive;
            
            // const referredAssetResult = await assetService.receiveEprAsset(result, req.transactionData.validTransactionEntityData.transtypes);
            if(req.transactionData.validTransactionEntityData.transtypes.eprReceive){
                // payloadData.refOrderId = result.orderId
                result.transactionid = req.body.eprTransactionid
                const eprasset_res = await eprAssetService.eprreceiveAsset(result, req.transactionData.validTransactionEntityData.transtypes);
            }
        }
    }
    req.body.assetType = req.transactionData.validTransactionEntityData.transtypes.assetType;

    if(!req.transactionData.validTransactionEntityData.transtypes.assetWithoutReference){

        if(result.eprOrderDetails[0].referredEprOrder &&  result.eprOrderDetails[0].referredEprAsset || req.transactionData.validTransactionEntityData.transtypes.eprConsume || req.transactionData.validTransactionEntityData.transtypes.eprConsume ){
            req.body.assetType = req.transactionData.validTransactionEntityData.transtypes.assetType;
            payloadData.eprOrderId = result.eprOrderId;
            // const asset_res = await assetService.addAssetOnAssetType(payloadData);
            // if(req.transactionData.validTransactionEntityData.transtypes.epr){
                const eprasset_res = await eprAssetService.addEprAssetOnAssetType(payloadData);
            // }
        }
    }
   


    let responseObj = {
        'message': SUCCESSMSG[1001],
        result
    }
    return req.app.responseHelper.send(res, true, responseObj, [], 200);
})

router.get('/', async (req, res) => {
    const { error } = validateGetOrders(req.query);
    if (error) return req.app.responseHelper.send(res, false, {}, [{ "msg": error.details[0].message }], 500);
    req.query.isCorporate = req.user.entity && req.user.entity.toLowerCase() == "corporate";
    req.query.corporateId = req.user.reference.corporateId
    req.query.userEntityCode = req.user.reference.code
    const result = await eprOrderService.getEprOrders(req.query);
    let responseObj = result;
    responseObj['message'] = SUCCESSMSG[5001];

    return req.app.responseHelper.send(res, true, responseObj, [], 200);
})

router.get('/getEprOrdersByStatus', async (req, res) => {
    const { error } = validateGetOrdersByStatus(req.query);
    if (error) return req.app.responseHelper.send(res, false, {}, [{ "msg": error.details[0].message }], 500);
    req.query.isCorporate = req.user.entity && req.user.entity.toLowerCase() == "corporate";
    req.query.corporateId = req.user.reference.corporateId
    req.query.userEntityCode = req.user.reference.code
    const result = await eprOrderService.getEprOrdersByStatus(req.query);
    let responseObj = result;
    responseObj['message'] = SUCCESSMSG[5001];

    return req.app.responseHelper.send(res, true, responseObj, [], 200);
})


router.get('/:eprOrderObjectId', async (req, res) => {
    req.query.eprOrderObjectId = req.params.eprOrderObjectId;
    const result = await eprOrderService.geteprOrderFullDetails(req.query);
    if (!result) {
        return req.app.responseHelper.send(res, false, {}, [{ "msg": ERRORMSG[50001] }], 404);
    }
    let responseObj = result;
    responseObj['message'] = SUCCESSMSG[5002];

    return req.app.responseHelper.send(res, true, responseObj, [], 200);
});

router.post('/edit',  async(req, res) => {
    var payloadData = req.body
    
    const result = await eprOrderService.updateEprOrderData(payloadData);
    if (!result) {
        let errors = [{
            "msg": "Something went wrong!"
        }];
        return req.app.responseHelper.send(res, false, errors, [], 500);
    }
    return req.app.responseHelper.send(res, true, {}, [], 200);
});

function validateEprAddOrder(payloadData) {
    const orderSchema = Joi.object().keys({
        referredEprAsset: Joi.boolean(),
        referredEprOrder: Joi.boolean(),
        orderEprItems: Joi.array(),        
        trans_from_address: Joi.string().allow('')
    });
    const schema = {
        // orderId: Joi.string().required(),
        // transactionid: Joi.string().required(),
        organizationId: Joi.string(),
        eprRefOrder: Joi.string(),
        moduleCode: Joi.string().required(),
        transtypeCode: Joi.string().required(),

        transactionEntity: Joi.string().required(),
        transactionEntityBranch: Joi.string(),
        transactionEntityType: Joi.string().required().valid(['Organization', 'Partner']),
        refEntity: Joi.string().required(),
        refEntityBranch: Joi.string(),
        refEntityType: Joi.string().required().valid(['Organization', 'Partner']),

        eprOrderDetails: Joi.array().items(orderSchema),
        location: Joi.string(),
        geolocation: Joi.object().required(),
        fields: Joi.object(),
        upload_file: Joi.string(),
        upload_certificate: Joi.string(),
        status: Joi.string().required().valid(['New', 'Cancelled', 'Rejected', 'Closed']),
        trans_from_address: Joi.string().allow('')
    }
    return Joi.validate(payloadData, schema);
}

function validateGetOrders(payloadData) {
    const schema = {
        isRefEntity: Joi.string(),
        transactionEntity: Joi.string(),
        refEntity: Joi.string(),
        organizationId: Joi.string(),
        // entityCode: Joi.string().required(),
        entityType: Joi.string().valid(["transactionEntity", "refEntity", ""]),
        transactionTypeCode: Joi.string(),
        eprAssetId: Joi.string().allow(''),
        eprAssetName: Joi.string().allow(''),
        refEntityName: Joi.string().allow(''),
        moduleId: Joi.string().allow(''),
        moduleName: Joi.string().allow(''),
        transactionTypeName: Joi.string().allow(''),
        transactionTypeCode: Joi.string().allow(''),
        branchLocation: Joi.string(),
        startIndex: Joi.string(),
        assetLocation: Joi.string(),
        eprOrderId: Joi.string(),
        eprAssetCategory: Joi.string(),
        status: Joi.string(),
        limit: Joi.string(),
        searchKey: Joi.string(),
        allFields: Joi.boolean(),
        sortKey: Joi.string().allow(''),
        sortOrder: Joi.string().valid(["ASC", "DESC", ""]).insensitive(),
        isType: Joi.string().valid(["orderlist", ""]),        
        branchCode: Joi.string().allow(''),
    }
    return Joi.validate(payloadData, schema);
}

function validateGetOrdersByStatus(payloadData) {
    const schema = {
        organizationId: Joi.string(),
        startIndex: Joi.string(),
        limit: Joi.string(),
        allFields: Joi.boolean(),
        epr: Joi.string().allow(''),
        transRole: Joi.string().allow(''),
        eprReceive: Joi.string().allow(''),
        eprConsume: Joi.string().allow(''),
        eprOrderId:Joi.string().allow(''),
        refEntity: Joi.string().allow(''),
        state: Joi.string().allow(''),
        month: Joi.string().allow(''),
        eprRefOrder: Joi.string().allow('')
    }
    return Joi.validate(payloadData, schema);
}


module.exports = router;