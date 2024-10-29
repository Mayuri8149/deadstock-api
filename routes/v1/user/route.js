var express = require('express');
var router = express.Router();
var validator = require('./validator');
var model = require('./model');
var userRefSchema = require('./userRefSchema')
var corporateModel = require('../corporate/model')
var crypto = require('crypto');
var request = require('request');
var md5 = require('md5');
var bcrypt = require('bcrypt');
var multer = require('multer');
const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;
var userService = require('../../../services/userService');
// ============================ Start - Shubhangi (SCI-I798-New) - 20-02-2021 ============================
var userSchema = require('../user/schema');
var CryptoJS = require("crypto-js");
// ============================ End - Shubhangi (SCI-I798-New) - 23-03-2021 ============================
var departmentModel = require('../department/model');
var organizationModel = require('../organization/model');
var fs = require("fs");

userSchema.countDocuments({}, function( err, count){
    userService.addSysadmin(count);
})

var WooCommercee = new WooCommerceRestApi({
    url: 'https://snapcert.io',
    consumerKey: 'ck_54322288e38319666329f15f6362661af2b4a152',
    consumerSecret: 'cs_7a566ed0da9afc7dc35b6183779a227398bd3d74',
    version: 'wc/v1',
    queryStringAuth: true
});

var storage = multer.diskStorage({ //multers disk storage settings
    destination: function (req, file, cb) {
        cb(null, './uploads/')
    },
    filename: function (req, file, cb) {
        var datetimestamp = Date.now();
        cb(null, file.originalname)
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

// ============================ Start - Shubhangi (SCI-I798-New) - 20-02-2021 ============================
router.get('/getUserAdharDetails', async (req, res) => {
    try {
       let phoneNumber = req.query.phoneNumber.trim()
        userDetails = await userSchema.findOne({firstName:req.query.adharName,phoneNumber:new RegExp(phoneNumber + "$", "i")})
        if(userDetails == null){
            let errors = [{
                "msg": "User not found!"
            }];
            onError(req, res,errors, 500);
        }else{
            if (!(typeof userDetails.refresh_token === 'undefined')) {
            var bytes  = CryptoJS.AES.decrypt(userDetails.refresh_token, 'secret key 123');
            userDetails.refresh_token = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
            }
            if (!(typeof userDetails.access_token === 'undefined')) {
            var bytes1  = CryptoJS.AES.decrypt(userDetails.access_token, 'secret key 123');
            userDetails.access_token = JSON.parse(bytes1.toString(CryptoJS.enc.Utf8));
            }
        req.app.responseHelper.send(res, true, userDetails, [], 200);
        }
    } catch (e) {
        let errors = [{
            "msg": "Something went wrong!"
        }];
        onError(req, res, errors, 500);
    }
})
// ============================ End - Shubhangi (SCI-I798-New) - 23-03-2021 ============================
router.get('/getPartnersSuperUsers', (req, res) => {
    const pageSize = +parseInt(req.query.pagesize);
    const currentPage = +parseInt(req.query.page);
    var skip = pageSize === undefined ? 0 : (pageSize * (currentPage - 1));
    var limit = pageSize === undefined ? 0 : pageSize;
    var filters = req.query;
    var data = {
        page: skip,
        size: limit,
        corporateId: req.query.corporateId,
    };
    model.getPartnersSuperUsers(data,filters).then((result) => {
        if (result.isError) {
            onError(req, res, [{ "msg": "Failed to get super users!" }], 500);
        } else {
            req.app.responseHelper.send(res, true, result, [], 200);
        }
    })
})
// Start - Priyanka Patil 08-01-2021 (SCI-I558)
router.post('/token_validate', (req, res) => {

    let token = req.body.recaptcha;
    const secretkey = global.config.recaptcha.secretkey;
    const url = `https://www.google.com/recaptcha/api/siteverify?secret=${secretkey}&response=${token}&remoteip=${req.connection.remoteAddress}`
    if (token === null || token === undefined) {
        res.status(201).send({ success: false, message: "Token is empty or invalid" })
        return console.log("token empty");
    }

    request(url, function (err, response, body) {
        body = JSON.parse(body);

        if (body.success !== undefined && !body.success) {
            res.send({ success: false, 'message': "recaptcha failed" });
            return console.log("failed")
        }
        res.send({ "success": true, 'message': "recaptcha passed" });
    })
})
// End - Priyanka Patil 08-01-2021 (SCI-I558)

router.post('/upload', (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            onError(req, res, [], 500, {});
            return;
        } else if (!req.file) {
            var errors = [{
                'msg': 'No File Passed.'
            }];
            onError(req, res, errors, 500, {});
            return;
        } else {
            req.app.responseHelper.send(res, true, {}, [], 200);
        }
    });
});

