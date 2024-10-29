var schema = require('./schema');
var sessionSchema = require('./sessionSchema');
var userRefSchema = require('./userRefSchema');
var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
var uuid4 = require('uuid4');
var otpSchema = require('./otpSchema');
var otpGenerator = require('otp-generator');
var nodemailer = require('nodemailer');
var mongoose = require('mongoose');
var moment = require('moment');
var departmentSchema = require('./../department/schema');
var ip = require('ip');
var nodeoutlook = require('nodejs-nodemailer-outlook')
const AWS = require("aws-sdk");
var { BitlyClient } = require('bitly');
var bitly = new BitlyClient('bd7c59665ddf56b1a1938018176da1458566eb6b', {});
//============================ Start Neha Mutke (SCI-I754) 10-03-2021 ============================
var emailService = require('../../../services/emailService');
//============================ End Neha Mutke (SCI-I754) 10-03-2021 ============================
// Start - Priyanka Patil (SCI-I744) 02-03-2021
var crypto = require('crypto');
var sha256 = require('sha256');
// End - Priyanka Patil (SCI-I744) 02-03-2021
var historylist = (data) => {
    var promise = new Promise((resolve, reject) => {
        
        var queryParams = {
            userId: data.userId
        };
        
        var options = {
            skip: parseInt(data.skip),
            limit: parseInt(data.limit)
        };
    //  Start- Shubhangi, 05-02-2020, SCI-I749
    sessionSchema.find({}).sort({updatedAt: -1}).exec(function(err, loginhistory) {    
        //  End- Shubhangi, 06-02-2020, SCI-I749         
            if(err) {
                var response = { isError: true, history: [], errors: [] };
                resolve(response);
            } else {
                var response = { isError: false, loginhistory: loginhistory, errors: [] };
                resolve(response);
            }
        });
    });

    return promise;
};


var historylistNew = async (payloadData) => {
    var whereObj = {};
    if(payloadData.role != "admin"){
        if (payloadData.userId) {
            whereObj.userId = mongoose.Types.ObjectId(payloadData.userId)
        }
    }
    if (payloadData.date) {
        whereObj["date"] = { $regex: `${payloadData.date}`, $options: "i" }
    }
    if (payloadData.ipAddress) {
        whereObj["ipAddress"] = { $regex: `${payloadData.ipAddress}`, $options: "i" }
    }
    if ("searchKey" in payloadData && payloadData.searchKey) {
        whereObj['$and'] = [{
            $or: [
                { 'date': { $regex: `${payloadData.searchKey}`, $options: "i" } },
                { 'time': { $regex: `${payloadData.searchKey}`, $options: "i" } },
                { 'ipAddress': { $regex: `${payloadData.searchKey}`, $options: "i" } }
            ]
        }]
    }
    const aggregateArr = [
        {
            $addFields: {
                "date" : { $dateToString: { format: "%d/%m/%Y", date: "$createdAt" } }
            }              
        },
        {
            $match: whereObj
        },
        {
            $sort: {
                updatedAt: -1
            }
        }
    ];

    var { startIndex, limit } = payloadData;
    startIndex = startIndex ? parseInt(startIndex) : 0;
    limit = limit ? parseInt(limit) : 10;
    const paginationArr = [];
    paginationArr.push({ $skip: startIndex });

    if (limit)
        paginationArr.push({ $limit: limit });

    aggregateArr.push({
        $facet: {
            paginatedResults: paginationArr,
            totalCount: [
                {
                    $count: 'count'
                }
            ]
        }
    });

    var partnersResultArr = await sessionSchema.aggregate(aggregateArr);
    const responseObj = {
        'loginhistory': partnersResultArr[0]['paginatedResults'],
        'total_count': partnersResultArr[0]['totalCount'] && partnersResultArr[0]['totalCount'].length ? partnersResultArr[0]['totalCount'][0]['count'] : 0
    };

    return responseObj;
};

var generatePassword = (text) => { 
    var promise = new Promise((resolve, reject) => {
        bcrypt.hash(text, 10, function (err, transactionid) {
            if (!err) {
                resolve(transactionid);
            } else {
                resolve("");
            }
        });
    });
    return promise;
};

var create = (user) => {
    var promise = new Promise((resolve, reject) => {
        var text = Date.now();
        text = Math.floor(text + (Math.random() * Math.floor(9)));
        text = text.toString();
        generatePassword(text).then((transactionid) => {
            user.password = transactionid;
            var document = new schema(user);
            document.save().then(function (result) {
                result = JSON.parse(JSON.stringify(result));
                result.role = user.role;
                //============================ Start - Shubhangi (SNA-I5) - 13-05-2021 ============================
                result.roleName = user.roleName;
                //============================ End - Shubhangi (SNA-I5) - 26-05-2021 ============================
                result.entity = user.entity;
                result.organizationId = user.organizationId;
                result.text = text;
                
                if(user.departmentId) {
                    result.departmentId = user.departmentId;
                }
                
                if(user.affiliateId) {
                    result.affiliateId = user.affiliateId;
                }

                if(user.corporateId) {
                    result.corporateId = user.corporateId;
                }
                saveUserReferences(result).then((data) => {
                    if(data.isError || !(data.reference && data.reference._id)) {
                        var response = { isError: true, user: {} };
                        resolve(response);
                    } else {
                        result.referenceId = data.reference._id;
                        var response = { isError: false, user: result };
                        resolve(response);
                    }
                });
               
            }).catch((err) => {
                var response = { isError: true, user: {} };
                resolve(response);
            });
        }).catch((err) => {
            var response = { isError: true, user: {} };
            resolve(response);
        });

    });

    return promise;
};

var update = (id, user) => {
	var promise = new Promise((resolve, reject) => {
		schema.findOneAndUpdate({ '_id': id }, { $set : user }, { new : true }, (error, result) =>{
			if(error) {
				var response = { isError: true, user: {}, errors: [{"msg": "Failed to update user!"}] };
            	resolve(response);
			} else {
                //  Start- Shubhangi, 05-02-2020, SCI-I749
                userRefSchema.findOneAndUpdate({ 'userId':result._id }, { $set : user }, { new : true }, (error, user) =>{
                    if(error) {
                        var response = { isError: false, user: result, errors: [] };
            	        resolve(response);
                    } else {
                        var response = { isError: false, user: result,ref:user, errors: [] };
            	        resolve(response);
                    }
                });
                //  End- Shubhangi, 06-02-2020, SCI-I749
			}
		})
	});
	return promise;
};

