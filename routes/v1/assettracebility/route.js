var express = require('express');
var router = express.Router();
var model = require('./model');
var transTypeModel = require('../transactiontype/model');
// var transactionModel = require('../transaction/model');
var mongoose = require('mongoose');


var onError = (req, res, errors, statusCode) => {
    if (!(Array.isArray(errors) && errors.length)) {
        errors = [{
            "msg": "Something went wrong!"
        }];
    }
    req.app.responseHelper.send(res, false, {}, errors, statusCode);
};



router.get('/:organizationId', async (req, res) =>{
    const organizationId = req.params.organizationId;
    const result = await model.findByOrgId(organizationId);
    if (result) {
    // onError(req, res, result.errors, 500);
        req.app.responseHelper.send(res, true, {result}, [], 200);                      
    } else {
        req.app.responseHelper.send(res, true, {result}, [], 200);                      
    }
});




router.post("/create", (req, res) => {

    var draftIds = {}
    draftIds.assetTraceabilityField = req.body.assetTraceabilityField

     draftIds.organizationId = req.body.organizationId


    var saveAssetTracebility = (draftIds) => {
        model.create(draftIds).then((result) => {
            if (result.isError || !(result.data && result.data._id)) {
                onError(req, res, [], 500);
            } else {
                req.app.responseHelper.send(res, true, result.data, [], 200);
            }
        });
    }

    var deleteDrafts = (ids) => {
        model.deleteMany(ids).then((result) => {
            if (result.isError) {
                onError(req, res, result.errors, 500, {});
            } else {
                saveAssetTracebility(draftIds);
            }
        });
    };

    var checkDuplicate = (draftIds) => {
        model.findByOrganizationId(req.body.organizationId).then((result) => {
            if (result.isError == false) {
                deleteDrafts(req.body.organizationId)
            } else {
                saveAssetTracebility(draftIds);
            }
        });
    };

    checkDuplicate(draftIds);

});

router.get('/list', (req, res) =>{
    var organizationId = req.query.organizationId;
    const pageSize = +parseInt(req.query.pagesize);
    const currentPage = +parseInt(req.query.page);
    var skip = pageSize === undefined ? 0 : (pageSize * (currentPage - 1));
    var limit = pageSize === undefined ? 0 : pageSize;

        var data = {
            skip: skip,
            limit: limit,
            organizationId: organizationId
        };

    model.listNew(data).then((result) => {
        console.log("result",result)
        if (result.isError) {
            onError(req, res, result.errors, 500);
        } else {
            req.app.responseHelper.send(res, true, {result}, [], 200);
        }
    });
});

module.exports = router;