router.put("/:id", (req, res) => {

    var errors = validator.update(req);

    if (errors && errors.length) {
        onError(req, res, errors, 400);
        return false;
    }

    var id = req.params.id;
    var transtype = {};
    transtype.profileImg = req.body.profileImg;
    transtype.newEmail = req.body.newEmail;
    transtype.phoneNumber = req.body.phoneNumber;
    //  Start- Shubhangi, 01-02-2020, SCI-I718
    transtype.timeZone = req.body.timeZone;
    //  End- Shubhangi, 02-02-2020, SCI-I718
    //  Start- Shubhangi, 05-02-2020, SCI-I749
    transtype.updatedBy = req.body.updatedBy
    //  End- Shubhangi, 05-02-2020, SCI-I749
    model.update(id, transtype).then((result) => {
        if (result.isError && result.transtype) {
            onError(req, res, result.errors, 500);
        } else {
            var transtype = result.transtype;
            req.app.responseHelper.send(res, true, transtype, [], 200);
        }
    });
});

router.get("/historylist", (req, res) => {
    model.historylistNew(req.query).then((result) => {
        if (result.isError) {
            onError(req, res, [], 500);
        } else {
            req.app.responseHelper.send(res, true, { result }, [], 200);
        }
    });
});

router.get('/list', (req, res) => {
    var role = req.query.role;
    var entity = req.query.entity;
    const filters = req.query;
    const pageSize = +parseInt(req.query.pagesize);
   const currentPage = +parseInt(req.query.page);
    // var skip = pageSize;
    // var limit = currentPage;
    var skip = pageSize === undefined ? 0 : (pageSize * (currentPage - 1));
    var limit = pageSize === undefined ? 0 : pageSize;
    if (pageSize && currentPage) {
        var obj = {
            skip: skip,
            limit: limit,
           // organizationId: req.query.organizationId,
            roles: [],
            entity: []
        };

    } else {
        var obj = {
           // organizationId: req.query.organizationId,
            roles: [],
            entity: []
        };

    }
    if(req.query.organizationId){
        obj.organizationId = req.query.organizationId;
    }
    if (entity === 'organization') {
        if (role === 'admin') {
            obj.roles.push('manager', 'admin');
         } else if (role === 'manager') {
            obj.roles = ['manager'];
        } else if (role === 'Corporate Admin') {
            obj.roles = ['Corporate Admin'];
           }
    } else if (entity === 'corporate') {
        if (role === 'admin') {
            obj.roles.push('manager', 'admin');
           } else if (role === 'manager') {
            obj.roles = ['manager'];
         } else if (role === 'Corporate Admin') {
            obj.roles = ['Corporate Admin', 'manager'];
          }
    }

    if (role != 'sysadmin' && entity != 'system') {
        if (req.query.departmentId) {
            obj.departmentId = req.query.departmentId;
        }
        else if (req.user.reference.departmentId) {
            obj.departmentId = req.user.reference.departmentId;
        }

        if (req.user.reference.corporateId) {
            obj.corporateId = req.user.reference.corporateId;
        }
    }
    model.listNew(obj, role, entity,filters).then((result) => {
        if (result.isError || !(result.users)) {
            onError(req, res, [], 500);
        } else {
            for(var iLoop = 0; iLoop < result.users.length; iLoop++){
                if(result.users[iLoop].department[0]){
                    result.users[iLoop].departmentName = result.users[iLoop].department[0].name;
                }
                if(result.users[iLoop].organization[0]){
                    result.users[iLoop].Entity_Name = result.users[iLoop].organization[0].name;
                    result.users[iLoop].Entity_Id = result.users[iLoop].organization[0].code;
                }else if(result.users[iLoop].corporate[0]){
                    result.users[iLoop].Entity_Name = result.users[iLoop].corporate[0].companyName;
                    result.users[iLoop].Entity_Id = result.users[iLoop].corporate[0].code;
                }else if(result.users[iLoop].user){
                    result.users[iLoop].Entity_Name = result.users[iLoop].user.companyName;
                    result.users[iLoop].Entity_Id = result.users[iLoop].user.companyCode;
                }

                if(result.users[iLoop].user){
                    result.users[iLoop].fullName = result.users[iLoop].user.firstName + " " + result.users[iLoop].user.lastName;
                    result.users[iLoop].firstName = result.users[iLoop].user.firstName;
                    result.users[iLoop].lastName = result.users[iLoop].user.lastName;
                    result.users[iLoop].email = result.users[iLoop].user.email;
                    result.users[iLoop].phoneNumber = result.users[iLoop].user.phoneNumber;
                    if(result.users[iLoop].user.isActive == true || result.users[iLoop].user.isActive == "true"){
                        result.users[iLoop].status = "Active";
                    }else if(result.users[iLoop].user.isActive == false || result.users[iLoop].user.isActive == "false"){
                        result.users[iLoop].status = "Inactive";
                    }
                    // if(result.users[iLoop].user.isStatus == true || result.users[iLoop].user.isStatus == "true"){
                    //     result.users[iLoop].isStatus = "Active";
                    // }else if(result.users[iLoop].user.isStatus == false || result.users[iLoop].user.isStatus == "false"){
                    //     result.users[iLoop].isStatus = "Inactive";
                    // }
                    if(result.users[iLoop].role == "sysadmin"){
                        result.users[iLoop].role = "System Admin";
                    }else if(result.users[iLoop].role == "subadmin"){
                        result.users[iLoop].role = "Sub Admin";
                    }else if(result.users[iLoop].role == "manager"){
                        result.users[iLoop].role = "User";
                        if(result.users[iLoop].entity == "corporate"){
                            result.users[iLoop].entity = "Partner";
                        }
                    }
                    if(role != "sysadmin" || role != "subadmin"){
                        if(result.users[iLoop].role == "admin"){
                            result.users[iLoop].role = "Admin";
                        }else if(result.users[iLoop].role == "Corporate Admin"){
                            result.users[iLoop].role = "Partner Admin";
                            result.users[iLoop].entity = "Partner";
                        }
                        else if(role == "admin" || role == "Corporate Admin"){
                            result.users[iLoop].giveAcess = true;
                            result.users[iLoop].entity = "User";
                        }
                    }
                    else{
                        result.users[iLoop].giveAcess = true;
                        if(result.users[iLoop].role == "Corporate Admin"){
                            result.users[iLoop].role = "Partner Admin";
                            result.users[iLoop].entity = "Partner";
                        }
                    }
                }
            }
            req.app.responseHelper.send(res, true, { result }, [], 200);
            //  End- Mahalaxmi, 19-12-2020, SCI-I579
        }
    });
});

