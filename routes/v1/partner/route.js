var express = require('express');
var router = express.Router();
var model = require('./model');
var validator = require('./validator');
var userModel = require('./../user/model');
var transactionModel = require('../transaction/model');
//  Start- Priyanka Patil, 10-02-2021, SCI-I744
var batchModel = require('./../batch/model');
var moduleModel = require('./../module/model');
//  End- Priyanka Patil, 10-02-2021, SCI-I744
var uuid = require('uuid');
var multer = require('multer');
// Start- Priyanka Patil, 10-03-2021, SCI-I821
var crypto = require('crypto');
var mongoose = require('mongoose');
// End- Priyanka Patil, 10-03-2021, SCI-I821
var userService = require('../../../services/userService');
var transactionidService = require('../../../services/transactionidCreationService');

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


var onError = (req, res, errors, statusCode) => {
    if (!(Array.isArray(errors) && errors.length)) {
        errors = [{
            "msg": "Something went wrong!"
        }];
    }
    req.app.responseHelper.send(res, false, {}, errors, statusCode);
};

var onBError = (req, res, errors, statusCode) => {
    if (!(Array.isArray(errors) && errors.length)) {
        errors = [{
            "msg": "Blockchain Network Unstable!"
        }];
    }
    req.app.responseHelper.send(res, false, {}, errors, statusCode);
};

router.get('/list', (req, res) => {

    var organizationId = req.query.organizationId;
    var departmentId = req.query.departmentId;
    var batchId = req.query.batchId;

    const pageSize = +parseInt(req.query.pagesize);
    const currentPage = +parseInt(req.query.page);
    var skip = pageSize === undefined ? 0 : (pageSize * (currentPage - 1));
    var limit = pageSize === undefined ? 0 : pageSize;
    if (pageSize && currentPage) {
        var data = {
            organizationId: organizationId,
            skip: skip,
            limit: limit
        };
    } else {
        var data = {
            organizationId: organizationId,
        };
    }

    if (req.query.role) {
        data.role = req.query.role;
    }

    if (departmentId) {
        data.departmentId = departmentId;
    }

    if (req.query.batchId) {
        data.batchId = batchId;
    }

    model.listNew(data).then((result) => {
        if (result.isError) {
            onError(req, res, result.errors, 500);
        } else {
            req.app.responseHelper.send(res, true, { result }, [], 200);
        }
    });

});

router.get('/:id', (req, res) => {
    var id = req.params.id;

    model.findById(id).then((result) => {
        if (result.isError && !(result.partner && result.partner._id)) {
            onError(req, res, result.errors, 500);
        } else {
            req.app.responseHelper.send(res, true, { partner: result.partner }, [], 200);
        }
    })
});

