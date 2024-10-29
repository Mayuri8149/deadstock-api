var express = require('express');
var router = express.Router();
var schema = require('./schema');
var model = require('./model');
var validator = require('./validator');
var userModel = require('../user/model');
var crypto = require('crypto');
var request = require('request');
var md5 = require('md5');
var multer = require('multer');
const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;
var userService = require('../../../services/userService');
// Start - Priyanka Patil (SCI-I917) 10-05-2021
var fs = require("fs");
// End - Priyanka Patil (SCI-I917) 10-05-2021
var departmentModel = require('../department/model');

var WooCommerce = new WooCommerceRestApi({
    url: 'https://snapcert.io',
    consumerKey: 'ck_54322288e38319666329f15f6362661af2b4a152',
    consumerSecret: 'cs_7a566ed0da9afc7dc35b6183779a227398bd3d74',
    version: 'aam/v2',
    queryStringAuth: true
  });
  
  var WooCommercee = new WooCommerceRestApi({
    url: 'https://snapcert.io',
    consumerKey: 'ck_54322288e38319666329f15f6362661af2b4a152',
    consumerSecret: 'cs_7a566ed0da9afc7dc35b6183779a227398bd3d74',
    version: 'wc/v1',
    queryStringAuth: true
  });
  


var onBError = (req, res, errors, statusCode) => {
    if (!(Array.isArray(errors) && errors.length)) {
        errors = [{
            "msg": "Blockchain Network Unstable!"
        }];
    }
    req.app.responseHelper.send(res, false, {}, errors, statusCode);
};

// On Error
var onError = (req, res, errors, statusCode) => {
    if (!(Array.isArray(errors) && errors.length)) {
        errors = [{
            "msg": "Something went wrong!"
        }];
    }
    req.app.responseHelper.send(res, false, {}, errors, statusCode);
};


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
    storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    }
  }
}).single('file');

router.post('/productData', function(req, res) {
    
    var onError = (errors, statusCode) => {
          if(!(Array.isArray(errors) && errors.length)) {
              errors = [{
                  "msg": "Failed to create corporate. Please try again."
              }];
          }
          req.app.responseHelper.send(res, false, {}, errors, statusCode);
      };
  
      
  // Create a product
  WooCommercee.post("products", {
  
      name: req.body.code + " " + req.body.name,
      regular_price: req.body.verificationCost,
      tax_status: "taxable",
      tax_class: "GST18",
      //  Start- Shubhangi, 05-02-2020, SCI-I749
	  updatedBy : req.body.updatedBy
      //  End- End, 05-02-2020, SCI-I749 
  })
    .then((response) => {
      req.app.responseHelper.send(res, true, response.data, [], 200);    
    })
    .catch((error) => {
  
    })
    .finally(() => {
    });
  });
  
router.put('/productDataUpdate', function(req, res) {

    var onError = (errors, statusCode) => {
        if(!(Array.isArray(errors) && errors.length)) {
            errors = [{
                "msg": "Failed to order Please try again."
            }];
        }
        req.app.responseHelper.send(res, false, {}, errors, statusCode);
    };

    var data = {
        id: req.body.product_id,
        name: req.body.code + " " + req.body.name,
        regular_price: req.body.verificationCost,
        //  Start- Shubhangi, 05-02-2020, SCI-I749
		updatedBy : req.body.updatedBy
		 //  End- End, 05-02-2020, SCI-I749 
        };
        
        WooCommercee.put("products/"+ req.body.product_id, data)
        .then((response) => {
            req.app.responseHelper.send(res, true, response.data, [], 200);    
        })
        .catch((error) => {
        });
        

});

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

