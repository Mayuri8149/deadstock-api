var express = require('express');
var router = express.Router();
var model = require('./model');
var validator = require('./validator');
var fs = require('fs');
var multer = require('multer');
var partnerModel = require('./../model');
var userModel = require('../../user/model');

var excelToJson = require('convert-excel-to-json');

var storage = multer.diskStorage({ //multers disk storage settings
    destination: function (req, file, cb) {
        cb(null, './uploads/')
    },
    filename: function (req, file, cb) {
        var datetimestamp = Date.now();
        cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1])
    }
});

var upload = multer({ //multer settings
    storage: storage
}).single('file');

var onError = (req, res, errors, statusCode, data) => {
    if (!(Array.isArray(errors) && errors.length)) {
        errors = [{
            "msg": "Something went wrong!"
        }];
    }

    if (!data) {
        data = {};
    }
    req.app.responseHelper.send(res, false, data, errors, statusCode);
};

var isOrganizationDataManager = (req, res, next) => {

    var user = req.user;
    var organizationId = 0;

    if ((req.method === 'POST' || req.method === 'PUT') && req.body && req.body.organizationId) {
        organizationId = req.body.organizationId;
    } else if (req.method == 'GET' && req.query && req.query.organizationId) {
        organizationId = req.query.organizationId;
    }

    if (user.entity === 'organization' && user.role === 'manager') {

        if (organizationId && user.reference && (organizationId !== user.reference.organizationId)) {
            onError(req, res, [{ msg: "You are not authorized to perform this action" }], 403, {});
        } else {
            next();
        }

    } else {
        onError(req, res, [{ msg: "You are not authorized to perform this action" }], 403, {});
    }

};