router.put('/:id/changeStatus', (req, res) => {
    var id = req.params.id;
    var userId = req.user.userId;
    var organizationId = req.user.reference.organizationId;
    var status = req.body.status;

    var commentText = req.body.comment;
    var comment = false;
    var entity = req.user.reference.entity;
    var role = req.user.reference.role;
    var firstName = req.user.firstName;
    var lastName = req.user.lastName;
    //  Start- Shubhangi, 05-02-2020, SCI-I749
    var updatedBy = req.body.updatedBy;
    //  End- Shubhangi, 05-02-2020, SCI-I749
    if (status == 'rejected' && commentText) {
        comment = {
            id: uuid(),
            text: commentText,
            date: Date.now(),
            user: {
                id: userId,
                entity: entity,
                role: role,
                firstName: firstName,
                lastName: lastName
            }
        };
    }

    var changeStatus = (data, partner) => {

        if (partner.comments && comment) {
            var comments = partner.comments;
            comments.push(comment);
            data.comments = comments;
        }

        model.changeStatus(data).then((result) => {
            if (result.isError) {
                onError(req, res, result.errors, 500);
            } else {
                partner = JSON.parse(JSON.stringify(partner));
                partner.status = data.status;
                req.app.responseHelper.send(res, true, { partner: partner }, [], 200);
            }
        });
    };

    var processStatus = (obj) => {

        if (obj.partner.status == 'rejected') {
            onError(req, res, [{ msg: "Action not Allowed, Partner is already rejected" }], 500);
            return true;
        } else if (obj.partner.status == 'reviewed') {
            onError(req, res, [{ msg: "Action not Allowed, Partner is already reviewed" }], 500);
            return true;
        } else {

            var data = {
                partnerId: obj.partner._id,
                //  Start- Shubhangi, 05-02-2020, SCI-I749
                updatedBy: updatedBy
                //  End- Shubhangi, 06-02-2020, SCI-I749
            };

            var reviewersObj = (obj.partner.reviewers) ? obj.partner.reviewers : {};

            if (!reviewersObj[userId]) {
                reviewersObj[userId] = { userId: userId, date: Date.now() };
            }


            if (obj.partner.status == 'new') {

                if (status == 'rejected') {
                    data.status = 'rejected';
                    reviewersObj[userId].status = 'rejected';
                } else {
                    // Start - Priyanka Patil (SCI-I791) 08-02-2021
                    var trueCount = 0,
                        falseCount = 0;
                    for (var i in obj.reviewers) {
                        if (obj.reviewers[i].user.isStatus == true && obj.reviewers[i].organizationId == req.user.reference.organizationId) {
                            trueCount++;
                        } else if (obj.reviewers[i].user.isStatus == false && obj.reviewers[i].organizationId == req.user.reference.organizationId) {
                            falseCount++;
                        }
                    }
                    // End - Priyanka Patil (SCI-I791) 08-02-2021

                    data.status = 'reviewed';
                    // Start - Priyanka Patil (SCI-I791) 08-02-2021
                    if (obj.reviewers.length > 1 && trueCount > 1) {
                        // End - Priyanka Patil (SCI-I791) 08-02-2021
                        data.status = 'under review';
                    }
                    reviewersObj[userId].status = 'reviewed';
                }

            } else if (obj.partner.status == 'under review') {

                if (status == 'rejected') {
                    data.status = 'rejected';
                    reviewersObj[userId].status = 'rejected';
                } else {
                    var reviewedCount = 0;
                    var isUserAlreadyReviewed = false;
                    for (var i in reviewersObj) {

                        if (i == userId && reviewersObj[i].status) {
                            isUserAlreadyReviewed = true;
                            break;
                        }

                        if (reviewersObj[i].status == 'reviewed') {
                            reviewedCount++;
                        }
                    }

                    if (isUserAlreadyReviewed) {
                        onError(req, res, [{ msg: "Action not Allowed, Partner is already reviewed by Current Reviewer" }], 500);
                        return true;
                    }

                    data.status = 'under review';
                    if (reviewedCount + 1 == obj.reviewers.length) {
                        data.status = 'reviewed';
                    }
                    reviewersObj[userId].status = 'reviewed';

                }

            }

            data.reviewers = reviewersObj;
            changeStatus(data, obj.partner);
        }
    };

      /*  Start- Name -Shubhangi, Date Of Code - 12-04-2021 zoho Task Number -SCI-I852*/
      var obj = {}
    var getBatch = (id) => {
        batchModel.findById(id).then((batch) => {
            if (!batch.isError) {
                if (batch.batch.isDeleted == true) {
                    onError(req, res, [{ 'msg': 'Please activate batch ' }], 500);
                } else {
                    moduleModel.findById(batch.batch.moduleId).then((module) => {
                        if (module.isError) {
                            onError(req, res, result.errors, 500);
                        } else {
                          
                            if (module.module.isActive == false) {
                                onError(req, res, [{ 'msg': 'Please activate module ' }], 500);
                            } else {
                                processStatus(obj);
                            }
                        }
                    })
                }
            }
        })
    }
   
       /*  End- Name -Shubhangi, Date Of Code - 13-04-2021 zoho Task Number -SCI-I852*/
   
    var findPartner = (reviewers) => {
        model.findById(id).then((result) => {
            if (result.isError || !(result.partner && result.partner._id)) {
                onError(req, res, result.errors, 500);
            } else {

                var partner = result.partner;

                obj = {
                    partner: partner,
                    reviewers: reviewers
                };
                 /*  Start- Name -Shubhangi, Date Of Code - 12-04-2021 zoho Task Number -SCI-I852*/
                getBatch(partner.batchId)
                 /*  End- Name -Shubhangi, Date Of Code - 12-04-2021 zoho Task Number -SCI-I852*/
            }
        });
    };

    var getReviewers = () => {
        // Start - Priyanka Patil (SCI-I696) 19-01-2021
        userModel.getOrganizationReviewers(organizationId).then((result) => {
            // End - Priyanka Patil (SCI-I696) 19-01-2021
            if (result.isError || !(result.reviewers)) {
                onError(req, res, result.errors, 500);
            } else {
                var reviewers = result.reviewers;
                var isValidReviewer = false;
                for (var i = 0; i < reviewers.length; i++) {
                    if (reviewers[i].userId == userId) {
                        isValidReviewer = true;
                        break;
                    }
                }

                if (isValidReviewer) {
                    findPartner(reviewers);
                } else {
                    onError(req, res, [{ msg: "You are not authorized to perform this action" }], 403);
                }


            }
        });
    };

    getReviewers();

});

