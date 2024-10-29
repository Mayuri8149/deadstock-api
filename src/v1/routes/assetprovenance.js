const express = require('express');
var router = express.Router();
const Joi = require('@hapi/joi');
const _ = require('lodash');
const assetprovenanceService = require('../services/assetprovenanceService');
const { authenticateTransaction } = require('../middleware/transaction');
const SUCCESSMSG = require("../lang/success");
const ERRORMSG = require("../lang/error");

router.post('/create', async (req, res) => {

    const { error } = validateAddAssetProvenance(req.body);
    if (error) return req.app.responseHelper.send(res, false, {}, [{ "msg": error.details[0].message}], 500);
   
    var payloadData = req.body;
    payloadData.creator_id = req.user.userId;
    payloadData.modifier_id = req.user.userId;

    payloadData.created_by = req.user.email;
    payloadData.modified_by = req.user.email;

    const checkDuplicateresult =  await assetprovenanceService.getAssetProvenanceFullDetails(payloadData);
    if(checkDuplicateresult){
        var result = await assetprovenanceService.updateAssetProvenance(payloadData);
    }else{
        var result = await assetprovenanceService.addAssetProvenance(payloadData);
    }
    
    let responseObj = {  
        'message': SUCCESSMSG[1001],      
        result
    }
    return req.app.responseHelper.send(res, true, responseObj, [], 200);
});

router.get('/:assetProvenanceObjectId', async (req, res) => {
    req.query.assetProvenanceObjectId = req.params.assetProvenanceObjectId;
    
    const result = await assetprovenanceService.getAssetProvenanceFullDetails(req.query);
    if (!result) {
        return req.app.responseHelper.send(res, false, {}, [{ "msg": ERRORMSG[40001] }], 404);
    }
    let responseObj = result;
    responseObj['message'] = SUCCESSMSG[4002];

    return req.app.responseHelper.send(res, true, responseObj, [], 200);
});

function validateAddAssetProvenance(payloadData) {
    const schema = {      
        organizationId: Joi.string(),
        assetProvenanceField: Joi.array()
    }
    return Joi.validate(payloadData, schema);
}
module.exports = router;