router.post('/register', function (req, res) {
    var errors = validator.register(req);
   
    var onError = (errors, statusCode) => {
        if (!(Array.isArray(errors) && errors.length)) {
            errors = [{
                "msg": "Failed to create organization. Please try again."
            }];
        }
        req.app.responseHelper.send(res, false, {}, errors, statusCode);
    };

    if (errors && errors.length) {
        onError(errors, 400);
        return true;
    }

    var body = req.body;
    var user = body.organizationAdmin;
    var organizationData = {}
    //---Start ROhini kamble (SCI-I868) 18/04/2021
    var name = user.name;
    var code = user.code
     //---End ROhini kamble (SCI-I868) 18/04/2021
    delete body.organizationAdmin;

    var sha256 = crypto.createHash('md5').update(user.email).digest('hex');
    user.did =  'did:snapcert:'+ sha256;

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

    user.privateKey =  privateKey;
    user.publicKey =  publicKey;
    
    var verifiableData = user.did;

    var signaturee = crypto.sign("sha256", Buffer.from(verifiableData), {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    })
    
    user.signature =  signaturee.toString("base64");
    
    var sendEmail = (userObj, organization) => {
        userObj = JSON.parse(JSON.stringify(userObj));
        var password = userObj.text;
        var fullName =  userObj.firstName+ ' ' + userObj.lastName;
        // Start - Priyanka Patil (Base_Url) 21-04-2021
        var str = global.config.URI;
        var refLink = str.link(global.config.URI);
        // End - Priyanka Patil (Base_Url) 21-04-2021
        delete userObj.text;
        var obj = {
            to: userObj.email,
            // Start - Priyanka Patil 22-06-2021 (SCI-I68)
            subject: 'Welcome to TraceChain!',
            // Start - Priyanka Patil (SNA-I28) 29-06-2021
            body: ' Hello ' + fullName + ', <br /><br /> <h3>Congratulations! </h3> <br /><br /> Your tracechain account has been created. Please click on below link and use your below password to activate your account. <br /> ' + refLink + ' <br /><br /> One Time Password: <b>'+ password +"</b> <br /><br /> Regards, <br /> TraceChain Team "
            // End - Priyanka Patil (SNA-I28) 29-06-2021
            // End - Priyanka Patil 22-06-2021 (SCI-I68)
        };
        
        userModel.sendEmail(obj).then((sent) => {
            if(sent) {
                req.app.responseHelper.send(res, true, organization, [], 200);
            } else {
                errors = [{msg: "Failed to send email to an admin."}]
                onError(errors, 500);
            }
        });
    };

    var createOtp = (user) => {
        var fullName = user.firstName+ " " +user.lastName;
        var data = {
            email: user.email,
            userId: user._id,
            fullName: fullName
        };
//---------------Start Rohini KAmble(SCI-I868) 18/04/2021------
        var roledata = {
            role: 'sysadmin' ,
            entity: 'system',
           
        }
        // Start - Priyanka Patil 28-04-2021 (SCI-I868)        
        userModel.findByRole(roledata).then((resultuser) => {
            // Start - Priyanka Patil 06-05-2021 (SCI-I868)        
            if(resultuser.user){
            // End - Priyanka Patil 06-05-2021 (SCI-I868)        
                var obj = {
                    to: resultuser.user.user.email,
                    // Start - Priyanka Patil 22-06-2021 (SCI-I68)
                    subject: 'Welcome to TraceChain!',
                    // Start - Priyanka Patil (SNA-I28) 29-06-2021
                    body: ' Hello ' + resultuser.user.userName + ', <br /><br /> Organization ' + name + '('+ code +') is created. Please activate the organization. <br /> <br /><br /> Regards, <br /> TraceChain Team '
                    // End - Priyanka Patil (SNA-I28) 29-06-2021
                    // End - Priyanka Patil 22-06-2021 (SCI-I68)
                };
               
                userModel.sendEmail(obj).then((sent) => {
                    if (sent) {
                    } else {
                        onError(req, res, [], 500);
                    }
                });
            // Start - Priyanka Patil 06-05-2021 (SCI-I868)        
            }
            // End - Priyanka Patil 06-05-2021 (SCI-I868)        
            // End - Priyanka Patil 28-04-2021 (SCI-I868)
        });
//-//---------End Rohini KAmble(SCI-I868) 18/04/2021------
        userModel.createOtp(data).then((result) => {
            if (result.isError) {
                if (result.errors[0].msg == 'Send mail failed!' || result.errors[0].msg == 'Create OTP failed!') {
                    var errors = [{ 'msg': 'Account has been created. Please reset your password!' }]
                    onError(errors, 500);
                } else {
                    var errors = (result.errors && result.errors.length) ? result.errors : [];
                    onError(errors, 500);
                }
                
            } else {
                req.app.responseHelper.send(res, true, { email: user.email, message: "User not verified", userId: user._id,organizationData:organizationData,code:result.otp.code}, [], 200);
            }
        });
    // Start - Priyanka Patil 28-04-2021 (SCI-I868)
        }
    // End - Priyanka Patil 28-04-2021 (SCI-I868)

    var createAdmin = (user, organization) => {
        user.organizationId = organization._id;
        user.entity = "organization";
        user.role = 'admin';
        user.firstName = user.firstName;
        user.lastName = user.lastName;
        user.name = user.name;
        user.code = user.code;
        user.phoneNumber = user.phoneNumber; 
        //  Start- Shubhangi, 01-02-2020, SCI-I718
        user.timeZone = user.timeZone; 
        //  End- Shubhangi, 02-02-2020, SCI-I718  
         //  Start- Shubhangi, 05-02-2020, SCI-I749
         user.createdBy = user.createdBy;
         user.updatedBy = user.updatedBy
        //  End- Shubhangi, 05-02-2020, SCI-I749  
        userModel.create(user).then((result) => {
            
            if (result.isError || !(result.user && result.user._id)) {
                onError([], 500);
            } else {
                createOtp(result.user);
            }
        }).catch((err) => {
            onError([], 500);

        });
    };

    var create = () => {
        // var address={};
        // var requester = {};
        // var head = {};
        // var administrator = {};
        // var affiliateOrganization = {};
        // address.address_line_1 = '';
        // address.address_line_2 = '';
        // address.state = '';
        // address.city = '';
        // requester.name = '';
        // requester.email = '';
        // requester.phoneNumber = '';
        // head.name = '';
        // head.email = '';
        // head.phoneNumber = '';
        // administrator.name = '';
        // administrator.email = '';
        // administrator.phoneNumber = '';
        // administrator.landineNumber = '';
        // affiliateOrganization.name = '';
        // affiliateOrganization.type = '';
        // affiliateOrganization.approvedBy = '';
        // affiliateOrganization.requlatoryBody = '';
        // Start - Priyanka Patil (SNA-I86) 29-06-2021
        user.address = '';
        user.location = '';
        user.website = '';
        // End - Priyanka Patil (SNA-I86) 29-06-2021
        // user.requester = requester;
        // user.head = head;
        // user.administrator = administrator;
        // user.affiliateOrganization = affiliateOrganization;
        // user.doe = new Date();
        
        model.create(user).then((data) => {
            
            if (data.error) {
                onError([], 500);
    
            } else {
                organizationData = data.organization
               createAdmin(user, data.organization);
            }
        }).catch((err) => {
            onError([], 500);
        });
    };

    var checkDuplicate = () => {
        model.checkDuplicate(user).then((result) => {
            if (!result.isError) {
                create();
            } else {
                onError(result.errors, 500);
            }
        })
    };

    var findUserByEmail = () => {
        var email = user.email;

        var sha256 = crypto.createHash('md5').update(email).digest('hex');
        var did =  'did:snapcert:'+ sha256;

        userModel.findByEmail(did).then((result) => {
            if (result.isError) {
                onError([], 500);
            } else if (result.user && result.user._id) {
                errors = [{msg: "Admin with this email already exists."}];
                onError(errors, 500);
            } else {
                
                var fname = user.firstName;
                var lname = user.lastName;
                var publicKey =  user.publicKey;
                var did = 'did:snapcert:'+ sha256;
//=================================== Start Neha Mutke (SCI-I754) 11/03/2021 ===================================
                // Start - Priyanka Patil (SCI-I880) 24-04-2021
                if(global.config.flagBlockchain.blockChainFlag==false){
                    checkDuplicate();
                }else{
                     userService.getUserFromBlockchain(did).then((resultuser) => {
                        if(resultuser.isError == false || resultuser.isError == false && resultuser.user.isError == false ){
                            errors = [{msg: "Admin already exists in blockchain"}];
                            onError(errors, 500);
                        }else {
                            userService.addUserOnBlockchain(did, email, fname, lname, publicKey).then((result) => {
                                if (!result.isError) {
                                    checkDuplicate();
                                } else {
                                    onBError(req, res, errors, 500);
                                }
                            });
                        }
                    })
                }
                // End - Priyanka Patil (SCI-I880) 24-04-2021
//=================================== End Neha Mutke (SCI-I754) 11/03/2021 ===================================
            }
        });
    };

    findUserByEmail();
    
});