router.post('/upload', (req, res) => {
    //  End- Priyanka Patil, 21-01-2021, SCI-I715
    upload(req, res, function (err) {
        if (err) {
            onError(req, res, [], 500, {});
            return;
        }
        if (!req.file) {
            var errors = [{
                'msg': "No file passed"
            }];
            onError(req, res, errors, 500, {});
            return;
        }

        var filepath = './uploads/' + req.file.filename;
        const excelData = excelToJson({
            sourceFile: filepath,
            columnToKey: {
                // -----Start Rohini kamble (SCI-I747) 29/01/2021----
                // A: 'partnerDID',
                A: 'firstName',
                B: 'lastName',
                C: 'email'
                // -----End Rohini kamble (SCI-I747) 29/01/2021----
            }
        });

        var records = excelData.Sheet1;
        var partners = validator.buildData(req, records);
        model.insertMany(partners).then((result) => {
            if (result.isError || !(result.partners)) {
                onError(req, res, result.errors, 500, {});
            } else {
                var partners = result.partners;
                req.app.responseHelper.send(res, true, partners, [], 200);
            }
        });

    })
});
//  Start- Priyanka Patil, 21-01-2021, SCI-I715
router.get('/list', (req, res) => {
    //  End- Priyanka Patil, 21-01-2021, SCI-I715 
    //  Start- Mahalaxmi, 12-01-2021, SCI-I579
    const pageSize = +parseInt(req.query.pagesize);
    const currentPage = +parseInt(req.query.page);
    var skip = pageSize === undefined ? 0 : (pageSize * (currentPage - 1));
    var limit = pageSize === undefined ? 0 : pageSize;

    //  End- Mahalaxmi, 12-01-2021, SCI-I579
    var obj = {
        //  Start- Priyanka Patil, 21-01-2021, SCI-I715
        // affiliateId: req.query.affiliateId,
        //  End- Priyanka Patil, 21-01-2021, SCI-I715
        //  Start- Priyanka Patil, 10-02-2021, SCI-I744
        moduleId: req.query.moduleId,
        //  End- Priyanka Patil, 10-02-2021, SCI-I744
        status: "new",
        skip: skip,
        limit: limit
    };
    //  Start- Mahalaxmi, 12-01-2021, SCI-I579
    model.listNew(obj).then((result) => {
        //  End- Mahalaxmi, 12-01-2021, SCI-I579
        if (result.isError && !(result)) {
            onError(req, res, result.errors, 500, {});
        } else {
            //  Start- Mahalaxmi, 12-01-2021, SCI-I579
            req.app.responseHelper.send(res, true, { result }, [], 200);
            //  End- Mahalaxmi, 12-01-2021, SCI-I579
        }
    });
});
//  Start- Priyanka Patil, 21-01-2021, SCI-I715
router.post('/delete', (req, res) => {
    var draftIds = req.body.draftIds;
    // var affiliateId = req.body.affiliateId;
    //  End- Priyanka Patil, 21-01-2021, SCI-I715
    var deleteDrafts = (ids) => {
        model.deleteMany(ids).then((result) => {
            if (result.isError) {
                onError(req, res, result.errors, 500, {});
            } else {
                req.app.responseHelper.send(res, true, [], [], 200);
            }
        });
    };

    var findDraftByIds = (draftIds) => {
        //  Start- Priyanka Patil, 21-01-2021, SCI-I715
        model.findDraftByIds(draftIds).then((result) => {
            //  End- Priyanka Patil, 21-01-2021, SCI-I715
            if (result.isError || !result.drafts.length) {
                onError(req, res, result.errors, 500, {});
            } else if (result.drafts.length == draftIds.length) {
                deleteDrafts(draftIds);
            }
        });
    }

    findDraftByIds(draftIds);

});
//  Start- Priyanka Patil, 21-01-2021, SCI-I715
router.put('/process', (req, res) => {
    //  End- Priyanka Patil, 21-01-2021, SCI-I715
    var data = validator.process(req);
    var codes = [];
    var dids = [];
    var emails = [];

    var addPartners = (partners) => {
        partnerModel.insertMany(partners).then((result) => {
            if (result.isError && !(result.partners)) {
                updateDrafts(data.draftIds, 'new');
            } else {
                req.app.responseHelper.send(res, true, { partners: result.partners, incorrectDraftIds: data.incorrectDraftIds }, [], 200);
            }
        });
    };
    //  Start- Priyanka Patil, 10-02-2021, SCI-I744
    var checkDuplicates = (codes) => {
        //  Start- Priyanka Patil, 21-01-2021, SCI-I715
        partnerModel.findByDids(codes, data.batchId, data.organizationId, data.moduleId, false).then((result) => {
            //  End- Priyanka Patil, 21-01-2021, SCI-I715
            if (result.partners.length == 0) {
                addPartners(data.partners);
            } else {
                for (i = 0; i < result.partners.length; i++) {
                    if (result.isError || !(result.partners && result.partners.length) || !(result.partners[i].batchId)) {
                        addPartners(data.partners);
                    } else if (result.partners[i].batchId && result.partners[i].batchId == data.batchId) {
                        updateDrafts(data.draftIds, 'new');
                    } else if (!(result.partners[i].batchId == data.batchId)) {
                        onError(req, res, [{ msg: "Invalid Partners or duplicate transactions found" }], 500);
                    } else {
                        onError(req, res, [{ msg: "Invalid Partners or duplicate transactions found" }], 500);
                    }
                }
            }
        });
    };
    //  End- Priyanka Patil, 10-02-2021, SCI-I744

    var updateDrafts = (ids, status) => {
        model.changeStatus(ids, status).then((result) => {
            if (result.isError) {
                onError(req, res, result.errors, 500, { incorrectDraftIds: data.incorrectDraftIds });
            } else {
                if (status == 'processed') {
                    checkDuplicates(codes);
                } else {
                    onError(req, res, [{ msg: "Partner ID already processed!" }], 500, { incorrectDraftIds: data.incorrectDraftIds });
                }
            }
        });
    };

    var checkDIDinUser = (drafts, draftIds) => {
        userModel.findPartnerByDID(drafts).then((result) => {
            if (result.isError || !result.drafts.length) {
                onError(req, res, result.errors, 500, { incorrectDraftIds: data.incorrectDraftIds });
            } else if (result.drafts.length) {
                for (var i = 0; i < result.drafts.length; i++) {
                    var draft = result.drafts[i];
                };
                updateDrafts(draftIds, 'processed');
            }
        });
    };
    //  Start- Priyanka Patil, 21-01-2021, SCI-I715
    var findDraftByIds = (draftIds) => {
        model.findDraftByIds(draftIds).then((result) => {
            //  End- Priyanka Patil, 21-01-2021, SCI-I715
            if (result.isError || !result.drafts.length) {
                onError(req, res, result.errors, 500, { incorrectDraftIds: data.incorrectDraftIds });
            } else if (result.drafts.length == draftIds.length) {
                for (var i = 0; i < result.drafts.length; i++) {
                    var draft = result.drafts[i];
                    codes.push(draft.did.value);
                    dids.push(draft.did.value);
                    emails.push(draft.email.value);
                };
                checkDIDinUser(result.drafts, draftIds);
            }
        });
    };

    if (data.partners.length && data.draftIds.length) {
        //  Start- Priyanka Patil, 21-01-2021, SCI-I715
        findDraftByIds(data.draftIds);
        //  End- Priyanka Patil, 21-01-2021, SCI-I715
    } else if (data.isAffiliateCheckFailed) {
        onError(req, res, [{ msg: "You are not authorized to perform this action" }], 403, { incorrectDraftIds: data.incorrectDraftIds });
    } else if (data.isDataInvalid) {
        onError(req, res, [{ msg: "There is error in data. Please correct and try again." }], 500, {});
    } else {
        onError(req, res, [{ msg: "Enter Valid Data for each field." }], 500, { incorrectDraftIds: data.incorrectDraftIds });
    }

});
//  Start- Priyanka Patil, 21-01-2021, SCI-I715
router.put('/:id', (req, res) => {
    //  End- Priyanka Patil, 21-01-2021, SCI-I715
    var inputDraft = validator.updateDraft(req);

    var updateDraft = (id, draft) => {
        model.update(id, draft).then((result) => {
            if (result.isError || !(result.draft && result.draft._id)) {
                onError(req, res, result.errors, 500, {});
            } else {
                req.app.responseHelper.send(res, true, result.draft, [], 200);
            }
        })
    };

    var findDraftById = (draftId) => {
        model.findById(draftId).then((result) => {
            if (result.isError || !(result.draft && result.draft._id)) {
                onError(req, res, result.errors, 500, {});
            } else {
                var draft = result.draft;
                //  Start- Priyanka Patil, 21-01-2021, SCI-I715
                if ((draft.organizationId == inputDraft.organizationId) && (draft.batchId == inputDraft.batchId)) {
                    //  End- Priyanka Patil, 21-01-2021, SCI-I715
                    draft.code = inputDraft.code;
                    draft.firstName = inputDraft.firstName;
                    draft.lastName = inputDraft.lastName;
                    draft.father = inputDraft.father;
                    draft.aadhar = inputDraft.aadhar;
                    draft.email = inputDraft.email;
                    draft.phoneNumber = inputDraft.phoneNumber;
                    draft.dob = inputDraft.dob;
                    updateDraft(draftId, draft);
                } else {
                    onError(req, res, [{ param: "id", msg: "Invalid draft id" }], 500, {});
                }
            }
        })
    };

    var id = req.params.id;
    var draftId = inputDraft._id;

    if (id === draftId) {
        findDraftById(draftId);
    } else {
        onError(req, res, [{ param: "id", msg: "Invalid draft id" }], 500, {});
    }


});

module.exports = router;