var findByEmail = (email) => {
    var promise = new Promise((resolve, reject) => {

        var filter = [];

        var matchQuery = {
            did: email
        };

        filter.push({ $match: matchQuery});

        filter.push({
            "$lookup": {
                from: "userreferences",
                localField: "_id",
                foreignField: "userId",
                as: "reference"
            }
        });

        filter.push({
            $unwind: "$reference"
        });

        var query = schema.aggregate(filter);

        query.exec((err, users) => {
            if (!err || users.length) {
                var response = { isError: false, user: users[0] };
                resolve(response);
            } else {
                var response = { isError: true, user: {} };
                resolve(response);
            }
        });

    });

    return promise;
};
//---------Start Rohini KAmble(SCI-I868) 18/04/2021------
var findByRole = () => {
    var promise = new Promise((resolve, reject) => {
        var filter = [];
        
            var matchQuery = {
                role: 'sysadmin',
                entity: 'system',
                
            };

        filter.push({ $match: matchQuery});

        filter.push({
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "user"
            }
        });
     
        filter.push({
            $unwind: {
                "path": "$user",
                "preserveNullAndEmptyArrays": true
            }
        });
        
        var query = userRefSchema.aggregate(filter);

        query.exec((err, users) => {
            
            if (!err || users.length) {
                var response = { isError: false, user: users[0] };
                resolve(response);
            } else {
                var response = { isError: true, user: {} };
                resolve(response);
            }
        });


    });

    return promise;
   
};

//---------End Rohini KAmble(SCI-I868) 18/04/2021------


var findByCmpName = (companyName) => {

    var promise = new Promise((resolve, reject) => {

        var filter = [];

        var matchQuery = {
            companyCode: companyName,
            isActive: true
        };

        filter.push({ $match: matchQuery});

        filter.push({
            "$lookup": {
                from: "userreferences",
                localField: "_id",
                foreignField: "userId",
                as: "reference"
            }
        });

        filter.push({
            $unwind: "$reference"
        });

        

        var query = schema.aggregate(filter);

          
        query.exec((err, users) => {
            if (!err || users.length) {
                var response = { isError: false, user: users[0] };
                resolve(response);
            } else {
                var response = { isError: true, user: {} };
                resolve(response);
            }
        });

    });

    return promise;
};


var findById = (id) => {

    var promise = new Promise((resolve, reject) => {

        var filter = [];

        var matchQuery = {
            _id: mongoose.Types.ObjectId(id),
            isActive: true
        };

        filter.push({ $match: matchQuery});

        filter.push({
            "$lookup": {
                from: "userreferences",
                localField: "_id",
                foreignField: "userId",
                as: "reference"
            }
        });

        filter.push({
            $unwind: "$reference"
        });

        var query = schema.aggregate(filter);
        
        query.exec((err, users) => {
            if (!err || users.length) {
                var response = { isError: false, user: users[0], errors: [] };
                resolve(response);
            } else {
                var response = { isError: true, user: {}, errors: [{msg: "Invalid User ID"}] };
                resolve(response);
            }
        });

    });

    return promise;
};
// Start - Priyanka Patil (SNA-I86) 29-06-2021
    var findByOrgId = (orgId) => {
        var promise = new Promise((resolve, reject) => {
    
            var filter = [];
            var matchQuery = {
                organizationId: mongoose.Types.ObjectId(orgId),
                
            };
                
            filter.push({ $match: matchQuery });
    
            filter.push({
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user"
                }
            });
    
            filter.push({
                $unwind: {
                    "path": "$user",
                    "preserveNullAndEmptyArrays": true
                }
            });
    
            var query = userRefSchema.aggregate(filter);
            query.exec((err, references) => {
                if(!err && references && references.length) {
                    var response = {isError: false, userRef: references, errors: []};
                    resolve(response);
                } else {
                    var response = {isError: true, userRef: [], errors: [{msg: "No Reviewers are present in this Organization"}]};
                    resolve(response);
                }
            });
    
        });
    
        return promise;
    };
// End - Priyanka Patil (SNA-I86) 29-06-2021

var findOtp = (params) => {

    var promise = new Promise((resolve, reject) => {

        var data = {
            //email: params.email,
            code: params.code
        };

        otpSchema.findOne(data, (err, otp) => {
            if (!err && otp && otp._id && otp.isActive && !otp.isVerified) {
                var isOtpExpired = checkOtpExpiry(otp.expiry);
                if(isOtpExpired) {
                    var response = { isError: true, otp: {}, errors: [{param: 'code', msg: 'OTP is expired'}]};
                } else {
                    var response = { isError: false, otp: otp, errors: []};
                }
            } else {
                var response = { isError: true, otp: {}, errors: [{param: 'code', msg: 'OTP is invalid'}]};
            }
            resolve(response);
        });
    });

    return promise;
};

var findpassword = (data) => {
    var promise = new Promise((resolve, reject) => {

        schema.findOne({ email: data.email}).select('_id email password').then((res) => {
            var response = { isError: false, result: res, errors: [] };
            resolve(response);

        }).catch((error) => {
            var response = { isError: error, result: {}, errors: [{msg: "Unauthorized Access!"}] };
            resolve(response);
        });
    });

    return promise;
};

var checkOtpExpiry = (expiry) => {
    if(moment() > moment(expiry)) {
        
        return true;
    }
    return false;
};

var updatePassword = (user) => {

    var promise = new Promise((resolve, reject) => {
        generatePassword(user.newpwd).then((transactionid) => {
            if(transactionid) {
                updateData = {
                    "password": transactionid,
                    "pass" : user.newpwd
                }
                schema.findOneAndUpdate({ "_id": user.userId }, { $set: updateData }, () => {
                    var response = {isError: false, user: {_id: user.userId}, errors: []};
                    resolve(response);
                });
            } else {
                var response = {isError: true, user: {}, errors: [{param: 'password', msg :'Password update failed'}]};
                resolve(response);
            }
        });
    });

    return promise;
};

