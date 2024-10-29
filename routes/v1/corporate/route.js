var express = require('express');
var router = express.Router();
var schema = require('./schema');
var model = require('./model');
var validator = require('./validator');
var https = require("https");
var userModel = require('../user/model');
var crypto = require('crypto');
var request = require('request');
var md5 = require('md5');
var multer = require('multer');
// var WooCommerceAPI = require('woocommerce-api');
const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;
const querystring = require('querystring');
var OAuth      = require('oauth-1.0a');
var axios = require("axios").default
var axiosCookieJarSupport = require("axios-cookiejar-support").default
var CookieJar = require("tough-cookie").CookieJar
var assert = require('assert')
var host = "snapcert.io";
// var username = "priyabpatil";
// var password = "Priyanka@#13";
var consumerKey = "ck_2c250ff131507ed43a9aa56bec1f29fde1df79a3";
var consumerSecret = "cs_a6f0f63add95b9db93063d6567894dec81966828";
var token = null;
var cart_key = "c4561a0e19159df04bbefd195d1530a3";
var userService = require('../../../services/userService');
var transactionidService = require('../../../services/transactionidCreationService');
// Start - Priyanka Patil (SCI-I917) 10-05-2021
var fs = require("fs");
// End - Priyanka Patil (SCI-I917) 10-05-2021

let instanceId = 1
var createAxiosInstance = () => {
    var axiosInstance = axios.create({
        baseURL: "https://snapcert.io/wp-json/cocart/v1",
        withTransactions: true,
    })
    axiosCookieJarSupport(axiosInstance)
    axiosInstance.defaults.jar = new CookieJar()
    axiosInstance.instanceId = instanceId++
    return axiosInstance
}

var WooCommerce = new WooCommerceRestApi({
    url: 'https://snapcert.io',
    consumerKey: 'ck_2c250ff131507ed43a9aa56bec1f29fde1df79a3',
    consumerSecret: 'cs_a6f0f63add95b9db93063d6567894dec81966828',
    version: 'aam/v2',
    queryStringAuth: true
});

var WooCommercee = new WooCommerceRestApi({
    url: 'https://snapcert.io',
    consumerKey: 'ck_2c250ff131507ed43a9aa56bec1f29fde1df79a3',
    consumerSecret: 'cs_a6f0f63add95b9db93063d6567894dec81966828',
    version: 'wc/v1',
    queryStringAuth: true
});
var WooCommerceec = new WooCommerceRestApi({
    url: 'https://snapcert.io',
    consumerKey: 'ck_2c250ff131507ed43a9aa56bec1f29fde1df79a3',
    consumerSecret: 'cs_a6f0f63add95b9db93063d6567894dec81966828',
    version: 'cocart/v1',
    queryStringAuth: true
});




router.post('/customersData', function(req, res) {

    var onError = (errors, statusCode) => {
        if(!(Array.isArray(errors) && errors.length)) {
            errors = [{
                "msg": "Failed to create corporate. Please try again."
            }];
        }
        req.app.responseHelper.send(res, false, {}, errors, statusCode);
    };

    
// Create a Customer
WooCommercee.post("customers", {

    email: req.body.email,
    password: req.body.password,
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    username: req.body.username,
    role: "partner"

})
    .then((response) => {
    // Successful request

    req.app.responseHelper.send(res, true, response.data, [], 200);    

    })
    .catch((error) => {

    //   errors = [{msg: "Already register corporte user."}]
    //             onError(errors, 500);

    })
    .finally(() => {
    // Always executed.
    });
});


router.post('/authenticateData', function(req, res) {

// Create a Authenticate
WooCommerce.post("authenticate", {

    username: req.body.username,
    password: req.body.password,
    issueJWT: true     
})
    .then((response) => {
    // Successful request

    req.app.responseHelper.send(res, true, response.data, [], 200);    

    })
    .catch((error) => {
    })
    .finally(() => {

    });
});



