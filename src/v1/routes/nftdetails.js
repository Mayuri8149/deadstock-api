const express = require('express');
var router = express.Router();
const Joi = require('@hapi/joi');
const _ = require('lodash');
const nftdetailsService = require('../services/nftdetailsService');
const SUCCESSMSG = require("../lang/success");
const ERRORMSG = require("../lang/error");

router.post('/add_nftdetails', async (req, res) => {
    
    const { error } = validateAddNftdetails(req.validTransactionIdData);
    if (error) return req.app.responseHelper.send(res, false, {}, [{ "msg": error.details[0].message}], 500);
    
    let payloadData = req.body;
    payloadData.creator_id = req.user.userId;
    payloadData.modifier_id = req.user.userId;

    payloadData.created_by = req.user.email;
    payloadData.modified_by = req.user.email;

    const result = await nftdetailsService.addNftDetails(payloadData);
       
    var responseObj = {
            'message': SUCCESSMSG[5005],
            result
    }

    return req.app.responseHelper.send(res, true, responseObj.result, [], 200);
})

router.get('/:nftObjectId', async (req, res) => {
    req.query.nftObjectId = req.params.nftObjectId;
    // req.query.nftObjectId = '629cedc737f9158d54e1d834';
    
    const result = await nftdetailsService.getNftFullDetails(req.query);
    if (!result) {
        return req.app.responseHelper.send(res, false, {}, [{ "msg": ERRORMSG[5006] }], 404);
    }
    let responseObj = result;
    responseObj['message'] = SUCCESSMSG[5002];

    return req.app.responseHelper.send(res, true, responseObj, [], 200);
});


router.get('/', async (req, res) => {
    // const { error } = validateGetNftDetails(req.query);
    // if (error) return req.app.responseHelper.send(res, false, {}, [{ "msg": error.details[0].message }], 500);
    const result = await nftdetailsService.getNftDetails(req.query);
    let responseObj = result;
    responseObj['message'] = SUCCESSMSG[5006];

    return req.app.responseHelper.send(res, true, responseObj, [], 200);
})

router.put('/update_nftdetails', async (req, res) => {
    let payloadData =  req.body
    console.log("payloadData::",payloadData);
    const result = await nftdetailsService.findnft(payloadData);
    if(result){
        var updateResult = await nftdetailsService.updateNftDetails(payloadData, result)
        if(updateResult){
            let responseObj = {  
                'message': SUCCESSMSG[5007],
                result 
            }
            return req.app.responseHelper.send(res, true, responseObj, [], 200);
        }else{
            let responseObj = {  
                'message': ERRORMSG[109],
                result
            }
            return req.app.responseHelper.send(res, false, responseObj, [], 200);
        }
    }else{
        let responseObj = {  
            'message': ERRORMSG[60001],      
        }
        return req.app.responseHelper.send(res, false, responseObj, [], 200);
    }
})

function validateAddNftdetails(payloadData) {
    const nftDetailSchema = Joi.object().keys({
        nft_sale: Joi.array()
    });
    const schema = {
        tokenId: Joi.string().required(),
        token_address: Joi.string().required(),
        assetId: Joi.string().required(),
        transactionid: Joi.string().required(),
        assetName: Joi.string().required(),
        assetImg: Joi.string().required(),
        no_of_copies: Joi.string().required(),
        creator: Joi.string().required(),
        nft_sale: Joi.array().items(nftDetailSchema),
        creator_id: Joi.string(),
        modifier_id:  Joi.string(),
        created_by: Joi.string(),
        modified_by: Joi.string(),
        provenanceTemplatePath:Joi.string(),
        provenanceHash:Joi.string(),
    }
    return Joi.validate(payloadData, schema);
}

module.exports = router;