var generateToken = (user, sessionId) => {
    var jwtSecret = 'gadiaagebadikinahi';
    var expire = Date.now() + (1 * 60 * 60 * 10000);
    var payload = { 
        userId: user._id, 
        role: user.reference.role,
        entity: user.reference.entity,
        organizationId: user.reference.organizationId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName, 
        sessionId: sessionId,
        reference: user.reference, 
        expire: expire 
    };
    if(payload.reference.entity != 'system'){
        payload.reference.code = user.reference.entity=='organization'?user.organizationCode:user.corpData.code;
        payload.reference.branch = user.reference.entity=='organization'?user.branchCode:'';
        payload.fabricOrgId = user.reference.entity=='organization'?user.fabricOrgId:'';
    }
    if(user.departmentId) {
        payload.departmentId = user.departmentId;
    }

    if(user.affiliateId) {
        payload.affiliateId = user.affiliateId;
    }

    if(user.referenceId) {
        payload.referenceId = user.referenceId;
    }
    const token = jwt.sign(payload, jwtSecret);
    return token;
};

var createSession = (user) => {
    var promise = new Promise((resolve, reject) => {
        user = JSON.parse(JSON.stringify(user));
        delete user.password;
        user.refreshToken = uuid4();
        
        var ipAddress = ip.address()
        var document = new sessionSchema({
            userId: user._id,
            refreshToken: user.refreshToken,
            ipAddress: ipAddress,
        });
        document.save(function(err, session) {
            if(err || !(session && session._id)) {
                var response = { isError: true, user: {} };
                resolve(response);
            } else {
                var sessionId = session._id;
                var token = generateToken(user, sessionId);
                user.accessToken = token;
                user.lastLoginDate = session.createdAt;
                /*  Start- Name -Shubhangi, Date Of Code - 08-01-2021 zoho Task Number -SCI-I700*/
                getRefernceById(user._id).then((data) => {
                    if(data.isError) {
                        var response = { isError: true, user: {} };
                        resolve(response);
                    } else {
                        var response = { isError: false, user: user,referenceList:data.referenceList};
                        resolve(response);
                    }
                });
                 /*  End- Name -Shubhangi, Date Of Code - 08-01-2021 zoho Task Number -SCI-I700*/
            }
        });
    });

    return promise;
};

var updateSession = (user, sessionId) => {
    var promise = new Promise((resolve, reject) => {
        var token = generateToken(user, sessionId);
        user = JSON.parse(JSON.stringify(user));
        user.accessToken = token;
        user.refreshToken = uuid4();
        delete user.password;

        var data = {
            refreshToken: user.refreshToken
        };

        sessionSchema.findOneAndUpdate({"_id": sessionId}, {$set : data}, { new : true }, (error, result) =>{
            if(error || !result) {
                var response = { isError: true, user: {}, errors: [{"msg": "Unauthorized access!"}] };
            	resolve(response);
            } else {

                user = JSON.parse(JSON.stringify(user));

                if(result.createdAt) {
                    user.lastLoginDate = result.createdAt;
                }
                
                var response = { isError: false, user: user, errors: [] };
            	resolve(response);
            }
        });
    });

    return promise;
};

var destorySession = (sessionId) => {
    var promise = new Promise((resolve, reject) => {
        sessionSchema.findOneAndUpdate({_id: sessionId}, {$set: {isActive: false}}, {new: true}, (error, result) => {
            if(error) {
                var response = { isError: true, session: {}, errors: [{"msg": "Unauthorized access!"}] };
            	resolve(response);
            } else {
                var response = { isError: false, session: {}, errors: [] };
            	resolve(response);
            }
        });
    });

    return promise;

};

var verifyPassword = (user, password) => {
    var promise = new Promise((resolve, reject) => {

        bcrypt.compare(password, user.password, function(isError, result) {
            if (isError || !result) {
                var response = {isError: true, errors: [{"msg": "You have entered wrong password!!"}]};
                resolve(response);
            } else {
                var response = {isError: false, user : user};
                resolve(response);
            }
        });
    });

    return promise;
}

var updateOtp = (id) => {
    var promise = new Promise((resolve, reject) => {
        otpSchema.findOneAndUpdate({ "_id": id }, { $set: { "isActive": false, "isVerified": true } }, () => {
            var response = {isError: false, user: {_id: id}, errors: []};
            resolve(response);
        });
    });
    return promise;
};

var createOtp = (data) => {
    var promise = new Promise((resolve, reject) => {

        data.expiry = Date.now() + (15 * 60 * 1000);
        data.code = otpGenerator.generate(8, { upperCase: true, specialChars: false });
        /*  Start- Name -Shubhangi, Date Of Code - 18-01-2021 zoho Task Number -SCI-I697*/
        // Start - Priyanka Patil (SCI-I697) 30-01-2021
        var str = global.config.URI + 'resetPassword' + '/'+data.userId;
        // End - Priyanka Patil (SCI-I697) 30-01-2021
        /*  End- Name -Shubhangi, Date Of Code - 18-01-2021 zoho Task Number -SCI-I697*/
        bitly.shorten(str).then(function(result) {
        /*  Start- Name -Shubhangi, Date Of Code - 18-01-2021 zoho Task Number -SCI-I697*/
        // Start - Priyanka Patil (SCI-I697) 30-01-2021
        var refLink = result.link.link(global.config.MAILURI + 'resetPassword' + '/'+data.userId);
        // End - Priyanka Patil (SCI-I697) 30-01-2021
        /*  End- Name -Shubhangi, Date Of Code - 18-01-2021 zoho Task Number -SCI-I697*/
        var document = new otpSchema(data);
        document.save().then((otp) => {
            if (otp._id) {
                // Start - Priyanka Patil 22-06-2021 (SCI-I68)
                var subject = 'Welcome to TraceChain!';
                // ----------Start Priyanka Patil(SCI-I607) 04/01/2021------------
                // Start - Priyanka Patil (SNA-I28) 29-06-2021
                var body = "Hello " + data.fullName + ", <br /><br /> <h3>Congratulations! </h3> <br /><br /> Your TraceChain account has been created. Please click on below link and use your below OTP to activate your account. <br /> "+ refLink + "<br /><br /> OTP is <b>" + otp.code + "</b> <br /><br /> <b> Note: </b> Your OTP will expire after 15 minutes. <br /><br /> Regards, <br /> TraceChain Team "
                // End - Priyanka Patil (SNA-I28) 29-06-2021
                // End - Priyanka Patil 22-06-2021 (SCI-I68)
                // ---------End Priyanka Patil(SCI-I607) 04/04/2021---------------
                var obj = {
                    to: otp.email,
                    subject: subject,
                    body: body
                };
//============================ Start Neha Mutke (SCI-I754) 10-03-2021 ============================                
                emailService.sendEmail(obj).then((sent) => {
//============================ End Neha Mutke (SCI-I754) 10-03-2021 ============================
                    if(sent) {
                        resolve({ isError: false, otp: otp, errors: [] });
                    } else {
                        resolve({ isError: true, otp: {}, errors: [{ 'msg': 'Send mail failed!' }] });
                    }
                });
            }
            
        }).catch((err) => {
            resolve({ isError: true, otp: {}, errors: [{ 'msg': 'Create OTP failed!' }] });
        });

        })
        .catch(function(error) {
            resolve({ isError: true, otp: {}, errors: [{ 'msg': 'Create OTP failed!' }] });
        });


    });

    return promise;
};