router.get('/ordersData', function(req, res) {

    var onError = (errors, statusCode) => {
        if(!(Array.isArray(errors) && errors.length)) {
            errors = [{
                "msg": "Failed to order Please try again."
            }];
        }
        req.app.responseHelper.send(res, false, {}, errors, statusCode);
    };

    // function performRequest(endpoint, method, data, success) {
    //     var dataString = JSON.stringify(data);
    //     var headers = {};
        
    //       headers = {
    //         "Content-Type": "application/json",
    //         "Content-Length": dataString.length,
    //         Authorization: "Bearer " + token,
    //       };
       
    //     var options = {
    //       host: host,
    //       path: endpoint,
    //       method: method,
    //       headers: headers,
    //     };
    //     var req = https.request(options, function (res) {
    //       res.setEncoding("utf-8");
      
    //       var responseString = "";
      
    //       res.on("data", function (data) {
    //         responseString += data;
    //       });
      
    //       res.on("end", function () {
    //         var responseObject = JSON.parse(responseString);
    //         success(responseObject);
    //       });
    //     });
      
    //     req.write(dataString);
    //     req.end();
    //   }

    //   function performLoginRequest(endpoint, method, data, success) {
    //     var dataString = JSON.stringify(data);
    //     var headers = {};
      
    //     if (method == "GET") {
    //       endpoint += "?" + querystring.stringify(data);
    //     } else {
    //       headers = {
    //         "Content-Type": "application/json",
    //         "Content-Length": dataString.length,
    //       };
    //     }
    //     var options = {
    //       host: host,
    //       path: endpoint,
    //       method: method,
    //       headers: headers,
    //     };
      
    //     var req = https.request(options, function (res) {
    //       res.setEncoding("utf-8");
      
    //       var responseString = "";
      
    //       res.on("data", function (data) {
    //         responseString += data;

    //       });
      
    //       res.on("end", function () {
    //         var responseObject = JSON.parse(responseString);
    //         success(responseObject);
    //       });
    //     });
      
    //     req.write(dataString);
    //     req.end();
    //   }

    //   function login() {
    //     performLoginRequest(
    //       "/wp-json/jwt-auth/v1/token",
    //       "POST",
    //       {
    //         username: req.query.username,
    //         password: req.query.password,
    //         consumerKey: consumerKey,
    //         consumerSecret: consumerSecret,
    //         issueJWT: true,
    //       },
    //       function (data) {
    //         token = data.token;
      
    //         // add_item();
    //         get_orders();
            
    //       }
    //     );
    //   }

    //   function get_orders() {
    //     performRequest(
    //       "/wp-json/wc/v3/orders",
    //       "GET",
    //       {
    //         //cart_key: cart_key,
    //       },
    //       function (data) {
    //         data.token = token;
    //         req.app.responseHelper.send(res, true, data, [], 200);    

    //       }
    //     );
    //   }

    //     login();    

    
// Create a Orders
WooCommercee.get("orders", {
    //customer_id: 44
}).then((response) => {    // Successful request
    req.app.responseHelper.send(res, true, response.data, [], 200);   
    })
    .catch((error) => {
    //   errors = [{msg: "Already register corporte user."}]
    //             onError(errors, 500);
    })
    .finally(() => {
    // Always executed.
    });
});

// Start of Get cart
router.get('/get-cart', function(req, res) {
    
    function performRequest(endpoint, method, data, success) {
        var dataString = JSON.stringify(data);
        var headers = {};
        
          headers = {
            "Content-Type": "application/json",
            "Content-Length": dataString.length,
            Authorization: "Bearer " + token,
          };
       
        var options = {
          host: host,
          path: endpoint,
          method: method,
          headers: headers,
        };
        var req = https.request(options, function (res) {
          res.setEncoding("utf-8");
      
          var responseString = "";
      
          res.on("data", function (data) {
            responseString += data;
          });
      
          res.on("end", function () {
            var responseObject = JSON.parse(responseString);
            success(responseObject);
          });
        });
      
        req.write(dataString);
        req.end();
      }

      function performLoginRequest(endpoint, method, data, success) {
        var dataString = JSON.stringify(data);
        var headers = {};
      
        if (method == "GET") {
          endpoint += "?" + querystring.stringify(data);
        } else {
          headers = {
            "Content-Type": "application/json",
            "Content-Length": dataString.length,
          };
        }
        var options = {
          host: host,
          path: endpoint,
          method: method,
          headers: headers,
        };
      
        var req = https.request(options, function (res) {
          res.setEncoding("utf-8");
      
          var responseString = "";
      
          res.on("data", function (data) {
            responseString += data;

          });
      
          res.on("end", function () {
            var responseObject = JSON.parse(responseString);
            success(responseObject);
          });
        });
      
        req.write(dataString);
        req.end();
      }

      function login() {
        performLoginRequest(
          "/wp-json/jwt-auth/v1/token",
          "POST",
          {
            username: username,
            password: password,
            consumerKey: consumerKey,
            consumerSecret: consumerSecret,
            issueJWT: true,
          },
          function (data) {
            token = data.token;
      
            // add_item();
            get_cart();
            
          }
        );
      }

      function get_cart() {
        performRequest(
          "/wp-json/cocart/v1/get-cart",
          "GET",
          {
            cart_key: cart_key,
          },
          function (data) {
            data.token = token;
            req.app.responseHelper.send(res, true, data, [], 200);    

          }
        );
      }

        login();    
});
//// End of get-cart

