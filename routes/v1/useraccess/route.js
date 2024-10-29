
var express = require('express');
var router = express.Router();
var model = require('./model');
// On Error
var onError = (req, res, errors, statusCode) => {
    if (!(Array.isArray(errors) && errors.length)) {
        errors = [{
            "msg": "Something went wrong!"
        }];
    }
    req.app.responseHelper.send(res, false, {}, errors, statusCode);
};

router.post('/create', async (req, res) => {
    var userDetails = req.body
    try {
        let existingPartner = await model.checkDuplicatePartner(userDetails);
        let newPartner = await model.create(existingPartner, userDetails)
        req.app.responseHelper.send(res, true, newPartner, [], 200);
    } catch (ex) {
        let e = ex;
        onError(req, res, [{ "msg": "Failed to create access!" }], 500);
    }
});


router.get('/getPartnersByUserId', (req, res) => {
    const pageSize = +parseInt(req.query.pagesize);
    const currentPage = +parseInt(req.query.page);
    var skip = pageSize === undefined ? 0 : (pageSize * (currentPage - 1));
    var limit = pageSize === undefined ? 0 : pageSize;
    var data = {
        page: skip,
        size: limit,
        partnerId: req.query.partnerId,
    };
    model.getPartnersByUserId(data).then((result) => {
        if (result.isError) {
            onError(req, res, [{ "msg": "Failed to get users!" }], 500);
        } else {
            req.app.responseHelper.send(res, true, result, [], 200);
        }
    })
})

module.exports = router;