var sendEmail = (data) => {
    var promise = new Promise((resolve, reject) => {
        
        var mailOptions = {
            auth: {
                // Start - Priyanka Patil (SNA-I28) 29-06-2021
                user: "tracechain@snapperfuturetech.com",
                // Start - Priyanka Patil (SCI-I921) 08-05-2021
                pass: "Snapper#$09"
                // End - Priyanka Patil (SCI-I921) 08-05-2021
                // End - Priyanka Patil (SNA-I28) 29-06-2021
            },
            from: 'tracechain@snapperfuturetech.com',
            to: data.to,
            subject: data.subject,
            html: data.body,
          
            onError: (e) => { resolve(false) },
            onSuccess: (i) => { resolve(true) }
        }        
        nodeoutlook.sendEmail(mailOptions);
    });

    return promise;
};

// var sendEmail = (data) => {
    
//         // require you config file
// // Start - Priyanka Patil (SCI-I696) 19-01-2021
//         //var s3 = new AWS.S3({ accessKeyId: global.config.awsDetails.accessKeyId, secretAccessKey: global.config.awsDetails.secretAccessKey }); //

//         AWS.config.update({
//             accessKeyId: global.config.awsDetails.accessKeyId,
//             secretAccessKey: global.config.awsDetails.secretAccessKey,
// // Start - Priyanka Patil (SCI-I696) 27-01-2021
//             region: global.config.awsDetails.emailregion
// // End - Priyanka Patil (SCI-I696) 27-01-2021
//           });
// // End - Priyanka Patil (SCI-I696) 19-01-2021       
//         const ses = new AWS.SES({ apiVersion: "2010-12-01" });
//         const params = {
//         Destination: {
//             ToAddresses: [data.to] // Email address/addresses that you want to send your email
//         },
//         //ConfigurationSetName: 11,
//         Message: {
//             Body: {
//             Html: {
//                 // HTML Format of the email
//                 Charset: "UTF-8",
//                 Data: data.body
//             },
//             Text: {
//                 Charset: "UTF-8",
//                 Data: data.body
//             }
//             },
//             Subject: {
//             Charset: "UTF-8",
//             Data: data.subject
//             }
//         },
//           // Start - Priyanka Patil (SNA-I28) 29-06-2021
//         Source: "tracechain@snapperfuturetech.com"
//            // End - Priyanka Patil (SNA-I28) 29-06-2021
//         };

//         var sendEmail = ses.sendEmail(params).promise((resolve, reject) => {

//     });


//     return sendEmail;
// };

var partnerStatus = (userRefId) => {
    var promise = new Promise((resolve, reject) => {
        if (userRefId) {
            userRefSchema.findOneAndUpdate({ "_id": userRefId }, { $set: { "partnerStatus": "true" } }, (error, result) => {
                if (result) {
                    var response = { isError: false, user: result, errors: [] };
                    resolve(response);
                } else {
                    var response = {isError: true, user: {}, errors: [{param: 'status', msg :'Status Failed'}]};
                    resolve(response);
                }
               
            }).catch((err) => {
                var response = {isError: true, user: {}, errors: err};
                resolve(response);
            })
        } else {
            var response = {isError: true, user: {}, errors: [{param: 'status', msg :'Status Failed'}]};
            resolve(response);
        }
    });
    return promise;
}

var saveUserReferences = (user) => {
     /*  Start- Name -Shubhangi, Date Of Code - 08-01-2021 zoho Task Number -SCI-I700*/
    if(typeof  user.reference === 'undefined'){
    user.reference={
        departmentId: mongoose.Types.ObjectId("111111111111111111111111"),
        affiliateId: mongoose.Types.ObjectId("111111111111111111111111"),
        corporateId: mongoose.Types.ObjectId("111111111111111111111111")
    }
}
    if(typeof user.entity === 'undefined'){
        user.entity = user.reference.entity
    }
    if(typeof user.organizationId === 'undefined'){
        user.organizationId = user.reference.organizationId
    }
    if(typeof user.departmentId === 'undefined'){
        user.departmentId = user.reference.departmentId
    }
    if(typeof user.affiliateId === 'undefined'){
        user.affiliateId = user.reference.affiliateId
    }
    if(typeof user.corporateId === 'undefined'){
        user.corporateId = user.reference.corporateId
    }
     /*  End- Name -Shubhangi, Date Of Code - 08-01-2021 zoho Task Number -SCI-I700*/
    var promise = new Promise((resolve, reject) => {
        var data = {
            userId: user._id,
            userName: user.firstName + ' ' + user.lastName, 
            organizationId: user.organizationId,
            departmentId: user.departmentId,
            affiliateId: user.affiliateId,
            corporateId: user.corporateId,
            role: user.role,
            //============================ Start - Shubhangi (SNA-I5) - 13-05-2021 ============================
            roleName: user.roleName,
            //============================ End - Shubhangi (SNA-I5) - 26-05-2021 ============================
            entity: user.entity,
            //  Start- Shubhangi, 05-02-2020, SCI-I749
            createdBy : user._id,
            updatedBy : user._id
           //  End- Shubhangi, 05-02-2020, SCI-I749
        };

        var document = new userRefSchema(data);
        document.save().then(function(result) {
            var response = {isError: false, reference: result};
            resolve(response);
        }).catch((err) => {
            var response = {isError: true, reference: {}};
            resolve(response);
        });
    });

    return promise;
}; 

 /*  Start- Name -Shubhangi, Date Of Code - 08-01-2021 zoho Task Number -SCI-I700*/