router.post('/add-item', function(req, res) {
// Create a product
    var username = req.body.username;
    var email = req.body.email;
    var password = req.body.password;
    var transactionId = req.body.transactionId;
    var flag = req.body.flag;
    var productId = req.body.product_id;
    function performRequest(endpoint, method, data, success) {
        var dataString = JSON.stringify(data);
        var headers = {};
        
        headers = {
            "Content-Type": "application/json",
            "Content-Length": dataString.length,
            Authorization: "Bearer " + token,
        };
    
        var options = {
        host: host,
        path: endpoint,
        method: method,
        headers: headers,
        };
        var req = https.request(options, function (res) {
        res.setEncoding("utf-8");
    
        var responseString = "";
    
        res.on("data", function (data) {
            responseString += data;
        });
    
        res.on("end", function () {
            var responseObject = JSON.parse(responseString);
            success(responseObject);
        });
        });
    
        req.write(dataString);
        req.end();
    }

    function performLoginRequest(endpoint, method, data, success) {
        var dataString = JSON.stringify(data);
        var headers = {};
    
        if (method == "GET") {
        endpoint += "?" + querystring.stringify(data);
        } else {
        headers = {
            "Content-Type": "application/json",
            "Content-Length": dataString.length,
        };
        }
        var options = {
        host: host,
        path: endpoint,
        method: method,
        headers: headers,
        };
    
        var req = https.request(options, function (res) {
        res.setEncoding("utf-8");
    
        var responseString = "";
    
        res.on("data", function (data) {
            responseString += data;
        });
    

        res.on("end", function () {
            var responseObject = JSON.parse(responseString);
            success(responseObject);
        });
        });
    
        req.write(dataString);
        req.end();
    }

    function login() {
        performLoginRequest(
        "/wp-json/jwt-auth/v1/token",
        "POST",
        {
            username: username,
            password: password,
            consumerKey: consumerKey,
            consumerSecret: consumerSecret,
            issueJWT: true,
        },
        function (data) {
            token = data.token;
    
            // add_item();
            add_item();
            
        }
        );
    }
    // product_id: productId,// dynamic id in mongodb 
            // cart_item_data : {
            //     "transactionId" : transactionId,
            //     // "flag" : 'false'
            //   }
    function add_item() {
        performRequest(
        "/wp-json/cocart/v1/add-item",
        "POST",
        {
            product_id: productId, 
            quantity: 1,
            cart_item_data : {
                "transactionId" : transactionId,
                "flag" : 'false'
                // "userId" : userId
            }      
        },
        function (data) {
            data.token = token;
            cart_key = data.key;
            req.app.responseHelper.send(res, true, data, [], 200);    

            // get_cart();
        }
        );
    }
    login(); 

});



var onBError = (req, res, errors, statusCode) => {
    if (!(Array.isArray(errors) && errors.length)) {
        errors = [{
            "msg": "Blockchain Network Unstable!"
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
        // cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length -1])
    }
});

var upload = multer({ //multer settings
    storage: storage,
    // limits: {
    //   fileSize: 1024
    // },
fileFilter: (req, file, cb) => {
    if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
    cb(null, true);
    } else {
    cb(null, false);
    return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    }
}
}).single('file');


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

