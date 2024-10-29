const express = require('express');
var router = express.Router();
const Joi = require('@hapi/joi');
const _ = require('lodash');
const assetCategoryService = require('../services/assetCategoryService');
const { authenticateTransaction } = require('../middleware/transaction');
const SUCCESSMSG = require("../lang/success");
const ERRORMSG = require("../lang/error");

router.post('/create', async (req, res) => {

    const { error } = validateAddAsset(req.body);
    if (error) return req.app.responseHelper.send(res, false, {}, [{ "msg": error.details[0].message}], 500);
   
    var payloadData = req.body;
    payloadData.creator_id = req.user.userId;
    payloadData.modifier_id = req.user.userId;

    payloadData.created_by = req.user.email;
    payloadData.modified_by = req.user.email;
    
    const checkDuplicateresult =  await assetCategoryService.getAssetDuplicateDetails(payloadData);
    if(checkDuplicateresult){
        let errors = [{
            "msg": "Something went wrong!"
        }];
        return req.app.responseHelper.send(res, false, errors, [], 500);
    }else{
        var result = await assetCategoryService.addAsset(payloadData);
    }

    let responseObj = {  
        'message': SUCCESSMSG[1001],      
        result
    }
    return req.app.responseHelper.send(res, true, responseObj, [], 200);
});

router.get('/', async (req, res) => { 
    const { error } = validateGetAssets(req.query);
    if (error) return req.app.responseHelper.send(res, false, {}, [{ "msg": error.details[0].message }], 500);
    const result = await assetCategoryService.getAssets(req.query);
    let responseObj = result;
    responseObj['message'] = SUCCESSMSG[4001];
    
    return req.app.responseHelper.send(res, true, responseObj, [], 200);
});

router.get('/:assetObjectId', async (req, res) => {
    req.query.assetObjectId = req.params.assetObjectId;
    const result = await assetCategoryService.getAssetFullDetails(req.query);
    if (!result) {
        return req.app.responseHelper.send(res, false, {}, [{ "msg": ERRORMSG[40001] }], 404);
    }
    let responseObj = result;
    responseObj['message'] = SUCCESSMSG[4002];

    return req.app.responseHelper.send(res, true, responseObj, [], 200);
});

router.post('/edit',  async(req, res) => {
    var payloadData = req.body
    
    payloadData.modifier_id = req.user.userId;
    payloadData.modified_by = req.user.email;
    const checkDuplicateresult =  await assetCategoryService.getAssetNameDuplicateDetails(payloadData);
    
    if(checkDuplicateresult){
        let errors = [{
            "msg": "Something went wrong!"
        }];
        return req.app.responseHelper.send(res, false, errors, [], 500);
    }else{
        const result = await assetCategoryService.updateAssetCategory(payloadData);
        if (!result) {
            let errors = [{
                "msg": "Something went wrong!"
            }];
            return req.app.responseHelper.send(res, false, errors, [], 500);
        }
        return req.app.responseHelper.send(res, true, {}, [], 200);
    }

});

router.post('/editAssetCat',  async(req, res) => {
    var payloadData = req.body
    
    payloadData.modifier_id = req.user.userId;
    payloadData.modified_by = req.user.email;
    const result = await assetCategoryService.updateAssetCategory(payloadData);
    if (!result) {
        let errors = [{
            "msg": "Something went wrong!"
        }];
        return req.app.responseHelper.send(res, false, errors, [], 500);
    }
    return req.app.responseHelper.send(res, true, {}, [], 200);

});


router.get('/getAssetDuplicateDetails',  async(req, res) => {
    var payloadData = req.body
    
    payloadData.modifier_id = req.user.userId;
    payloadData.modified_by = req.user.email;

    const result =  await assetCategoryService.getAssetNameDuplicateDetails(payloadData);
  
        if (!result) {
            let errors = [{
                "msg": "Something went wrong!"
            }];
            return req.app.responseHelper.send(res, false, errors, [], 500);
        }
        return req.app.responseHelper.send(res, true, {}, [], 200);

});

router.post('/delete/:id/', async (req, res) => {
    const { id } = req.params;
    const result = await assetCategoryService.deleteAssetCategory(id);
    if (!result) {
        let errors = [{
            "msg": "Something went wrong!"
        }];
        return req.app.responseHelper.send(res, false, errors, [], 500);
    }
    return req.app.responseHelper.send(res, true, {}, [], 200);
});

router.post('/delete/:id/:assetListId', async (req, res) => {
    const { id,assetListId } = req.params;
    const result = await assetCategoryService.deleteAssetCategory(id,assetListId);
    if (!result) {
        let errors = [{
            "msg": "Something went wrong!"
        }];
        return req.app.responseHelper.send(res, false, errors, [], 500);
    }
    return req.app.responseHelper.send(res, true, {}, [], 200);
});

function validateAddAsset(payloadData) {

    const schema = {      
        organizationId: Joi.string().required(),
        assetCategory :Joi.string().required(),
        assetCategoryDescription :Joi.string().required(),
    }
    return Joi.validate(payloadData, schema);
}

function validateGetAssets(payloadData) {
    const schema = {
        organizationId: Joi.string().required(),
        assetCategory: Joi.string(),
        assetCategoryDescription: Joi.string(),
        provenanceTemplatePath: Joi.string(),
        flag: Joi.string(),
        assetListId: Joi.string(),
        assetName: Joi.string(),
        assetDescription: Joi.string(),
        startIndex: Joi.string(),
        limit: Joi.string(),
        sortKey: Joi.string().allow(''),
        searchKey: Joi.string(),
        sortOrder: Joi.string().valid(["ASC", "DESC", ""]).insensitive()
    }
    return Joi.validate(payloadData, schema);
}
module.exports = router;
