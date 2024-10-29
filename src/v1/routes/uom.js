const express = require('express');
var router = express.Router();
const Joi = require('@hapi/joi');
const _ = require('lodash');
const uomService = require('../services/uomService');
const { authenticateTransaction } = require('../middleware/transaction');
const SUCCESSMSG = require("../lang/success");
const ERRORMSG = require("../lang/error");

//Create
router.post('/create', async (req, res) => {

    const { error } = validateAddUOM(req.body);
    if (error) return req.app.responseHelper.send(res, false, {}, [{ "msg": error.details[0].message}], 500);
    req.body.createdBy = req.user.userId;
    req.body.updatedBy = req.user.userId;

    var payloadData = req.body;

    const checkDuplicateresult =  await uomService.getUomDuplicateDetails(payloadData);
    if(checkDuplicateresult){
        let errors = [{
            "msg": "Something went wrong!"
        }];
        return req.app.responseHelper.send(res, false, errors, [], 500);
    }else{
        var result = await uomService.AddUOM(payloadData);
    }

    let responseObj = {  
        'message': SUCCESSMSG[1001],      
        result
    }
    return req.app.responseHelper.send(res, true, responseObj, [], 200);
});

router.get('/', async (req, res) => {
    const { error } = validateGetUOM(req.query);
    if (error) return req.app.responseHelper.send(res, false, {}, [{ "msg": error.details[0].message }], 500);
    const result = await uomService.getUOM(req.query);
    let responseObj = result;
    responseObj['message'] = SUCCESSMSG[4001];
    
    return req.app.responseHelper.send(res, true, responseObj, [], 200);
});

router.get('/:uomObjectId', async (req, res) => {
    req.query.uomObjectId = req.params.uomObjectId;
    const result = await uomService.getuomFullDetails(req.query);
    if (!result) {
        return req.app.responseHelper.send(res, false, {}, [{ "msg": ERRORMSG[40001] }], 404);
    }
    let responseObj = result;
    responseObj['message'] = SUCCESSMSG[4002];

    return req.app.responseHelper.send(res, true, responseObj, [], 200);
});

router.post('/edit',  async(req, res) => {
    var uomDetails = req.body
     req.body.updatedBy = req.user.userId;
     var payloadData = {
         uom: uomDetails.uom,
         id: uomDetails.id,
         organizationId: uomDetails.organizationId
     }
     const checkDuplicateresultById =  await uomService.getUomDuplicateDetails(payloadData); 
     var payloadDatas = {
        uom: uomDetails.uom,
        organizationId: uomDetails.organizationId
    }    
     const checkUomDuplicateresult =  await uomService.getUomDuplicateDetails(payloadDatas);
  
    if(checkDuplicateresultById == 1 || checkUomDuplicateresult == 0){
        const result = await uomService.updateuom(uomDetails);
        if (!result) {
            return req.app.responseHelper.send(res, false, ERRORMSG[102], [], 500);
        }
        return req.app.responseHelper.send(res, true, {}, [], 200);
    }else{
        return req.app.responseHelper.send(res, false, ERRORMSG[108], [], 500);
    }
});

router.post('/delete/:id', async (req, res) => {
    const { id } = req.params;
    const result = await uomService.deleteuom(id);
    if (!result) {
        let errors = [{
            "msg": "Something went wrong!"
        }];
        return req.app.responseHelper.send(res, false, errors, [], 500);
    }
    return req.app.responseHelper.send(res, true, {}, [], 200);
});

function validateAddUOM(payloadData) {

    const schema = {      
        organizationId: Joi.string().required(),
        uom :Joi.string().required(),
        decimal :Joi.number().required(),
    }
    return Joi.validate(payloadData, schema);
}

function validateGetUOM(payloadData) {
    const schema = {
        organizationId: Joi.string().required(),
        uom: Joi.string(),
        decimal: Joi.number(),
        startIndex: Joi.string(),
        limit: Joi.string(),
        sortKey: Joi.string().allow(''),
        searchKey: Joi.string(),
        sortOrder: Joi.string().valid(["ASC", "DESC", ""]).insensitive()
    }
    return Joi.validate(payloadData, schema);
}
module.exports = router;