router.post('/:id/comment', (req, res) => {
    var id = req.params.id;
    var text = req.body.text;
    var commentId = (req.body.commentId) ? req.body.commentId : 0;
    var userId = req.user.userId;
    var entity = req.user.reference.entity;
    var role = req.user.reference.role;
    var firstName = '';
    var lastName = '';
    var comment = {
        id: uuid(),
        text: text,
        date: Date.now(),
        user: {
            id: userId,
            entity: entity,
            role: role,
            firstName: "",
            lastName: ""
        }
    };

    if (commentId) {
        comment.id = commentId;
    }

    var update = (partnerId, comments) => {
        var data = {
            comments: comments
        };
        model.update(partnerId, data).then((result) => {
            if (result.isError) {
                onError(req, res, result.errors, 500);
            } else {
                req.app.responseHelper.send(res, true, { comment: comment }, [], 200);
            }
        });
    };

    var findPartnerById = () => {
        model.findById(id).then((result) => {
            if (result.isError || !(result.partner && result.partner._id)) {
                onError(req, res, result.errors, 500);
            } else {
                var partner = result.partner;
                var comments = (partner.comments) ? partner.comments : [];
                comment.user.firstName = firstName;
                comment.user.lastName = lastName;
                if (comments.length && commentId) {
                    for (var i = 0; i < comments.length; i++) {
                        if (comments[i].id == commentId) {
                            comments[i] = comment;
                        }
                    }
                } else {
                    comments.push(comment);
                }
                update(partner._id, comments);
            }
        });
    };

    userModel.findById(userId).then((result) => {
        if (result.isError || !(result.user && result.user._id)) {
            onError(req, res, result.errors, 500);
        } else {
            firstName = result.user.firstName;
            lastName = result.user.lastName;
            findPartnerById();
        }
    });
});
// Start - Priyanka Patil (SCI-I744) 04-02-2021
router.get('/:did/transactions', (req, res) => {
    //  Start- Mahalaxmi, 12-01-2021, SCI-I579
    const pageSize = +parseInt(req.query.pagesize);
    const currentPage = +parseInt(req.query.page);
    var skip = pageSize === undefined ? 0 : (pageSize * (currentPage - 1));
    var limit = pageSize === undefined ? 0 : pageSize;
    if (pageSize && currentPage) {
        var data = {
            code: req.params.did,
            skip: skip,
            limit: limit
        };
    } else {
        var data = {
            code: req.params.did,
        };
    }
    //  End- Mahalaxmi, 12-01-2021, SCI-I579
    // End - Priyanka Patil (SCI-I744) 04-02-2021
    //  Start- Mahalaxmi, 12-01-2021, SCI-I579
    // Start - Priyanka Patil (SCI-I744) 04-02-2021
    var findTransactions = (code, data) => {
        transactionModel.findByPartnerIdNew(code, data).then((result) => {
            // End - Priyanka Patil (SCI-I744) 04-02-2021
            if (result.isError && !(result.transactions)) {
                onError(req, res, result.errors, 500);
            } else {
                var transactions = result.transactions
                req.app.responseHelper.send(res, true, { result }, [], 200);
                //  End- Mahalaxmi, 12-01-2021, SCI-I579
            }
        });
    };

    var findPartner = () => {
        //  start- Mahalaxmi, 12-01-2021, SCI-I579
        // Start - Priyanka Patil (SCI-I744) 04-02-2021
        //  Start- Mahalaxmi Nakade, 18-02-2021, SCI-I782
        model.findstudByDID(data.code).then((result) => {
            //  End- Mahalaxmi Nakade, 18-02-2021, SCI-I782

            //  End- Mahalaxmi, 12-01-2021, SCI-I579
            if (result.isError && !(result.partner && result.partner.code)) {
                onError(req, res, result.errors, 500);
            } else {
                var code = result.partner.code;
                //  Start- Mahalaxmi, 12-01-2021, SCI-I579
                findTransactions(code, data);
                //  End- Mahalaxmi, 12-01-2021, SCI-I579
                // End - Priyanka Patil (SCI-I744) 04-02-2021
            }
        });
    };

    findPartner();
})

