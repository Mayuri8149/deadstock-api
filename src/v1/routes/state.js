const express = require('express')
var router = express.Router()
const Joi = require('@hapi/joi')
const _ = require('lodash');
const stateService = require('../services/stateService')
const { authenticateTransaction } = require('../middleware/transaction');
const SUCCESSMSG = require("../lang/success");
const ERRORMSG = require("../lang/error");


router.get('/get_states', async (req, res) => {

    const result = await stateService.getState(req.query);
    let responseObj = result;
    responseObj['message'] = SUCCESSMSG[4001];
    
    return req.app.responseHelper.send(res, true, responseObj, [], 200);

})

router.post('/add_state', async (req, res) => {

    // const {error} = validateState(req.body)
    // if(error){ return req.app.responseHelper.send(res, false, {}, [{ "msg": error.details[0].message}], 500); }

    let payloadData = req.body;
    const result = await stateService.addState(payloadData);

    let responseObj = {  
        'message': SUCCESSMSG[1002],      
        result
    }
    return req.app.responseHelper.send(res, true, responseObj, [], 200);
    
})

const validateState = (payloadData) => {
    const schema = {
        organizationId : Joi.string(),
        stateCode : Joi.string().required(),
        stateName : Joi.string().required()
    }
    return Joi.validate(payloadData, schema);
}

module.exports = router;