router.get('/:id', (req, res) => {
    var id = req.params.id;

    model.findById(id).then((result) => {
        if (result.isError) {
            onError(req, res, result.errors, 500);
        } else {
            var user = result.user;
            // ============================ Start - Shubhangi (SCI-I798-New) - 20-02-2021 ============================
            if (!(typeof user.refresh_token === 'undefined')) {
                var bytes  = CryptoJS.AES.decrypt(user.refresh_token, 'secret key 123');
                user.refresh_token = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
                }
                if (!(typeof user.access_token === 'undefined')) {
                var bytes1  = CryptoJS.AES.decrypt(user.access_token, 'secret key 123');
                user.access_token = JSON.parse(bytes1.toString(CryptoJS.enc.Utf8));
                }
                // ============================ End - Shubhangi (SCI-I798-New) - 12-05-2021 ============================
            req.app.responseHelper.send(res, true, user, [], 200);
        }
    })
});

router.put("/:id/changeStatus", (req, res) => {
    var id = req.params.id;
    var isActive = req.body.isActive
    if(isActive=="Active"){
        isActive = true
    }else if(isActive=="Inactive"){
        isActive = false
    }
    var user = {
        isActive: isActive
    }
    model.update(id, user).then((result) => {
        if (result.isError || !(result.user && result.user._id)) {
            onError(req, res, result.errors, 500);
        } else {
            var user = result.user;
            req.app.responseHelper.send(res, true, user, [], 200);
        }
    });

});
// Start - Priyanka Patil (SCI-I791) 08-02-2021
router.put("/:id/user/changeUserStatus", (req, res) => {
    var id = req.params.id;
    var user = {
        isStatus: req.body.isStatus
    }
    model.update(id, user).then((result) => {
        if (result.isError || !(result.user && result.user._id)) {
            onError(req, res, result.errors, 500);
        } else {
            var user = result.user;
            req.app.responseHelper.send(res, true, user, [], 200);
        }
    });
});
// End - Priyanka Patil (SCI-I791) 08-02-2021