router.post('/register', function(req, res) {
    var errors = validator.register(req);
    
    var onError = (errors, statusCode) => {
        if(!(Array.isArray(errors) && errors.length)) {
            errors = [{
                "msg": "Failed to update corporate. Please try again."
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
    /*  Start- Name -Shubhangi, Date Of Code - 15-01-2021 zoho Task Number -SCI-I700*/
    var userObj = {}
    var existingrefernce = 0
    /*  End- Name -Shubhangi, Date Of Code - 25-01-2021 zoho Task Number -SCI-I700*/

//=================================== Start Neha Mutke (SCI-I754) 15/03/2021 ===================================
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
//=================================== End Neha Mutke (SCI-I754) 15/03/2021 ===================================

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
                req.app.responseHelper.send(res, true, { email: user.email, message: "User not verified", userId: user._id,corporateId:user.corporateId}, [], 200);
            }
        });
    };

    var createCorporate = (user, corporate) => {
        user.corporateId = corporate._id;
        // if(verifierId){
            user.entity = user.entity;
            user.role = user.role;
            user.verifierRefId = user.verifierId;
            user.verifiertype = user.verifiertype;
            //  Start- Shubhangi, 01-02-2020, SCI-I718
            user.timeZone = user.timeZone;
            //  End- Shubhangi, 02-02-2020, SCI-I718
             //  Start- Shubhangi, 05-02-2020, SCI-I749
            user.createdBy = user.createdBy;
            user.updatedBy = user.updatedBy
            //  End- End, 05-02-2020, SCI-I749  
            // user.companyName = user.companyName;
        // }else{
            // user.entity = user.entity
            // user.role = user.entity
        // }
    
        if(!user.name){
            user.companyName = user.companyName;
            user.companyCode = user.code;
        }else{
            user.name = user.name;
        }
        /*  Start- Name -Shubhangi, Date Of Code - 15-01-2021 zoho Task Number -SCI-I700*/
        if(typeof userObj._id === 'undefined'){
        userModel.create(user).then((result) => {
            if (result.isError || !(result.user && result.user._id)) {
                onError([], 500);
            } else {
                // sendEmail(result.user, corporate);
                createOtp(result.user);
            }
        }).catch((err) => {
            onError([], 500);
        }); 
    }
    else if(existingrefernce == 0){
        userObj.corporateId = user.corporateId
        userModel.saveUserReferences(userObj).then((result) => {
            if (result.isError) {
                onError(req, res, [], 500);
            } else {
                req.app.responseHelper.send(res, true, user, [], 200);
            }
        });
        
    }  else{
        req.app.responseHelper.send(res, true, { email: user.email, message: "User not verified", userId: user._id,corporateId:user.corporateId}, [], 200);
    }
    /*  End- Name -Shubhangi, Date Of Code - 25-01-2021 zoho Task Number -SCI-I700*/ 
    };

    var create = () => {   
        model.create(body).then((result) => {
            // if (!result.corporate.error) {
            //     onError([], 500);
            // } else {
                // create Corporate
                createCorporate(user, result.corporate);
            // }
        }).catch((err) => {
            onError([], 500);
        });
    };

    var findUserByEmail = () => {
    
        if (user.verifiertype =="corporateverifier"){
            userModel.findByCmpName(user.code).then((resultComName) => {
                if(resultComName.isError) {
                    onError([], 500);
                } else if (resultComName.user && resultComName.user._id) {
                    errors = [{msg: "Corporate User with this company name already exists."}];
                    onError(errors, 500);
                } else {
                    var email = user.email;                
                    transactionidService.generateDid(email).then((didResult) => {
                        if(!didResult.isError) {
                            var did = didResult.did;
                            userModel.findByEmail(did).then((result) => {
                               
                                if(result.isError) {
                                    onError(errors, 500);
                                } 
                                else if (result.user && result.user._id) {
                                    /*  Start- Name -Shubhangi, Date Of Code - 15-01-2021 zoho Task Number -SCI-I700*/
                                    result.user.role = user.role
                                    result.user.firstName = user.firstName
                                    result.user.lastName = user.lastName
                                    userObj = result.user
                                  /*  Start- Name -Shubhangi, Date Of Code - 26-04-2021 zoho Task Number -SCI-I903*/
                                    if(((result.user.reference.role == 'Corporate Admin' || user.role == 'Corporate Admin') && (result.user.reference.role == 'corporate verifier' || user.role == 'corporate verifier')) || ((result.user.reference.role == 'Agency Admin' || user.role == 'Agency Admin') && (result.user.reference.role == 'Agency Verifier' || user.role == 'Agency Verifier'))){
                                        
                                        errors = [{ msg: "Email already exists." }]
                                        onError(errors, 500);
                                }
                                    else{
                                         /*  End- Name -Shubhangi, Date Of Code - 26-04-2021 zoho Task Number -SCI-I903*/
                                    userModel.findUserRefresh(result.user).then((User) => {
                                        if (User.isError == false && User.newUser.length > 0) {
                                            errors = [{ msg: "User with this role and entity already exists" }]
                                            onError(errors, 500);
                                        } else {
                                            /*  Start- Name -Shubhangi, Date Of Code - 15-01-2021 zoho Task Number -SCI-I700*/
                                            create();
                                            /*  End- Name -Shubhangi, Date Of Code - 25-01-2021 zoho Task Number -SCI-I700*/
                                        }
                                    });
                                }
                                    /*  End- Name -Shubhangi, Date Of Code - 15-01-2021 zoho Task Number -SCI-I700*/
                                } else {
                                        var fname = user.firstName;
                                        var lname = user.lastName;               
                                    
                                        var publicKey =  user.publicKey;
        
//=================================== Start Neha Mutke (SCI-I754) 11/03/2021 ===================================                            
                                // Start - Priyanka Patil (SCI-I880) 26-04-2021

                                if(global.config.flagBlockchain.blockChainFlag==false){
                                create();
                                }else{

                                    userService.getUserFromBlockchain(did).then((resultuser) => {
                                        if(resultuser.isError == false || resultuser.isError == false && resultuser.user.isError == false ){
                                            errors = [{msg: "User already exists in blockchain"}];
                                            onError(errors, 500);
                                        }else{
                                            userService.addUserOnBlockchain(did, email, fname, lname, publicKey).then((result) => {
                                                if (!result.isError) {
                                                    create();
                                                } else {
                                                        onBError(req, res, errors, 500);
                                                        }
                                                    })
                                                }
                                            });

                                }
                                    // End - Priyanka Patil (SCI-I880) 26-04-2021
//=================================== End Neha Mutke (SCI-I754) 11/03/2021 ===================================
                                } //else end
                            });
                        }
                    })

                    
                }
            })
        } else {
            var email = user.email;
            transactionidService.generateDid(email).then((didResult) => {
                if (!didResult.isError) {
                    var did = didResult.did;
                    userModel.findByEmail(did).then((result) => {
                        if(result.isError) {
                            onError([], 500);
                        } else if (result.user && result.user._id) {
                             /*  Start- Name -Shubhangi, Date Of Code - 15-01-2021 zoho Task Number -SCI-I700*/
                                    result.user.role = user.role
                                    result.user.firstName = user.firstName
                                    result.user.lastName = user.lastName
                                    userObj = result.user
                                    /*  Start- Name -Shubhangi, Date Of Code - 26-04-2021 zoho Task Number -SCI-I903*/
                                    if(((result.user.reference.role == 'Corporate Admin' || user.role == 'Corporate Admin') && (result.user.reference.role == 'corporate verifier' || user.role == 'corporate verifier')) || ((result.user.reference.role == 'Agency Admin' || user.role == 'Agency Admin') && (result.user.reference.role == 'Agency Verifier' || user.role == 'Agency Verifier'))){
                                        errors = [{ msg: "Email already exists." }]
                                        onError(errors, 500);
                                }
                                    else{
                                        /*  End- Name -Shubhangi, Date Of Code - 26-04-2021 zoho Task Number -SCI-I903*/
                                    userModel.findUserRefresh(result.user).then((User) => {
                                        existingrefernce = User.newUser.length
                                        if (User.isError == false && User.newUser.length > 0) {
                                            errors = [{ msg: "User with this role and entity already exists" }]
                                            onError(errors, 500);
                                        } else {
                                            /*  Start- Name -Shubhangi, Date Of Code - 15-01-2021 zoho Task Number -SCI-I700*/
                                            create();
                                            /*  End- Name -Shubhangi, Date Of Code - 25-01-2021 zoho Task Number -SCI-I700*/
                                        }
                                    });
                                }
                                    /*  End- Name -Shubhangi, Date Of Code - 15-01-2021 zoho Task Number -SCI-I700*/
                        } else {
                            
                            var fname = user.firstName;
                            var lname = user.lastName;               
                            var publicKey =  user.publicKey;
                                
//=================================== Start Neha Mutke (SCI-I754) 11/03/2021 ===================================
                            // Start - Priyanka Patil (SCI-I880) 26-04-2021
                            userService.getUserFromBlockchain(did).then((resultuser) => {
                                if(resultuser.isError == false || resultuser.isError == false && resultuser.user.isError == false ){
                                    errors = [{msg: "User already exists in blockchain"}];
                                    onError(errors, 500);
                                }else {
                                    userService.addUserOnBlockchain(did, email, fname, lname, publicKey).then((result) => {
                                        if (!result.isError) {
                                            create();
                                        }else{
                                            onBError(req, res, errors, 500);
                                        }
                                    })
                                }
                                // End - Priyanka Patil (SCI-I880) 24-04-2021
                            });
//=================================== End Neha Mutke (SCI-I754) 11/03/2021 ===================================
                        }
                    });
                }
            });
        }
    };

    generateDidKeys(user);
});

