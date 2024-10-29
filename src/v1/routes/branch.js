const express = require('express');
var router = express.Router();
const Joi = require('@hapi/joi');
const branchService = require('../services/branchService');
const SUCCESSMSG = require("../lang/success");

router.get('/', async (req, res) => {
    const { error } = validateGetBranches(req.query);
    if (error) return req.app.responseHelper.send(res, false, {}, [{ "msg": error.details[0].message }], 500);

    const result = await branchService.getBranches(req.query);
    let responseObj = result;
    responseObj['message'] = SUCCESSMSG[2001];

    return req.app.responseHelper.send(res, true, responseObj, [], 200);
});


function validateGetBranches(payload) {
    const schema = {
        organizationId: Joi.string().required(),
        startIndex: Joi.number(),
        limit: Joi.number(),
        searchKey: Joi.string(),
        allFields: Joi.boolean(),
        code: Joi.string().allow(''),
        name: Joi.string().allow('')
    }
    return Joi.validate(payload, schema);
}
module.exports = router;