var findUserRefresh = (user) => {
     /*  Start- Name -Shubhangi, Date Of Code - 26-04-2021 zoho Task Number -SCI-I903*/
    let role = []
    if(user.role == 'Agency Verifier'|| user.role == 'Agency Admin'){
    role = ['Agency Verifier','Agency Admin']
    }else if(user.role == 'Corporate Admin'|| user.role == 'corporate verifier'){
        role = ['Corporate Admin','corporate verifier']
    }else{
        role.push(user.role)
    }
     /*  End- Name -Shubhangi, Date Of Code - 26-04-2021 zoho Task Number -SCI-I903*/
    var promise = new Promise((resolve, reject) => {
        userRefSchema.find({
             /*  Start- Name -Shubhangi, Date Of Code - 26-04-2021 zoho Task Number -SCI-I903*/
            role: {$in:role},
             /*  End- Name -Shubhangi, Date Of Code - 26-04-2021 zoho Task Number -SCI-I903*/
            entity: user.reference.entity,
            userId:mongoose.Types.ObjectId(user._id)
        }, (err, newUser) => {
            if(newUser.length>=0){
                var response = {isError: false, newUser: newUser, errors: [] };
                resolve(response);
            } else {
                var response = {isError: true, newUser: {}, errors: [{msg: "User with this role and entity already exists"}]};
                resolve(response);
            }            
        })
    });

    return promise;
}
 /*  End- Name -Shubhangi, Date Of Code - 08-01-2021 zoho Task Number -SCI-I700*/

var getUserRefrences = (obj) => {
    var promise = new Promise((resolve, reject) => {
        userRefSchema.find(obj).then((result) => {
            var response = {isError: false, references: result, errors: [] };
            resolve(response);
        }).catch((err) => {
            var response = { isError: true, references: {}, errors: [] };
            resolve(response);
        });
    });
    return promise;
};

var list = (obj) => {
    var promise = new Promise((resolve, reject) => {


        var filter = [];

        var matchQuery = {
            organizationId: mongoose.Types.ObjectId(obj.organizationId)
        };

        if(obj.departmentId) {
            matchQuery.departmentId = mongoose.Types.ObjectId(obj.departmentId);
        } 
    
        if(obj.affiliateId) {
            matchQuery.affiliateId = mongoose.Types.ObjectId(obj.affiliateId);
        }

        if(obj.corporateId) {
            matchQuery.corporateId = mongoose.Types.ObjectId(obj.corporateId);
        }

        if(obj.entity && obj.entity.length) {
            matchQuery.entity = {"$in" : obj.entity};
        }

        if(obj.roles && obj.roles.length) {
            matchQuery.role = {"$in" : obj.roles};
        }
        filter.push({ $match: matchQuery });

        filter.push({
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "user"
            }
        });

        filter.push({
            $lookup: {
                from: "departments",
                localField: "departmentId",
                foreignField: "_id",
                as: "department"
            }
        });

        filter.push({
            $unwind: {
                "path": "$department",
                "preserveNullAndEmptyArrays": true
            }
        });
       

        filter.push({
            $lookup: {
                from: "affiliates",
                localField: "affiliateId",
                foreignField: "_id",
                as: "affiliate"
            }
        });

        filter.push({
            $unwind: {
                "path": "$affiliate",
                "preserveNullAndEmptyArrays": true
            }
        });

        filter.push({
            $lookup: {
                from: "organizations",
                localField: "organizationId",
                foreignField: "_id",
                as: "organization"
            }
        });

        filter.push({
            $unwind: {
                "path": "$organization",
                "preserveNullAndEmptyArrays": true
            }
        });

        var query = userRefSchema.aggregate(filter);

        query.exec((err, references) => {
            if (!err || references) {
                var users = [];
                
                for(var i=0; i < references.length; i++) {
                    var reference = references[i];
                    if(reference.user) {
                        var user = reference.user[0];
                        delete user.password;
                        user.organization = reference.organization;
                        user.department = {};
                        user.affiliate = {};
                        user.verifier = {};

                        if(reference.department) {
                            user.department = reference.department;
                        }

                        if(reference.affiliate) {
                            user.affiliate = reference.affiliate;
                        }

                        if(reference.verifier) {
                            user.verifier = reference.verifier;
                        }

                        user.reference = {
                            role: reference.role,
                            entity: reference.entity,
                            affiliateId: reference.affiliateId,
                            departmentId: reference.departmentId,
                            organizationId: reference.organizationId,
                            userId: reference.userId
                        };
                        users.push(user);

                    }
                }

                var response = { isError: false, users: users };
                resolve(response);
            } else {
                var response = { isError: true, users: [] };
                resolve(response);
            }
        });
    });

    return promise;
};