// -----------------Start Rohini kamble (SCI-I771) 08/02/2021--------
router.get('/list', (req, res) =>{
    const filters = req.query;
    // Start - Priyanka Patil 24-02-2021 (SCI-I771)
    var verifiertype = req.query.verifiertype;
    // End - Priyanka Patil 24-02-2021 (SCI-I771)
    const pageSize = +parseInt(req.query.pagesize);
    const currentPage = +parseInt(req.query.page);
    var skip = pageSize === undefined ? 0 : (pageSize * (currentPage - 1));
    var limit = pageSize === undefined ? 0 : pageSize;

    if(pageSize && currentPage) {
			var data = {
				skip: skip,
             	limit: limit,
                 // Start - Priyanka Patil 24-02-2021 (SCI-I771)
                verifiertype: verifiertype
                // End - Priyanka Patil 24-02-2021 (SCI-I771)
			};
    }else{
        var data = {
            skip: skip,
            limit: limit,
            verifiertype: verifiertype

        };		
    }
    model.listNew(data,filters).then((result) => {
        if (result.isError) {
            onError(req, res, result.errors, 500);
        } else {
            for(var iLoop = 0; iLoop < result.corporates.result.length; iLoop++){
                if(result.corporates.result[iLoop].orgDetails){
                    result.corporates.result[iLoop].Entity_Name = result.corporates.result[iLoop].orgDetails.name;
                    result.corporates.result[iLoop].Entity_Id = result.corporates.result[iLoop].orgDetails.code;
                }
                if(result.corporates.result[iLoop].partnerDetails.status == "invited"){
                    result.corporates.result[iLoop].status = "Invited";
                }else if(result.corporates.result[iLoop].partnerDetails.status == "inactive"){
                        result.corporates.result[iLoop].status = "Inactive";
                }else if(result.corporates.result[iLoop].partnerDetails.status == "approved" || result.corporates.result[iLoop].partnerDetails.status == "signedUp"){
                    result.corporates.result[iLoop].status = "Active";
                }
            }
            req.app.responseHelper.send(res, true, {result}, [], 200);
        }
    });
});