router.post("/signin", (req, res) => {
    // Start - Priyanka Patil 11-01-2021 (SCI-I642)
    var errors = validator.signin(req);
    // End - Priyanka Patil 11-01-2021 (SCI-I642)
    if (errors && errors.length) {
        onError(req, res, errors, 400);
        return true;
    }

    var errors = [{ param: "login", msg: "Login Failed: Invalid Transactions" }];

    var signin = (data) => {

        model.createSession(data).then((result) => {
            if (result.isError || !(result && result.user && result.user._id)) {
                onError(req, res, errors, 500);
            } else {
                result.user.referenceList = result.referenceList
                req.app.responseHelper.send(res, true, result.user, [], 200);
            }
        });

    };

    var createOtp = (user) => {
        var fullName = user.firstName + " " + user.lastName;
        var data = {
            email: user.email,
            userId: user._id,
            fullName: fullName
        };

        model.createOtp(data).then((result) => {
            if (result.isError) {
                var errors = (result.errors && result.errors.length) ? result.errors : [];
                onError(req, res, errors, 500);
            } else {
                req.app.responseHelper.send(res, true, { email: user.email, message: "User not verified" }, [], 200);
            }
        });
    };
    //==================== Start Neha Mutke (SNA-I9) 10/09/2021 ====================
    var getOrganization = (user) => {
        organizationModel.findById(user.reference.organizationId).then((result) => {
            if (!result.isError) {
                user.organizationCode = result.organization.code;
                user.organizationName = result.organization.name;
                user.fabricOrgId = result.organization.fabricOrgId;
                getDepartment(user);
            }
        })
    }

    var getDepartment = (user) => {
        departmentModel.findById(user.reference.departmentId).then((result) => {
            if (!result.isError || result.department) {
                user.departmentLocation = result.department.branch_location;
                user.branchCode = result.department.code;
                user.fabricOrgId = user.fabricOrgId;
                signin(user)
            }
        })        
    }
    //==================== End Neha Mutke (SNA-I9) 10/09/2021 ====================

    var verifyPassword = (user) => {
        var password = req.body.password;
        model.verifyPassword(user, password).then((result) => {

            if (result.isError || !(result && result.user && result.user._id)) {
                // Start - Priyanka Patil 11-01-2021 (SCI-I642)
                onError(req, res, [{ "msg": "Invalid Password!" }], 500);
                // End - Priyanka Patil 11-01-2021 (SCI-I642)
            } else {
                var user = result.user;

                var email = req.body.email;
                var privateKey = result.user.privateKey;
                var signature = Buffer.from(result.user.signature, 'base64');
                var sha256 = crypto.createHash('md5').update(email).digest('hex');
                var did = 'did:snapcert:' + sha256;
                var corpId = result.user.reference.corporateId;
               
                if(global.config.flagBlockchain.blockChainFlag==false){
                   // console.log("withoutBlockchain",global.config.flagBlockchain.blockChainFlag);
                   // var body = userResponse.user.user;    
                            var privateKey = result.user.privateKey;    
                       //     var publicKey = body.publickey;    
                            var signature = Buffer.from(result.user.signature, 'base64');    
                            if (privateKey != undefined && did != undefined && signature != undefined) {
                                var isSignVerified = true;
                                if (user.isVerified == false) {
                                    createOtp(user);
                                } else if (user.isVerified == true && isSignVerified == true) {
                                    var corpId = result.user.reference.corporateId;
                                    if (corpId != '111111111111111111111111') {
                                        corporateModel.findById(corpId).then((corpResult) => {
                                            user.corpData = corpResult.corporate;
                                            signin(user);
                                        });
                                    //==================== Start Neha Mutke (SNA-I9) 10/09/2021 ====================
                                    } else {
                                        if (user.reference.organizationId != '111111111111111111111111') {
                                            getOrganization(user);
                                        } else {
                                            signin(user);
                                        }
                                    }
                                    //==================== End Neha Mutke (SNA-I9) 10/09/2021 ====================
                                } else {
                                    onError(req, res, errors, 500);
                                }
                            } else {
                                onError(req, res, errors, 500);
                            }
                    
                }else{
                   // console.log("withBlockchain",global.config.flagBlockchain.blockChainFlag);
                    userService.getUserFromBlockchain(did).then((userResponse) => {
                        if (!userResponse.isError) {
                            var body = userResponse.user.user;    
                            var privateKey = result.user.privateKey;    
                            var publicKey = body.publickey;    
                            var signature = Buffer.from(result.user.signature, 'base64');    
                            if (privateKey != undefined && did != undefined && publicKey != undefined && signature != undefined) {
                                var isSignVerified = true;
                                if (user.isVerified == false) {
                                    createOtp(user);
                                } else if (user.isVerified == true && isSignVerified == true) {
                                    var corpId = result.user.reference.corporateId;
                                    if (corpId != '111111111111111111111111') {
                                        corporateModel.findById(corpId).then((corpResult) => {
                                            user.corpData = corpResult.corporate;
                                            signin(user);
                                        });
                                    //==================== Start Neha Mutke (SNA-I9) 10/09/2021 ====================
                                    } else {
                                        if (user.reference.organizationId != '111111111111111111111111') {
                                            getOrganization(user);
                                        } else {
                                            signin(user);
                                        }
                                    }
                                    //==================== End Neha Mutke (SNA-I9) 10/09/2021 ====================
                                } else {
                                    onError(req, res, errors, 500);
                                }
                            } else {
                                onError(req, res, errors, 500);
                            }
                        }
                    });  

                }
                
                
            }
        });
    };

    var findUserByEmail = () => {
               
        var email = req.body.email;

        var sha256 = crypto.createHash('md5').update(email).digest('hex');
        var did = 'did:snapcert:' + sha256;

        model.findByEmail(did).then((result) => {
            if (result.isError || !(result.user && result.user._id)) {
                // Start - Priyanka Patil 11-01-2021 (SCI-I642)
                onError(req, res, [{ "msg": "This Email Id does not exist" }], 500);
                // End - Priyanka Patil 11-01-2021 (SCI-I642)
                // ----------Start Rohini Kamble (SCI-I882) 24/04/2021
            } else if(result.user.isActive == false) {
                onError(req, res, [{ "msg": "Your account is inactive" }], 500);
                // ----------End Rohini Kamble (SCI-I882) 24/04/2021
            } else{
                var user = result.user;
                verifyPassword(user);
            }
        });

    };

    findUserByEmail();


});