var listNew = async (obj,role,entity,filters={}) => {

    const whereObj = {}

    if(role != 'sysadmin' && entity != 'system'){
        if(obj.organizationId) {
            whereObj.organizationId = mongoose.Types.ObjectId(obj.organizationId)
        };
        if(obj.corporateId && (entity == 'corporate') ) {
            whereObj.corporateId = mongoose.Types.ObjectId(obj.corporateId);
        } 
        if(obj.departmentId && role != 'admin') {
            whereObj.departmentId = mongoose.Types.ObjectId(obj.departmentId);
        } 
        if(obj.entity && obj.entity.length) {
            whereObj.entity = {"$in" : obj.entity};
        }
        if(obj.roles && obj.roles.length) {
            whereObj.role = {"$in" : obj.roles};
        }
    }

    if (filters.roleName) {
        whereObj["roleName"] = { $regex: `${filters.roleName}`, $options: "i" }
    }
    if (filters.userType) {
        whereObj["customrole"] = { $regex: `${filters.userType}`, $options: "i" }
    }
    if (filters.userEntity) {
        whereObj["customentity"] = { $regex: `${filters.userEntity}`, $options: "i" }
    }
    if (filters.Entity_Name) {
        whereObj["$or"] = [
                    { "organization.name": { $regex: filters.Entity_Name, $options: "i" } },
                    { "corporate.companyName": { $regex: filters.Entity_Name, $options: "i" } },
                    { "user.companyName": { $regex: filters.Entity_Name, $options: "i" } }
                ]
    }
    if (filters.Entity_Id) {
        whereObj["$or"] = [
                    { "organization.code": { $regex: filters.Entity_Id, $options: "i" } },
                    { "corporate.code": { $regex: filters.Entity_Id, $options: "i" } },
                    { "user.companyCode": { $regex: filters.Entity_Id, $options: "i" } }
                ]
    }
    if (filters.fullName) {
        whereObj["user.customfullName"] = { $regex: `${filters.fullName}`, $options: "i" }
    }
    if (filters.email) {
        whereObj["user.email"] = { $regex: `${filters.email}`, $options: "i" }
    }
    if (filters.phoneNumber) {
        whereObj["user.phoneNumber"] = { $regex: `${filters.phoneNumber}`, $options: "i" }
    }
    if (filters.status) {
        whereObj["user.customstatus"] = { $regex: `${filters.status}`, $options: "i" }
    }
    if (filters.deptName) {
        whereObj["department.name"] = { $regex: `${filters.deptName}`, $options: "i" }
    }
    if (filters.firstName) {
        whereObj["user.firstName"] = { $regex: `${filters.firstName}`, $options: "i" }
    }
    if (filters.lastName) {
        whereObj["user.lastName"] = { $regex: `${filters.lastName}`, $options: "i" }
    }
    if ("searchKey" in filters && filters.searchKey) {
        whereObj['$and'] = [{
            $or: [
                { 'roleName': { $regex: `${filters.searchKey}`, $options: "i" } },
                { 'customrole': { $regex: `${filters.searchKey}`, $options: "i" } },
                { 'customentity': { $regex: `${filters.searchKey}`, $options: "i" } },
                { 'organization.name': { $regex: `${filters.searchKey}`, $options: "i" } },
                { 'corporate.companyName': { $regex: `${filters.searchKey}`, $options: "i" } },
                { 'user.companyName': { $regex: `${filters.searchKey}`, $options: "i" } },
                { 'organization.code': { $regex: `${filters.searchKey}`, $options: "i" } },
                { 'corporate.code': { $regex: `${filters.searchKey}`, $options: "i" } },
                { 'user.companyCode': { $regex: `${filters.searchKey}`, $options: "i" } },
                { 'user.customfullName': { $regex: `${filters.searchKey}`, $options: "i" } },
                { 'user.email': { $regex: `${filters.searchKey}`, $options: "i" } },
                { 'user.phoneNumber': { $regex: `${filters.searchKey}`, $options: "i" } },
                { 'user.customstatus': { $regex: `${filters.searchKey}`, $options: "i" } },
                { 'department.name': { $regex: `${filters.searchKey}`, $options: "i" } },
                { 'user.firstName': { $regex: `${filters.searchKey}`, $options: "i" } },
                { 'user.lastName': { $regex: `${filters.searchKey}`, $options: "i" } }
            ]
        }]
    }
    const aggregateArr = [
        {
            $lookup: {
                'from': 'users',
                'localField': 'userId',
                'foreignField': '_id',
                'as': 'user'
            }
        },
        {
            $unwind: "$user"
        },
        {
            $addFields:{
                "user.customstatus":{ $cond: { if: "$user.isActive", then: 'Active', else:'Inactive'} },
                "user.customfullName": {$concat: ['$user.firstName', ' ', '$user.lastName']},
                "customrole": {
                    "$switch": {
                      "branches": [
                        { "case": { "$eq": [ "$role", "sysadmin" ] }, "then": "System Admin" },
                        { "case": { "$eq": [ "$role", "subadmin" ] }, "then": "Sub Admin" },
                        { "case": { "$eq": [ "$role", "admin" ] }, "then": "Admin" },
                        { "case": { "$eq": [ "$role", "Corporate Admin" ] }, "then": "Partner Admin" },
                        { "case": { "$eq": [ "$role", "manager" ] }, "then": "User" },
                      ]
                    }
                  },
                  "customentity": {
                    "$switch": {
                      "branches": [
                        { "case": { "$eq": [ "$entity", "system" ] }, "then": "System" },
                        { "case": { "$eq": [ "$entity", "organization" ] }, "then": "Organization" },
                        { "case": { "$eq": [ "$entity", "corporate" ] }, "then": "Partner" },
                        { "case": { "$eq": [ "$role", "manager" ] }, "then": "Partner" }
                      ]
                    }
                  }
            }
        },
        {
            $lookup: {
                'from': 'departments',
                'localField': 'departmentId',
                'foreignField': '_id',
                'as': 'department'
            }
        },
        {
            $lookup: {
                'from': 'organizations',
                'localField': 'organizationId',
                'foreignField': '_id',
                'as': 'organization'
            }
        },
        {
            $lookup: {
                'from': 'corporates',
                'localField': 'corporateId',
                'foreignField': '_id',
                'as': 'corporate'
            }
        },
        {
            $match: whereObj
        },
        {
            $sort: {
                createdAt: -1
            }
        }
    ];

    //pagination code
    let paginationResultArr = [];
    paginationResultArr.push({ $skip: obj.skip || 0 });

    if (obj.limit)
        paginationResultArr.push({ $limit: obj.limit });

    aggregateArr.push({
        $facet: {
            paginatedResults: paginationResultArr,
            totalCount: [
                {
                    $count: 'count'
                }
            ]
        }
    });
    const categoriesResultArr = await userRefSchema.aggregate(aggregateArr).allowDiskUse(true);
    const responseObj = {
        'totalCount': categoriesResultArr[0]['totalCount'] && categoriesResultArr[0]['totalCount'].length ? categoriesResultArr[0]['totalCount'][0]['count'] : 0,
        'users': categoriesResultArr[0]['paginatedResults']
    };
    return responseObj;
    
};

var getAffiliateReviewers = (organizationId, affiliateId) => {

    var promise = new Promise((resolve, reject) => {
        var data = {
            organizationId: organizationId,
            affiliateId: affiliateId,
            entity: "affiliate",
            role: 'reviewer'
        };

        userRefSchema.find(data, (err, references) => {
            
            if(!err && references && references.length) {
                var response = {isError: false, reviewers: references, errors: []};
                resolve(response);
            } else {
                var response = {isError: true, reviewers: [], errors: [{msg: "No Reviewers are present in this Affiliate"}]};
                resolve(response);
            }
        });

    });

    return promise;
};