//============================ Start - Shubhangi (SNA-I5) - 13-05-2021 ============================ 
router.get('/getPartners', (req, res) => {
    const pageSize = +parseInt(req.query.pagesize);
    const currentPage = +parseInt(req.query.page);
    var skip = pageSize === undefined ? 0 : (pageSize * (currentPage - 1));
    var limit = pageSize === undefined ? 0 : pageSize;
    var data = {
        page: skip,
        size: limit,
        verifiertype:"corporateverifier"
    };
    model.getPartners(data).then((result) => {
        if (result.isError) {
            onError(req, res, [{ "msg": "Failed to get partners!" }], 500);
        } else {
            req.app.responseHelper.send(res, true, result, [], 200);
        }
    })
})
//============================ End - Shubhangi (SNA-I5) - 24-05-2021 ============================ 
// -----------------ENd Rohini kamble (SCI-I771) 08/02/2021--------
router.get('/:id',(req, res) =>{
    var id = req.params.id;
    // Start Rohini kamble (SCI-I771) 08/02/2021
    if (id == '111111111111111111111111') {
        req.app.responseHelper.send(res, true, 'corporate', [], 200);
    } else {
    // End Rohini kamble (SCI-I771) 08/02/2021
    model.findById(id).then((result) => {
        if (result.isError || !(result.corporate && result.corporate._id)) {
            req.app.responseHelper.send(res, false, {}, result.errors, 500);
        } else {
            const corporate = result.corporate;
            // Start - Priyanka Patil (SCI-I917) 10-05-2021
            // var path = '././././uploads/'+ corporate.logo;
            // if (fs.existsSync(path)) {
            //     corporate.logo = corporate.logo;
            // } else {
            //     corporate.logo = false;
            // }
            // End - Priyanka Patil (SCI-I917) 10-05-2021
            req.app.responseHelper.send(res, true, corporate, [], 200);
        }
    });
    }
});
// -----------------Start Rohini kamble (SCI-I771) 08/02/2021--------
router.put("/:id/changeStatus", (req, res) => {
    var id = req.params.id;

    var corporate = {
        isActive: req.body.isActive,
        isBlockchainService: req.body.isBlockchainService
    }

    model.update(id, corporate).then((result) => {
        if (result.isError || !(result.corporate && result.corporate._id)) {
            onError(req, res, result.errors, 500);
        } else {
            var corporate = result.corporate;
            req.app.responseHelper.send(res, true, corporate, [], 200);
        }
    });

});
// -----------------End Rohini kamble (SCI-I771) 08/02/2021--------
// Start - Priyanka Patil (SCI-I832) 05-05-2021
router.put("/:id/corporate/changeCorpPayModStatus", (req, res) => {
    var id = req.params.id;

    var corporate = {
        isPayModStatus: req.body.isPayModStatus
    }

    model.update(id, corporate).then((result) => {
        if (result.isError || !(result.corporate && result.corporate._id)) {
            onError(req, res, result.errors, 500);
        } else {
            var corporate = result.corporate;
            req.app.responseHelper.send(res, true, corporate, [], 200);
        }
    });
});
// End - Priyanka Patil (SCI-I832) 05-05-2021

