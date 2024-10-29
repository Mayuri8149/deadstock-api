const express = require('express');
var router = express.Router();
const Joi = require('@hapi/joi');
const _ = require('lodash');
const { authenticateTransaction } = require('../middleware/transaction');
const SUCCESSMSG = require("../lang/success");
const ERRORMSG = require("../lang/error");
const corporateService = require('../services/corporateService');
var crypto = require('crypto');
const corporateModel = require('../../../routes/v1/corporate/model');

router.post('/register', async (req, res) => {
    const { error } = validateAdd(req.body);
    if (error) return req.app.responseHelper.send(res, false, {}, [{ "msg": error.details[0].message}], 500);
    var payloadData = req.body;
    payloadData.isActive = true;
    payloadData.isVerified = false;
  
    const checkDuplicateresult =  await corporateService.getDuplicateDetails(payloadData);
    if(checkDuplicateresult){
        let errors = [{
            "msg": "Email Id already exists"
        }];
        return req.app.responseHelper.send(res, false, errors, [], 500);
    }else{

        const sha256 = crypto.createHash('md5').update(payloadData.email).digest('hex');
        payloadData.did = 'did:snapcert:' + sha256;
    
        const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem'
            }
        });
    
        payloadData.privateKey = privateKey;
        payloadData.publicKey = publicKey;
    
        const verifiableData = payloadData.did;
    
        const signaturee = crypto.sign("sha256", Buffer.from(verifiableData), {
            key: privateKey,
            padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
        })
    
        payloadData.signature = signaturee.toString("base64");
        const getcorporateId = await corporateModel.findByCompCode(payloadData.code);

        payloadData.corporateId = getcorporateId.corporate._id

        const getCorpoDetails = await corporateService.findCorpDetails(payloadData);
        const updateCorporateresult = await corporateService.updateCorporate(payloadData); 
        if(!getCorpoDetails){
            const updatePartnerresult = await corporateService.updatePartner(payloadData); 
        }
        
        const createCorporateresult = await corporateService.createUser(payloadData);
        if(createCorporateresult){
            payloadData.createdBy = createCorporateresult._id;
            payloadData.updatedBy = createCorporateresult._id;
        
            const createUserRefResult = await corporateService.createUserRef(payloadData,createCorporateresult);
            if(createCorporateresult && createUserRefResult){
                var result = await corporateService.createOtp(createCorporateresult);
               
                const updatePartnerStatus = await corporateService.findPartnerById(payloadData.corporateId);
            }
        }
        
    }
    
    let responseObj = {  
        'message': SUCCESSMSG[5004],      
        result
    }
    return req.app.responseHelper.send(res, true, responseObj, [], 200);

})

function validateAdd(payloadData) {
    const schema = {
        companyName: Joi.string(),
        code: Joi.string(),
        companyCode: Joi.string(),
        firstName: Joi.string(),
        lastName: Joi.string(),
        email: Joi.string(),
        phoneNumber: Joi.string(),
        organizationId: Joi.string(),
        verifiertype: Joi.string(),
        role: Joi.string(),
        entity: Joi.string(),
        timeZone: Joi.string(),
        corporateId: Joi.string(),
        partnerId: Joi.string(),
        createdBy: Joi,
        updatedBy: Joi
    }
    return Joi.validate(payloadData, schema);
}

module.exports = router;