// Start - Priyanka Patil (SCI-I696) 19-01-2021
// Start - Priyanka Patil (SCI-I857) 14-04-2021
var getOrganizationReviewers = (organizationId,departmentId) => {
// End - Priyanka Patil (SCI-I857) 14-04-2021
    var promise = new Promise((resolve, reject) => {
    // Start - Priyanka Patil (SCI-I791) 08-02-2021

        var filter = [];
        // Start - Priyanka Patil (SCI-I857) 14-04-2021
        var matchQuery = {
            organizationId: mongoose.Types.ObjectId(organizationId),
            departmentId: mongoose.Types.ObjectId(departmentId),
            entity: 'organization',
        // End - Priyanka Patil (SCI-I857) 14-04-2021

            role: 'reviewer'
        };
            
        filter.push({ $match: matchQuery });

        filter.push({
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "user"
            }
        });

        filter.push({
            $unwind: {
                "path": "$user",
                "preserveNullAndEmptyArrays": true
            }
        });

        var query = userRefSchema.aggregate(filter);
        query.exec((err, references) => {
        // End - Priyanka Patil (SCI-I791) 08-02-2021
            if(!err && references && references.length) {
                var response = {isError: false, reviewers: references, errors: []};
                resolve(response);
            } else {
                var response = {isError: true, reviewers: [], errors: [{msg: "No Reviewers are present in this Organization"}]};
                resolve(response);
            }
        });

    });

    return promise;
};

var getOrganizationCertifiers = (organizationId, departmentId) => {
    var promise = new Promise((resolve, reject) => {
    // Start - Priyanka Patil (SCI-I791) 08-02-2021

        var filter = [];
        // Start - Priyanka Patil (SCI-I857) 14-04-2021
        if(departmentId !== "111111111111111111111111"){
            var matchQuery = {
                departmentId: mongoose.Types.ObjectId(departmentId),
                organizationId: mongoose.Types.ObjectId(organizationId),
                entity: 'organization',
                role: 'certifier'
            };
        }else{
            var matchQuery = {
                organizationId: mongoose.Types.ObjectId(organizationId),
                entity: 'organization',
                role: 'certifier'
            };
        }
        // End - Priyanka Patil (SCI-I857) 14-04-2021

        filter.push({ $match: matchQuery });

        filter.push({
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "user"
            }
        });

        filter.push({
            $unwind: {
                "path": "$user",
                "preserveNullAndEmptyArrays": true
            }
        });

        var query = userRefSchema.aggregate(filter);
        query.exec((err, references) => {
        // End - Priyanka Patil (SCI-I791) 08-02-2021
            if(!err && references && references.length) {
                var response = {isError: false, certifiers: references, errors: []};
                resolve(response);
            } else {
                var response = {isError: true, certifiers: [], errors: [{msg: "No Certifiers are present in this Affiliate"}]};
                resolve(response);
            }
        });

    });

    return promise;
};

var findUserByRefreshToken = (token) => {
    var promise = new Promise((resolve, reject) => {
        sessionSchema.findOne({ refreshToken: token}).select('_id userId createdAt').then((result) => {
            var response = { isError: false, session: result, errors: [] };
            resolve(response);
        }).catch((error) => {
            var response = { isError: error, session: {}, errors: [{msg: "Unauthorized Access!"}] };
            resolve(response);
        });
    });

    return promise;
};

var updateUserNumber = (user) => {
    var promise = new Promise((resolve, reject) => {
                schema.findOneAndUpdate({ '_id': user._id }, { $set: { 'phoneNumber': user.phoneNumber } }, { new : true }, (error, result) => {
                    if(error) {
                    var response = {isError: true, user: {}, errors: [{body: 'phoneNumber', msg :'Contact Number update failed'}]};
                    resolve(response);  
            } else {
                var response = {isError: false, user: {user: user}, errors: []};
                    resolve(response);
            }
        });
    });

    return promise;
};

var findPartnerByDID = (drafts) => {
    var dids = [];
    var promise = new Promise((resolve, reject) => {

        for(var i=0; i < drafts.length; i++) {
            if(Object.values(drafts[i].email)[0] == ''){
                dids[i] = Object.values(drafts[i].did)[0];
            }else{
                var response = {isError: false, drafts: drafts, errors: []};
                resolve(response);
            }
        }
        var data = {
            did: { "$all" : dids }
        };

        schema.find(data, (err, result) => {
			if(!err && result && result.length) {
                var response = {isError: false, drafts: result, errors: []};
                resolve(response);
            } else {
                var response = {isError: true, drafts: [], errors: [{msg: "Invalid DIDs in User!"}]};
                resolve(response);
            }
		});
    });

    return promise;
};
// Start - Priyanka Patil (SCI-I744) 02-03-2021
var findPartnersByDIDs = (drafts) => {
    var dids = [];
    var promise = new Promise((resolve, reject) => {

        for(var i=0; i< drafts.length; i++) {

            var draft = drafts[i];
            var data = JSON.stringify(drafts)
            var objectValue = JSON.parse(data);
            var emailDID = objectValue[i]['emailId'].value;
            var sha256 = crypto.createHash('md5').update(emailDID).digest('hex');
            did = 'did:snapcert:' + sha256;

            if(emailDID == ''){
                dids[i] = did;
            }else{
                var response = {isError: false, drafts: drafts, errors: []};
                resolve(response);
            }
        }
        var data = {
            did: { "$all" : did }
        };

        schema.find(data, (err, result) => {
			if(!err && result && result.length) {
                var response = {isError: false, drafts: result, errors: []};
                resolve(response);
            } else {
                var response = {isError: true, drafts: [], errors: [{msg: "Invalid DIDs in User!"}]};
                resolve(response);
            }
		});
    });

    return promise;
};
// End - Priyanka Patil (SCI-I744) 02-03-2021

var updateEmail = (data) => {
	var promise = new Promise((resolve, reject) => {
		id = mongoose.Types.ObjectId(data.id);		
		if(data.newEmail) {
			data.newEmail = data.newEmail;
		}
		schema.findOneAndUpdate({ _id: id}, { $set : data }, (err, result) => {
            if(!err) {
				var response = { isError: false,user: result, errors: [] };
            	resolve(response);
			}else {
				var response = { isError: true,user: [], errors: [{msg: "failed to update the partner status"}] };
            	resolve(response);
			}
		});
	});
	return promise;
};

var findOtpByUserId = (params) => {
    var promise = new Promise((resolve, reject) => {
        var data = {
            userId: params.userId
        };

        otpSchema.findOne(data,{}, {sort:{$natural:-1}}, (err, otp) => {
            if(!err && otp){
                if(otp){
                    var isOtpExpired = checkOtpResend(otp.createdAt);
                    if(isOtpExpired) {
                        var response = { isError: false, otp: otp,flag:true, errors: [{msg: 'success'}]};                    
                    }else{
                        var response = { isError: false, otp: otp,flag:false, errors: [{msg: 'fail'}]};  
                    }
                }                
            }else{
                var response = { isError: true, otp: {}, errors: [{msg: 'User not found'}]};
            }
            resolve(response);
        });
    });

    return promise;
};