router.post('/edit',  (req, res) => {
    var id = req.body.id;
    var corporate = {};
    corporate.companyName = req.body.companyName;
    corporate.phoneNumber =req.body.phoneNumber;
     // Start - Priyanka Patil (SCI-I13) 31-05-2021
     corporate.location = req.body.location;
     corporate.locationCoordinates = req.body.locationCoordinates;
     corporate.address = req.body.address;
     corporate.logo = req.body.logo;
     corporate.entityType = req.body.entityType;
     
     model.update(id, corporate).then((result) => {
     // End - Priyanka Patil (SCI-I13) 31-05-2021
        if(result.isError  || !(result.corporate && result.corporate._id)) {
            onError(req, res, result.errors, 500);
        } else {
            var corporate = result.corporate;
            req.app.responseHelper.send(res, true, corporate, [], 200);
        }
    });
});

router.post('/update',  (req, res) => {
    var id = req.body.id;
    
    var corporate= {};
     
    corporate.fabricChannelId =  req.body.fabricChannelId;
    corporate.fabricOrgId =  req.body.fabricOrgId;

        model.updateCorporate(id, corporate).then((result) => {

         if(result.isError  || !(result.corporate && result.corporate._id)) {
             onError(req, res, result.errors, 500);
         } else {
             var corporate = result.corporate;
             req.app.responseHelper.send(res, true, corporate, [], 200);
         }
     });
 });

module.exports = router;