router.get('/list', function (req, res) {
    // -----------Start Rohini kamble (SCI-I771) 06/02/2021------------
        const pageSize = +parseInt(req.query.pagesize);
        const currentPage = +parseInt(req.query.page);
        var skip = pageSize === undefined ? 0 : (pageSize * (currentPage - 1));
        var limit = pageSize === undefined ? 0 : pageSize;
        var filters =req.query;
        if(pageSize && currentPage) {
                var data = {
                    skip: skip,
                     limit: limit
                };
        }else{
            var data = {
                skip: skip,
                 limit: limit
            };		
        }
        model.list(data,filters).then((result) => {
            
            if (result.isError) {
                onError(req, res, result.errors, 500);
            } else {
                req.app.responseHelper.send(res, true, result, [], 200);
            }
        });
});
    // --------End Rohini kamble (SCI-I771) 06/02/2021------------
router.get("/:id", (req, res) => {
    var id = req.params.id;

    // ----------Start Rohini kamble (SCI-I771) 06/02/2021------------
        if (id == '111111111111111111111111') {
            req.app.responseHelper.send(res, true, 'organization', [], 200);
        } else {
            model.findById(id).then((result) => {
                if (result.isError || !(result.organization && result.organization._id)) {
                    req.app.responseHelper.send(res, false, {}, result.errors, 500);
                } else {
                    var organization = result.organization;
                    // Start - Priyanka Patil (SCI-I917) 10-05-2021
                    // var path = '././././uploads/'+ organization.logo;
                    // if (fs.existsSync(path)) {
                    //     organization.logo = organization.logo;
                    // } else {
                    //     organization.logo = false;
                    // }
                    // End - Priyanka Patil (SCI-I917) 10-05-2021
                    req.app.responseHelper.send(res, true, organization, [], 200);
                }
            });
        }
    // ----------End Rohini kamble (SCI-I771) 06/02/2021------------
});
// Start - Priyanka Patil (SNA-I68) 22-06-2021
router.get("/OrgDetails/:id", (req, res) => {
    var id = req.params.id;

        model.findOrgDetilsById(id).then((result) => {
            if (result.isError || !(result.organization && result.organization._id)) {
                req.app.responseHelper.send(res, false, {}, result.errors, 500);
            } else {
                var organization = result.organization;
                //var path = '././././uploads/'+ organization.logo;

                // if (fs.existsSync(path)) {
                //     organization.logo = organization.logo;
                // } else {
                //     organization.logo = false;
                // }
                req.app.responseHelper.send(res, true, organization, [], 200);
            }
        });
});
// End - Priyanka Patil (SNA-I68) 22-06-2021
    // ------------Start Rohini kamble (SCI-I771) 06/02/2021------------