router.post("/forgotpassword", (req, res) => {
    var errors = validator.forgotPassword(req);

    if (errors && errors.length) {
        onError(req, res, errors, 400);
        return true;
    }

    var email = req.body.email;
    var sha256 = crypto.createHash('md5').update(email).digest('hex');
    var did = 'did:snapcert:' + sha256;

    model.findByEmail(did).then((data) => {
        // Start - Priyanka Patil 11-01-2021 (SCI-I642)
        if (data.isError || !(data.user)) {
            onError(req, res, [{ "msg": "This Email Id does not exist" }], 500);
            // End - Priyanka Patil 11-01-2021 (SCI-I642)
             // ----------Start Rohini Kamble (SCI-I882) 24/04/2021
        }  else if(data.user.isActive == false) {
            onError(req, res, [{ "msg": "Your account is inactive" }], 500);
            // ----------End Rohini Kamble (SCI-I882) 24/04/2021
        } else {
            var user = data.user;
            if (user && user._id) {
                var fullName = user.firstName + " " + user.lastName;
                var data = {
                    email: user.email,
                    userId: user._id,
                    fullName: fullName
                };

                model.createOtp(data).then((result) => {
                    if (result.isError) {
                        var errors = (result.errors && result.errors.length) ? result.errors : [];
                        onError(req, res, errors, 500);
                    } else {
                        req.app.responseHelper.send(res, true, { result: result,code:result.otp.code }, [], 200);
                    }
                });
            }
            else {
                req.app.responseHelper.send(res, true, {}, [], 200);
            }
        }
    });
});

router.post("/resetpassword", (req, res) => {
    var errors = validator.resetPassword(req);

    if (errors && errors.length) {
        onError(req, res, errors, 400);
        return true;
    }

    var updateUser = (user, data) => {
        model.update(user._id, user).then((result) => {
            if (result.isError || !(result.user && result.user._id)) {
                var errors = (result.errors && result.errors.length) ? result.errors : [];
                onError(req, res, [], 500);
            } else {
                updateOtp(data);
            }
        });
    };

    var findUserById = (data) => {
        model.findById(data.userId).then((result) => {
            if (result.isError || !(result.user && result.user._id)) {
                var errors = (result.errors && result.errors.length) ? result.errors : [];
                onError(req, res, [], 500);
            } else {
                var user = result.user;
                if (user.isVerified) {
                    updateOtp(data);
                } else {
                    user.isVerified = true;
                    updateUser(user, data);
                }
            }
        });
    };

    var updateOtp = (data) => {
        model.updateOtp(data.otpId).then((result) => {
            req.app.responseHelper.send(res, true, {}, [], 200);
        });
    };

    var updatePassword = (data) => {
        data.newpwd = req.body.password;
        model.updatePassword(data).then((result) => {
            if (result.isError) {
                var errors = (result.errors && result.errors.length) ? result.errors : [];
                onError(req, res, [], 500);
            } else {
                findUserById(data);
            }
        });
    };

    var findOtp = () => {

        var data = {
            code: req.body.code
        };
        model.findOtp(data).then((result) => {
            if (result.isError) {
                var errors = (result.errors && result.errors.length) ? result.errors : [];
                onError(req, res, errors, 500);
            } else {
                var otp = result.otp;
                if (otp && otp._id) {
                    var data = {
                        otpId: otp._id,
                        email: otp.email,
                        userId: otp.userId
                    };

                    model.findById(data.userId).then((result) => {
                        if (result.isError || !(result.user && result.user._id)) {
                            var errors = (result.errors && result.errors.length) ? result.errors : [];
                            onError(req, res, [], 500);
                        } else {
                            var user = result.user;

                            bcrypt.compare(req.body.password, result.user.password, function (isError, result) {
                                if (isError || !result) {
                                    updatePassword(data);
                                    WooCommercee.post("customers", {
                                        email: user.email,
                                        password: req.body.password,
                                        first_name: user.firstName,
                                        last_name: user.firstName,
                                        username: user.firstName + user.lastName,
                                        role: "partner"
                                    })
                                        .then((response) => {
                                            req.app.responseHelper.send(res, true, response.data, [], 200);
                                        })
                                        .catch((error) => {
                                        })
                                        .finally(() => {
                                        });

                                } else {
                                    onError(req, res, [{ "msg": "Your new password is same as previous password!" }], 500);
                                }
                            });
                        }
                    });
                }
            }
        });
    };

    findOtp();
});

router.post("/changepassword", (req, res) => {

    var errors = validator.changePassword(req);

    if (errors && errors.length) {
        onError(req, res, errors, 400);
        return true;
    }

    var updatePassword = (data) => {
        model.updatePassword(data).then((result) => {
            if (result.isError) {
                var errors = (result.errors && result.errors.length) ? result.errors : [];
                onError(req, res, [], 500);
            } else {
                req.app.responseHelper.send(res, true, { result: result }, [], 200);
            }
        });
    };

    var verifyPassword = (passwordData) => {
        model.verifyPassword(passwordData, passwordData.curpassword).then((result) => {
            if (result.isError) {
                onError(req, res, [{ "msg": "Your current password is wrong!" }], 500);
            } else {
                var user = result.user;
                updatePassword(passwordData);

            }
        });
    };

    var findpassword = () => {

        var data = {
            email: req.body.email,
            password: req.body.currentpwd,
            newpwd: req.body.newpassword
        };

        model.findpassword(data).then((result) => {
            if (result.isError) {
                var errors = (result.errors && result.errors.length) ? result.errors : [];
                onError(req, res, [{ "msg": "Your current password is wrong!" }], 500);
            } else {
                var password = result.result;
                var passwordData = {
                    userId: password._id,
                    email: password.email,
                    password: password.password,
                    curpassword: req.body.currentpwd,
                    newpwd: req.body.newpassword
                };
                verifyPassword(passwordData);
            }
        });
    };

    findpassword();
});