var checkOtpResend = (createDate) => {
   let date_ob = new Date(); 
   var sec_num = (date_ob - createDate) / 1000;
   var days    = Math.floor(sec_num / (3600 * 24));
   var hours   = Math.floor((sec_num - (days * (3600 * 24)))/3600);
   var minutes = Math.floor((sec_num - (days * (3600 * 24)) - (hours * 3600)) / 60);

    if(minutes > 1) {        
        return true;
    }  
    return false;
};

var getRefernceById = (userId) => {

    var promise = new Promise((resolve, reject) => {

        var data = {
            userId: mongoose.Types.ObjectId(userId)
        };
        userRefSchema.find(data, (err, referenceList) => {
            if (err) {
                    var response = { isError: true, otp: {}, errors: [{param: 'code', msg: 'OTP is expired'}]};
               
            } else {

                var response = { isError: false, referenceList: referenceList, errors: []};
            }
            resolve(response);
        });
    });

    return promise;
};

//  Start- Mahalaxmi, 25-01-2021, SCI-I40
var findUserOtpById = (userId) => {
    var promise = new Promise((resolve, reject) => {
        var data = {
            userId: mongoose.Types.ObjectId(userId)
        };
        otpSchema.findOne(data,{}, {sort:{$natural:-1}}, (err, otp) => {
            if (!err || otp.length) {
                var response = { isError: false, otp: otp, errors: [] };
                resolve(response);
            } else {
                var response = { isError: true, otp: {}, errors: [{msg: "Invalid User ID"}] };
                resolve(response);
            }
        });
    });

    return promise;
};
//  End- Mahalaxmi, 25-01-2021, SCI-I40

var getPartnersSuperUsers = (obj,filters={}) => {
    var promise = new Promise(async (resolve, reject) => {
        var matchQuery ={}
        if (filters.email) {
            matchQuery["user.email"] = { $regex: `${filters.email}`, $options: "i" }
        }
        if (filters.companyCode) {
            matchQuery["corporate.code"] = { $regex: `${filters.companyCode}`, $options: "i" }
        }
        if (filters.companyName) {
            matchQuery["corporate.companyName"] = { $regex: `${filters.companyName}`, $options: "i" }
        }
        if (filters.userName) {
            matchQuery["userName"] = { $regex: `${filters.userName}`, $options: "i" }
        }
        if (filters.phoneNumber) {
            matchQuery["user.phoneNumber"] = { $regex: `${filters.phoneNumber}`, $options: "i" }
        }
         const aggregateArr = [
            {
                $lookup: {
                    from: "corporates",
                    localField: "corporateId",
                    foreignField: "_id",
                    as: "corporate"
                }
            },
            {
                $unwind: {
                    "path": "$corporate",
                    "preserveNullAndEmptyArrays": true
                }
            },
            
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user"
                }
            },
            {
                $unwind: {
                    "path": "$user",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                $match: matchQuery
            },
            {
                $match:{
                    "role": 'Corporate Admin',
                    "corporateId":mongoose.Types.ObjectId(obj.corporateId)
                }
            },
            {
                $sort: {
                    updatedAt: -1
                }
            }
        ];
        let paginationResultArr = [];
        paginationResultArr.push({ $skip: obj.page || 0 });

        if (obj.size)
            paginationResultArr.push({ $limit: obj.size });
        aggregateArr.push({
            $facet: {
                paginatedResults: paginationResultArr,
                totalCount: [
                    {
                        $count: 'count'
                    }
                ]
            }

        });
        var partnersResultArr = await userRefSchema.aggregate(aggregateArr).allowDiskUse(true);
        var response2;
        if (partnersResultArr.length > 0) {
            const responseObj = {
                'superUsers': partnersResultArr[0]['paginatedResults'],
                'total_count': partnersResultArr[0]['totalCount'] && partnersResultArr[0]['totalCount'].length ? partnersResultArr[0]['totalCount'][0]['count'] : 0
            };
            response2 = { isError: false, superUsers: responseObj };
            resolve(response2);
        } else {
            response2 = { isError: true, superUsers: [] };
            resolve(response2);
        }
    });
    return promise;
};

var AllAdminList = async (payloadData) => {
    const whereObj = {}

    if(payloadData.organizationId) {
        whereObj.organizationId = mongoose.Types.ObjectId(payloadData.organizationId)
    }
     whereObj.entity = 'system';

    const result = await userRefSchema.aggregate(
        [
        {
            $match: whereObj
        }
    ])

    return result && result.length ? result : null;
};

const updateAccount = async (payloadData) => {
    if (!payloadData) {
        return false;
    }
    let whereObj = {};
    if(payloadData.id){
        whereObj._id =  mongoose.Types.ObjectId(payloadData.id)
    }
    const result = await schema.findOneAndUpdate(
        whereObj,
        {
            $set: payloadData
        },
        { new: true, useFindAndModify: false, upsert: true }
    );
     return result;
}

module.exports = {
    create,
    findByEmail,
    createOtp,
    findOtp,
    updatePassword,
    updateOtp,
    generatePassword,
    findpassword,
    createSession,
    verifyPassword,
    updateSession,
    destorySession,
    list,
    findById,
    update,
    getAffiliateReviewers,
    getOrganizationReviewers,
    getOrganizationCertifiers,
    findUserByRefreshToken,
    sendEmail,
    historylist,
    historylistNew,
    partnerStatus,
    updateUserNumber,
    findPartnerByDID,
    findByRole,
    findByCmpName,
    updateEmail,
    findOtpByUserId,
    listNew,
     /*  Start- Name -Shubhangi, Date Of Code - 08-01-2021 zoho Task Number -SCI-I700*/
    findUserRefresh,
    saveUserReferences,
     /*  End- Name -Shubhangi, Date Of Code - 08-01-2021 zoho Task Number -SCI-I700*/
     //  Start- Mahalaxmi, 25-01-2021, SCI-I40
     findUserOtpById,
     //  End- Mahalaxmi, 25-01-2021, SCI-I40
     // Start - Priyanka Patil (SCI-I744) 02-03-2021
     findPartnersByDIDs,
     // End - Priyanka Patil (SCI-I744) 02-03-2021
     getPartnersSuperUsers,
     // Start - Priyanka Patil (SNA-I86) 29-06-2021
     findByOrgId,
     AllAdminList,
     updateAccount
     // End - Priyanka Patil (SNA-I86) 29-06-2021
};