router.put("/:id/changeStatus", (req, res) => {
        var id = req.params.id;
    
        var isBlockchainService = req.body.isBlockchainService
        if(isBlockchainService == undefined || isBlockchainService == null || isBlockchainService==''){
            isBlockchainService = false
       }
        var organization = {
            isActive: req.body.isActive,
            isBlockchainService: isBlockchainService
        }
        var data = {
            organizationId: req.params.id,
            code: 'HO',
            name: req.body.organizationName,
            headquarter: true,
            isActive: true,
            isDeleted: false
        }
        var createdBy =  {
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            email: req.user.email
        }
        var updatedBy = {
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            email: req.user.email
        }
        data.createdBy = createdBy
        data.updatedBy = updatedBy
        
        var findObj = {
            organizationId: req.params.id,
            code: 'HO'
        };
    
        model.update(id, organization).then((result) => {
            if (result.isError || !(result.organization && result.organization._id)) {
                onError(req, res, result.errors, 500);
            } else {
                if(req.body.isActive == true){
                    departmentModel.findByCode(findObj).then((findDeptResult) => {
                        if (!(findDeptResult.departments && findDeptResult.departments.length)) {
                            model.deparmentCreate(data).then((deptResult) => {})
                        }
                    })
                }
                var organization = result.organization;
                req.app.responseHelper.send(res, true, organization, [], 200);
            }
        });
    //---------Start Rohini KAmble(SCI-I868) 18/04/2021------
    if(organization.isActive == true){
        // Start - Priyanka Patil 28-04-2021 (SCI-I868)
        model.findById(id).then((result) => {
                
            var username = result.organization.createdBy.firstName + " " + result.organization.createdBy.lastName;
            
            var obj = {
                to: result.organization.createdBy.email,
                // Start - Priyanka Patil 22-06-2021 (SCI-I68)
                subject: 'Welcome to TraceChain!',
                // Start - Priyanka Patil (SNA-I28) 29-06-2021
                body: ' Hello ' + username + ', <br /><br /> Your Organization is activated. <br /> <br /><br /> Regards, <br /> TraceChain Team '
                // End - Priyanka Patil (SNA-I28) 29-06-2021
                // End - Priyanka Patil 22-06-2021 (SCI-I68)
            };

            userModel.sendEmail(obj).then((sent) => {
                if(sent) {
                    // req.app.responseHelper.send(res, true, result, [], 200);
                } else {
                    errors = [{msg: "Failed to send email to an admin."}]
                    onError(errors, 500);
                }
            });

        });
    // End - Priyanka Patil 28-04-2021 (SCI-I868)
    }

//---------End Rohini KAmble(SCI-I868) 18/04/2021------
});
// ----------End Rohini kamble (SCI-I771) 06/02/2021------------
// Start - Priyanka Patil (SCI-I832) 05-05-2021
router.put("/:id/organization/changeInstPayModStatus", (req, res) => {
    var id = req.params.id;

    var organization = {
        isPayModStatus: req.body.isPayModStatus
    }

    model.update(id, organization).then((result) => {
        if (result.isError || !(result.organization && result.organization._id)) {
            onError(req, res, result.errors, 500);
        } else {
            var organization = result.organization;
            req.app.responseHelper.send(res, true, organization, [], 200);
        }
    });
});
// End - Priyanka Patil (SCI-I832) 05-05-2021