router.post("/token", (req, res) => {

    var session = req.session;
    var userId = session.userId;
    var sessionId = session._id;

    var updateSession = (user) => {
        model.updateSession(user, sessionId).then((result) => {
            if (result.isError || !(result && result.user && result.user._id)) {
                var errors = (result.errors && result.errors.length) ? result.errors : [];
                onError(req, res, errors, 401);
            } else {
                req.app.responseHelper.send(res, true, result.user, [], 200);
            }
        });
    };

    var findUserById = (id) => {
        model.findById(id).then((result) => {
            if (result.isError || !(result && result.user && result.user._id)) {
                var errors = (result.errors && result.errors.length) ? result.errors : [];
                onError(req, res, errors, 500);
            } else {
                var user = result.user;
                if (user.isVerified) {
                    updateSession(user);
                } else {
                    onError(req, res, [{ "msg": "Unauthorized access!" }], 401);
                }
            }
        });
    };

    findUserById(userId);
});

router.post("/create", (req, res) => {
    if (!req.body.corporateId) {
        var errors = validator.create(req);
    }

    if (errors && errors.length) {
        onError(req, res, errors, 400);
        return false;
    }

    var user = {};
    user.name = req.body.name;
    user.email = req.body.email;
    user.firstName = req.body.firstName;
    user.lastName = req.body.lastName;
    user.companyName = req.body.companyName;
    user.phoneNumber = req.body.phoneNumber;
    user.role = req.body.role;
    //============================ Start - Shubhangi (SNA-I5) - 13-05-2021 ============================
    user.roleName = req.body.roleName;
    //============================ End - Shubhangi (SNA-I5) - 26-05-2021 ============================
    // Start - Priyanka Patil (SCI-I791) 08-02-2021
    if (user.role == 'reviewer' || user.role == 'certifier') {
        user.isStatus = req.body.isStatus;
    }
    // End - Priyanka Patil (SCI-I791) 08-02-2021
    // ----start Rohini kamble (SCI-I771) 06/02/2021
    if (this.role == 'sysadmin' || this.role == 'subadmin') {
        user.entity = 'system';
    } else {
        user.entity = req.body.entity;
    }
    // ----End Rohini kamble (SCI-I771) 06/02/2021
    user.corporateId = req.body.corporateId;
    user.organizationId = req.body.organizationId;
    user.departmentId = req.body.departmentId;
    user.affiliateId = req.body.affiliateId;
    //  Start- Shubhangi, 01-02-2020, SCI-I718
    user.timeZone = req.body.timeZone;
    //  Start- Shubhangi, 02-02-2020, SCI-I718
    //  Start- Shubhangi, 05-02-2020, SCI-I749
    user.createdBy = req.body.createdBy;
    user.updatedBy = req.body.updatedBy;
    //  End- Shubhangi, 05-02-2020, SCI-I749
    var sha256 = crypto.createHash('md5').update(user.email).digest('hex');
    user.did = 'did:snapcert:' + sha256;

    var { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
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

    user.privateKey = privateKey;
    user.publicKey = publicKey;

    const verifiableData = user.did;

    const signaturee = crypto.sign("sha256", Buffer.from(verifiableData), {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    })

    user.signature = signaturee.toString("base64");


    var sendEmail = (userObj) => {
        userObj = JSON.parse(JSON.stringify(userObj));
        var password = userObj.text;
        var fullName = userObj.firstName + ' ' + userObj.lastName;
        var str = "http://52.172.252.154:80/";
        var refLink = str.link("http://52.172.252.154:80/");
        delete userObj.text;
        var obj = {
            to: userObj.email,
            // Start - Priyanka Patil 22-06-2021 (SCI-I68)
            subject: 'Welcome to TraceChain!',
            body: ' Hello ' + fullName + ', <br /><br /> <h3>Congratulations! </h3> <br /><br /> Your SnapCert account has been created. Please click on below link and use your below password to activate your account. <br /> ' + refLink + ' <br /><br /> One Time Password: <b>' + password + "</b> <br /><br /> Regards, <br /> SnapCert Academia Team "
            // End - Priyanka Patil 22-06-2021 (SCI-I68)
        };

        model.sendEmail(obj).then((sent) => {
            if (sent) {
                req.app.responseHelper.send(res, true, userObj, [], 200);
            } else {
                onError(req, res, [], 500);
            }
        });
    };

    var createOtp = (user) => {
        var fullName = user.firstName + " " + user.lastName;
        var data = {
            email: user.email,
            userId: user._id,
            fullName: fullName
        };

        model.createOtp(data).then((result) => {
            if (result.isError) {
                var errors = (result.errors && result.errors.length) ? result.errors : [];
                onError(req, res, errors, 500);
            } else {
                req.app.responseHelper.send(res, true, { email: user.email,_id: user._id, message: "User not verified",code:result.otp.code }, [], 200);
            }
        });
    };

    var create = () => {
        model.create(user).then((result) => {
            if (result.isError || !(result.user && result.user._id)) {
                onError(req, res, [], 500);
            } else {
                createOtp(result.user);
            }
        });
    };


    var findUserByEmail = () => {
        var email = req.body.email;
        var sha256 = crypto.createHash('md5').update(email).digest('hex');
        var did = 'did:snapcert:' + sha256;

        model.findByEmail(did).then((result) => {
            if (result.isError) {
                onError(req, res, [], 500);
            } else if (result.user && result.user._id) {
                /*  Start- Name -Shubhangi, Date Of Code - 08-01-2021 zoho Task Number -SCI-I700*/
                result.user.role = user.role
                result.user.firstName = user.firstName
                result.user.lastName = user.lastName
                /*  Start- Name -Shubhangi, Date Of Code - 20-02-2021 zoho Task Number -SCI-I793*/
                result.user.departmentId = user.departmentId
                // Start - Priyanka Patil (SCI-I817) 21-04-2021
                if(result.user.role == 'Corporate Admin' || result.user.role == "agency Admin" || result.user.role == 'corporate verifier' || result.user.role == 'Agency Verifier'){
                    result.user.corporateId = user.corporateId
                }
                // End - Priyanka Patil (SCI-I817) 21-04-2021
                /*  End- Name -Shubhangi, Date Of Code - 08-02-2021 zoho Task Number -SCI-I793*/
                // Start - Priyanka Patil (SCI-I835) 07-04-2021
                if(result.user.role == 'reviewer' || result.user.role == 'certifier'){
                    result.user.isStatus = user.isStatus
                }
                 /*  Start- Name -Shubhangi, Date Of Code - 26-04-2021 zoho Task Number -SCI-I903*/
                if(((result.user.reference.role == 'Corporate Admin' || user.role == 'Corporate Admin') && (result.user.reference.role == 'corporate verifier' || user.role == 'corporate verifier')) || ((result.user.reference.role == 'Agency Admin' || user.role == 'Agency Admin') && (result.user.reference.role == 'Agency Verifier' || user.role == 'Agency Verifier'))){
                    errors = [{ msg: "Email already exists." }]
                    onError(req, res, errors, 500);
            }
                else{
                     /*  End- Name -Shubhangi, Date Of Code - 26-04-2021 zoho Task Number -SCI-I903*/
                // End - Priyanka Patil (SCI-I835) 07-04-2021
                model.findUserRefresh(result.user).then((User) => {
                    if (User.isError == false && User.newUser.length > 0) {
                        errors = [{ msg: "User with this role and entity already exists" }]
                        onError(req, res, errors, 500);
                    } else {
                        // Start - Priyanka Patil (SCI-I835) 07-04-2021
                        if(typeof result.user.isStatus != 'undefined' && (result.user.role == 'reviewer' || result.user.role == 'certifier')){
                        model.update(result.user._id, result.user).then((resultupdate) => {
                            if (resultupdate.isError && resultupdate.transtype) {
                                onError(req, res, resultupdate.errors, 500);
                            } else {
                        // End - Priyanka Patil (SCI-I835) 07-04-2021
                          /*  Start- Name -Shubhangi, Date Of Code - 26-04-2021 zoho Task Number -SCI-I903*/
                        if(user.role != 'Corporate Admin' || user.role != 'corporate verifier' || user.role != 'Agency Admin'|| user.role != 'Agency Verifier'){
                               result.user.reference.organizationId = user.organizationId
                               result.user.reference.departmentId = user.departmentId
                        }else{
                            result.user.reference.organizationId = '111111111111111111111111'
                            result.user.reference.departmentId = '111111111111111111111111'
                        }
                         //============================ Start - Shubhangi (SNA-I5) - 13-05-2021 ============================
                        if(typeof user.roleName != 'undefined'){
                        result.user.roleName = user.roleName;
                        }
                         //============================ End - Shubhangi (SNA-I5) - 01-06-2021 ============================
                          /*  End- Name -Shubhangi, Date Of Code - 26-04-2021 zoho Task Number -SCI-I903*/
                                model.saveUserReferences(result.user).then((result) => {
                                    if (result.isError) {
                                        onError(req, res, [], 500);
                                    } else {
                                        req.app.responseHelper.send(res, true, user, [], 200);
                                    }
                                });
                            }
                        });
                         /*  Start- Name -Shubhangi, Date Of Code - 26-04-2021 zoho Task Number -SCI-I903*/
                    }else{
                        if(user.role != 'Corporate Admin' || user.role != 'corporate verifier' || user.role != 'Agency Admin'|| user.role != 'Agency Verifier'){
                            result.user.reference.organizationId = user.organizationId
                            result.user.reference.departmentId = user.departmentId
                     }else{
                         result.user.reference.organizationId = '111111111111111111111111'
                         result.user.reference.departmentId = '111111111111111111111111'
                     }
                      //============================ Start - Shubhangi (SNA-I5) - 13-05-2021 ============================
                     if(typeof user.roleName != 'undefined'){
                        result.user.roleName = user.roleName;
                        }
                      //============================ End - Shubhangi (SNA-I5) - 01-06-2021 ============================
                       /*  End- Name -Shubhangi, Date Of Code - 26-04-2021 zoho Task Number -SCI-I903*/
                             model.saveUserReferences(result.user).then((result) => {
                                 if (result.isError) {
                                     onError(req, res, [], 500);
                                 } else {
                                     req.app.responseHelper.send(res, true, user, [], 200);
                                 }
                             });
                    }
                    }
                     /*  End- Name -Shubhangi, Date Of Code - 30-04-2021 zoho Task Number -SCI-I903*/
                });
            }
                /*  End- Name -Shubhangi, Date Of Code - 08-01-2021 zoho Task Number -SCI-I700*/
            } else {

                if (user.firstName && user.lastName) {
                    var fname = user.firstName;
                    var lname = user.lastName;
                } else {
                    var fname = req.body.firstName;
                    var lname = req.body.lastName;
                }
                var publicKey = user.publicKey;
                var did = 'did:snapcert:' + sha256;

//=================================== Start Neha Mutke (SCI-I754) 11/03/2021 ===================================
            // Start - Priyanka Patil (SCI-I880) 24-04-2021

        if(global.config.flagBlockchain.blockChainFlag == false){
            create();
        }else{
            userService.getUserFromBlockchain(did).then((resultuser) => {
            if(resultuser.isError == false || resultuser.isError == false && resultuser.user.isError == false ){
                errors = [{msg: "User already exists in blockchain"}];
                // Start - Priyanka Patil (SCI-I880) 27-04-2021
                onError(req, res,errors, 500);
                // End - Priyanka Patil (SCI-I880) 27-04-2021
            }else {
                userService.addUserOnBlockchain(did, email, fname, lname, publicKey).then((result) => {
                    if (!result.isError) {
                        create();
                    } else {
                        onBError(req, res, errors, 500);
                    }
                });
            // Start - Priyanka Patil (SCI-I880) 27-04-2021
            }
            });
        }
            // End - Priyanka Patil (SCI-I880) 27-04-2021
//=================================== End Neha Mutke (SCI-I754) 11/03/2021 ===================================
            }
        });
    };
    findUserByEmail();
});

router.put("/chageContactNum", (req, res) => {

    var updateNumber = (user) => {
        model.updateUserNumber(user).then((result) => {

            if (result.isError || !(result.user && result.user)) {
                errors = [{ msg: "Invalid user." }]
                onError(req, res, [], 500);
            } else {
                req.app.responseHelper.send(res, true, result, [], 200);
            }
        });
    };
    var findUserToUpdate = () => {
        var id = req.body.id;
        model.findById(id).then((result) => {
            if (result.isError) {
                onError(req, res, [], 500);
            } else {
                var user = result.user;
                user.phoneNumber = req.body.phoneNumber;
                updateNumber(user);
            }
        });
    };

    findUserToUpdate();
});

router.post('/resendOtpCall', (req, res) => {

    model.findById(req.body.userId).then((userData) => {
        if (!userData.isError) {
            var fullName = userData.user.firstName + " " + userData.user.lastName;
            var data = {
                email: userData.user.email,
                userId: userData.user._id,
                fullName: fullName
            };

            model.createOtp(data).then((result) => {
                if (result.isError) {
                    var errors = (result.errors && result.errors.length) ? result.errors : [];
                    onError(req, res, errors, 500);
                } else {
                    req.app.responseHelper.send(res, true, { email: userData.user.email, message: "User not verified" }, [], 200);
                }
            });
        } else {
            req.app.responseHelper.send(res, true, { email: userData.user.email, message: "User not verified" }, [], 200);
        }
    });
});

router.post('/otpShowHide', (req, res) => {

    var data = {
        userId: req.body.userId
    };
    model.findOtpByUserId(data).then((result) => {
        if (result != undefined) {
            if (!result.isError) {
                if (result.flag == true)
                    req.app.responseHelper.send(res, true, { flag: true }, [], 200);
                else
                    req.app.responseHelper.send(res, true, { flag: false }, [], 200);
            }
        } else {
            var errors = (result.errors && result.errors.length) ? result.errors : [];
            onError(req, res, errors, 500);
        }
    });
});

router.get('/reference/id', (req, res) => {
    var currentUser = req.user;

    var corporateId = req.query.corporateId;
    var role = req.query.role;

    var data = {
        corporateId: corporateId,
        role: role
    };
    userRefSchema.findOne(data, (err, refresult) => {
        var userId = refresult.userId;
        model.findById(userId).then((result) => {
            if (result.isError) {
                onError(req, res, result.errors, 500);
            } else {
                var user = result.user;
                req.app.responseHelper.send(res, true, user, [], 200);
            }
        })
    });
});

router.get('/userList/getAllAdminlist', (req, res) => {
    
    payloadData = {
        organizationId: req.query.organizationId
    } 

    model.AllAdminList(payloadData).then((result) => {
        if (result.isError || !(result)) {
            onError(req, res, [], 500);
        } else {
            req.app.responseHelper.send(res, true, { result }, [], 200);
        }
    });
});

router.post('/updateAccount/:id',  async(req, res) => {
    req.body.id = req.params.id;
    var payloadData = req.body
    const result = await model.updateAccount(payloadData);
    return req.app.responseHelper.send(res, true, {}, [], 200);

});

module.exports = router;