router.post('/directUpload', (req, res) => {
    upload(req, res, function (err) {

        var filepath = './uploads/templates/partner_template.xlsx';
        const excelData = excelToJson({
            sourceFile: filepath,
            columnToKey: {
                A: 'code',
                B: 'firstName',
                C: 'lastName'
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

router.post("/changeStudDetails", (req, res) => {
    userModel.updateEmail(req.body).then((result) => {
        if (result.isError) {
            errors = [{ msg: "Invalid user." }]
            onError(req, res, [], 500);
        } else {
            model.updateEmail(result.user, req.body).then((result1) => {
                if (result.isError) {
                    errors = [{ msg: "Invalid user." }]
                    onError(req, res, [], 500);
                } else {
                    req.app.responseHelper.send(res, true, result1, [], 200);
                }
            });
        }
    });
});


router.post('/register', function(req, res) {
    var errors = validator.register(req);
    
    var onError = (errors, statusCode) => {
        if(!(Array.isArray(errors) && errors.length)) {
            errors = [{
                "msg": "Failed to create partner. Please try again."
            }];
        }
        req.app.responseHelper.send(res, false, {}, errors, statusCode);
    };

    if(errors && errors.length) {
        onError(errors, 400);
        return true;
    }

    var body = req.body;
    var user = body;
    var userObj = {}
    var existingrefernce = 0
    var did = ''
    var newUser ={}
    var verifiableData;
    var generateDidKeys = (user) => {
        transactionidService.generateDid(user.email).then((didResult) => {
            if (!didResult.isError) {
                user.did = didResult.did;
                transactionidService.generatePriPubKey().then((keyResult) => {
                    if (!keyResult.isError) {
                        user.privateKey =  keyResult.keys.privateKey;
                        user.publicKey =  keyResult.keys.publicKey;
                        verifiableData = user.did;
                        transactionidService.createSignature(verifiableData, user.privateKey).then((signatureResult) => {
                            if(!signatureResult.isError) {
                                user.signature =  signatureResult.signature.toString("base64");
                                findUserByEmail();
                            } else {
                                onError(signatureResult.err, 500);
                            }
                        });
                    } else {
                        onError(keyResult.err, 500);
                    }
                });
            } else {
                onError(didResult.err, 500);
            }
        });
    }

    var createOtp = (user) => {
        var fullName = user.firstName+ " " +user.lastName;
        var data = {
            email: user.email,
            userId: user._id,
            fullName: fullName
        };

        userModel.createOtp(data).then((result) => {
            if (result.isError) {
                var errors = (result.errors && result.errors.length) ? result.errors : [];
                onError(req, res, errors, 500);
            } else {
                req.app.responseHelper.send(res, true, { email: user.email, message: "User not verified", userId: user._id}, [], 200);
            }
        });
    };

    var createUser = () => {
            user.entity = user.entity;
            user.role = user.role;
            user.timeZone = user.timeZone;
            user.createdBy = user.createdBy;
            user.updatedBy = user.updatedBy
            user.name = user.name;
            user.did = did
            user.organizationId = mongoose.Types.ObjectId('111111111111111111111111');
            user.departmentId = mongoose.Types.ObjectId('111111111111111111111111');
        if(typeof userObj._id === 'undefined'){
        userModel.create(user).then((result) => {
            if (result.isError || !(result.user && result.user._id)) {
                onError([], 500);
            } else {
                newUser = result.user
                createPartner(newUser)
            }
        }).catch((err) => {
            onError([], 500);
        }); 
    }
    else if(existingrefernce == 0){
        userModel.saveUserReferences(userObj).then((result) => {
            if (result.isError) {
                onError(req, res, [], 500);
            } else {
                req.app.responseHelper.send(res, true, user, [], 200);
            }
        });
        
    }  else{
        req.app.responseHelper.send(res, true, { email: user.email, message: "User not verified", userId: user._id}, [], 200);
    }
    /*  End- Name -Shubhangi, Date Of Code - 25-01-2021 zoho Task Number -SCI-I700*/ 
    };

    var createPartner = (newUser) => {   
        body.userId = newUser._id
        body.did = newUser.did
        body.code = newUser.did
        body.batchId = '111111111111111111111111';
        body.moduleId = '111111111111111111111111';
        body.organizationId = '111111111111111111111111';
        body.transactiontypeId ='111111111111111111111111';
        body.affiliateId = '111111111111111111111111';
        body.createdBy = newUser._id
        body.updatedBy = newUser._id
        model.create(body).then((result) => {
            if (result.isError) {
                onError([], 500);
            } else {
                createOtp(newUser);
            }
        })
    };

    var findUserByEmail = () => {
            var email = user.email;
            transactionidService.generateDid(email).then((didResult) => {
                if (!didResult.isError) {
                     did = didResult.did;
                    userModel.findByEmail(did).then((result) => {
                        if(result.isError) {
                            onError([], 500);
                        } else if (result.user && result.user._id) {
                                    result.user.role = user.role
                                    result.user.firstName = user.firstName
                                    result.user.lastName = user.lastName
                                    userObj = result.user
                                    if(((result.user.reference.role == 'Corporate Admin' || user.role == 'Corporate Admin') && (result.user.reference.role == 'corporate verifier' || user.role == 'corporate verifier')) || ((result.user.reference.role == 'Agency Admin' || user.role == 'Agency Admin') && (result.user.reference.role == 'Agency Verifier' || user.role == 'Agency Verifier'))){
                                        errors = [{ msg: "Email already exists." }]
                                        onError(errors, 500);
                                }
                                    else{
                                    userModel.findUserRefresh(result.user).then((User) => {
                                        existingrefernce = User.newUser.length
                                        if (User.isError == false && User.newUser.length > 0) {
                                            errors = [{ msg: "User with this role and entity already exists" }]
                                            onError(errors, 500);
                                        } else {
                                            createUser();
                                        }
                                    });
                                }
                        } else {
                            var fname = user.firstName;
                            var lname = user.lastName;               
                            var publicKey =  user.publicKey;
                            userService.addUserOnBlockchain(did, email, fname, lname, publicKey).then((result) => {
                                if (!result.isError) {
                                    createUser();
                                } else {
                                    onBError(req, res, errors, 500);
                                }
                            });
                        }
                    });
                }
            });
    };

    generateDidKeys(user);
});


module.exports = router;