router.post('/edit',  (req, res) => {
   var id = req.body.id;
   
        var user= {};
        // var address={};
        // var requester = {};
        // var head = {};
        // var administrator = {};
        // var affiliateOrganization = {};
        // Start - Priyanka Patil (SNA-I86) 29-06-2021
        user.name =  req.body.name;
        user.code =  req.body.code;
        user.logo = req.body.logo;
        user.updatedBy = req.body.updatedBy,
        user.location =  req.body.location;       
        user.locationCoordinates =  req.body.locationCoordinates;       
        user.website = req.body.website;       
        user.address = req.body.address;
        user.phoneNumber = req.body.phoneNumber;
        user.entityType = req.body.entityType;       
        // End - Priyanka Patil (SNA-I86) 29-06-2021
        // user.doe = new Date();
        // user.address1 =  req.body.address1;
        // user.address2 =  req.body.address2;
        // user.state = req.body.state;
        // user.city =  req.body.city;
        // user.boardLineNumber =  req.body.boardLineNumber;
        // user.administratorName =  req.body.administratorName;
        // user.administratorPhoneNumber = req.body.administratorPhoneNumber;
        // user.verificationCost = req.body.verificationCost;
        //  Start- Shubhangi, 05-02-2020, SCI-I749
        //  End- Shubhangi, 05-02-2020, SCI-I749
        // address.address_line_1 = req.body.address.address_line_1;
        // address.address_line_2 = req.body.address.address_line_2;
        // address.state = req.body.address.state;
        // address.city = req.body.address.city;
        // requester.name = req.body.requester.name;        
        // requester.email = req.body.requester.email;
        // requester.phoneNumber = req.body.requester.phoneNumber;
        // head.name = req.body.head.name;
        // head.email = req.body.head.email;
        // head.phoneNumber = '';
        // administrator.name = req.body.administrator.name;
        // administrator.email = req.body.administrator.email;
        // administrator.phoneNumber = req.body.administrator.phoneNumber;
        // administrator.landineNumber = req.body.administrator.landineNumber;
        // affiliateOrganization.name = req.body.affiliateOrganization.name;
        // affiliateOrganization.type =req.body.affiliateOrganization.type;
        // affiliateOrganization.approvedBy = req.body.affiliateOrganization.approvedBy;
        // affiliateOrganization.requlatoryBody = req.body.affiliateOrganization.requlatoryBody;
        // user.academicName =  req.body.academicName;
        // user.academicPhone =  req.body.academicPhone;
        // user.queueName =  req.body.queueName;
        // user.requester = requester;
        // user.head = head;
        // user.administrator = administrator;
        // user.affiliateOrganization = affiliateOrganization;

        model.update(id, user).then((result) => {

		if(result.isError  || !(result.organization && result.organization._id)) {
			onError(req, res, result.errors, 500);
		} else {
            // Start - Priyanka Patil (SNA-I86) 29-06-2021
            var orgId = result.organization._id

            userModel.findByOrgId(orgId).then((resultUserRef) => {    
                if(resultUserRef.isError || !(resultUserRef.userRef[0].user && resultUserRef.userRef[0].user._id)) {
                    onError(req, res, resultUserRef.errors, 500);
                } else {
                    var userId = resultUserRef.userRef[0].user._id
                    userModel.update(userId, user).then((resultUser) => {
                        if(resultUser.isError) {
                            onError(req, res, resultUser.errors, 500);
                        } else {
                            var organization = result.organization;
			                req.app.responseHelper.send(res, true, organization, [], 200);
                        }

                    })
                }
        });

		}
    // End - Priyanka Patil (SNA-I86) 29-06-2021
	});
});
// Start - Priyanka Patil (SNA-18) 07-06-2021
router.post('/update',  (req, res) => {
    var id = req.body.id;
    
    var organization= {};
     
    organization.fabricChannelId =  req.body.fabricChannelId;
    organization.fabricOrgId =  req.body.fabricOrgId;

        model.update(id, organization).then((result) => {

         if(result.isError  || !(result.organization && result.organization._id)) {
             onError(req, res, result.errors, 500);
         } else {
             var organization = result.organization;
             req.app.responseHelper.send(res, true, organization, [], 200);
         }
     });
 });
 // End - Priyanka Patil (SNA-18) 07-06-2021

module.exports = router;
