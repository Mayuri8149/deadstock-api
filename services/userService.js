var request = require('request');
var userSchema = require('../routes/v1/user/schema');
var userRefSchema = require('../routes/v1/user/userRefSchema');
var crypto = require('crypto');
const bcrypt = require("bcrypt");

var getUserFromBlockchain = (did, email, fname, lname, publicKey) => {
    var promise = new Promise((resolve, reject) => {
        if (process.env.NODE_ENV == 'production') {
            getUserFromBlockchainProduction(did, email, fname, lname, publicKey).then((result) => {
                if (!result.isError) {
                    var response = { isError: false, user: result, err: [] };
                    resolve(response);
                } else {
                    var response = { isError: true, user: [], err: result.err };
                    resolve(response);
                }
            });
        } else {
            getUserFromBlockchainTestServer(did, email, fname, lname, publicKey).then((result) => {
                if (!result.isError) {
                    var response = { isError: false, user: result, err: [] };
                    resolve(response);
                } else {
                    var response = { isError: true, user: [], err: result.err };
                    resolve(response);
                }
            });
        }
    });

    return promise;
}

var getUserFromBlockchainProduction = (did) => {
    var promise = new Promise((resolve, reject) => {
        var formData = {
            "channel": "default",
            "chaincode": "identity",
            "chaincodeVer": "v2",
            "method": "getUser",
            "args": [did],
        }

        var username = global.config.blockchainCred.username;
        var passw = global.config.blockchainCred.passw;

        request.post({
            url: "https://snapcertprod-snapper-bom.blockchain.ocp.oraclecloud.com:7443/restproxy/bcsgw/rest/v1/transaction/query",
            body: formData,
            json: true,
            traditional: true,
            headers: {
                'Authorization': 'Basic ' + new Buffer(username + ':' + passw).toString('base64')
            }
        }, (err, result) => {
            if (result.body.returnCode == 'Success') {
                var body = result.body.result.payload;

                var response = { isError: false, user: body, err: [] };
                resolve(response);
            } else {
                var response = { isError: true, user: [], err: [{ 'msg': 'No User Found!' }] };
                resolve(response);
            }
        });
    });

    return promise;
}

var getUserFromBlockchainTestServer = (did) => {
    var promise = new Promise((resolve, reject) => {
        request.post({
            url: global.config.BLOCKCHAIN_URI + 'users',
            /*  End- Name -Shubhangi, Date Of Code - 18-01-2021 zoho Task Number -SCI-I697*/
            dataType: 'json',
            contentType: 'application/x-www-form-urlencoded',
            form: {
                username: "admin",
                orgName: "Org1"
            },
        }, (err, httpResponse, body) => {
            if (err) {
                req.app.responseHelper.send(res, true, {
                    msg: 'Something went wrong! Please try again later.'
                }, [], 500);
            } else {
                var data = JSON.parse(body);
                if (data.success) {
                    var token = data.token;
                    /*  Start- Name -Shubhangi, Date Of Code - 18-01-2021 zoho Task Number -SCI-I697*/
                    var url = global.config.BLOCKCHAIN_URI + 'channels/mychannel/chaincodes/identitycc?peer=peer0.org1.example.com&fcn=getUser&args=%5B%22' + did + '%22%5D'
                    /*  End- Name -Shubhangi, Date Of Code - 18-01-2021 zoho Task Number -SCI-I697*/
                    request.get({
                        url: url,
                        contentType: 'application/json',
                        headers: {
                            'Authorization': 'Bearer ' + token
                        }
                    }, (err, httpResponse, body) => {
                        // Start - Priyanka Patil (SCI-I880) 24-04-2021
                        if (body == 'Error: {"Error":"Nil amount for '+ did +'"}') {
                        // End - Priyanka Patil (SCI-I880) 24-04-2021
                            var response = { isError: true, user: [], err: [{ 'msg': 'User Update Failed!' }] };
                            resolve(response);
                        } else if (err) {
                            var response = { isError: true, user: [], err: [{ 'msg': 'User Update Failed!' }] };
                            resolve(response);
                        } else {
                            body = JSON.parse(JSON.stringify(body.trim()));
                            var data123 = JSON.parse(body);

                            var response = { isError: false, user: data123, err: [] };
                            resolve(response);
                        }
                    })
                }
            }
        })
    });

    return promise;
}

var addUserOnBlockchain = (did, email, fname, lname, publicKey) => {
    var promise = new Promise((resolve, reject) => {
        if (process.env.NODE_ENV == 'production') {
            addUserOnBlockchainProduction(did, email, fname, lname, publicKey).then((result) => {
                if (!result.isError) {
                    var response = { isError: false, user: result, err: [] };
                    resolve(response);
                } else {
                    var response = { isError: true, user: [], err: result.err };
                    resolve(response);
                }
            });
        } else {
            addUserOnBlockchainTestServer(did, email, fname, lname, publicKey).then((result) => {
                if (!result.isError) {
                    var response = { isError: false, user: result, err: [] };
                    resolve(response);
                } else {
                    var response = { isError: true, user: [], err: result.err };
                    resolve(response);
                }
            });
        }
    });

    return promise;
}

var addUserOnBlockchainProduction = (did, email, fname, lname, publicKey) => {
    var promise = new Promise((resolve, reject) => {
        var formData = {
            "channel": "default",
            "chaincode": "identity",
            "chaincodeVer": "v2",
            "method": "addUser",
            "args": [did, email, fname, lname, publicKey, ""],
        }

        var username = global.config.blockchainCred.username;
        var passw = global.config.blockchainCred.passw;

        request.post({
            url: "https://snapcertprod-snapper-bom.blockchain.ocp.oraclecloud.com:7443/restproxy/bcsgw/rest/v1/transaction/invocation",
            body: formData,
            json: true,
            traditional: true,
            headers: {
                'Authorization': 'Basic ' + new Buffer(username + ':' + passw).toString('base64')
            }
        }, (err, result) => {
            if (result.body.returnCode == 'Success') {
                var response = { isError: false, user: [], err: [] };
                resolve(response);
            } else {
                var response = { isError: true, user: [], err: [{ 'msg': 'User Update Failed!' }] };
                resolve(response);
            }
        });
    });

    return promise;
}

var addUserOnBlockchainTestServer = (did, email, fname, lname, publicKey) => {
    var promise = new Promise((resolve, reject) => {
        request.post({
            url: global.config.BLOCKCHAIN_URI + 'users',
            dataType: 'json',
            contentType: 'application/x-www-form-urlencoded',
            form: {
                username: 'Admin',
                orgName: 'Org1'
            }
        }, (err, httpResponse, body) => {
            var bodyData = JSON.parse(body);

            if (bodyData.success) {
                var token = bodyData.token;

                var formData = {
                    'peers': ['peer0.org1.example.com', 'peer0.org2.example.com'],
                    'fcn': 'addUser',
                    'args': [did, email, fname, lname, publicKey]
                }

                request.post({
                    url: global.config.BLOCKCHAIN_URI + 'channels/mychannel/chaincodes/identitycc',
                    json: true,
                    body: formData,
                    headers: {
                        'Authorization': 'Bearer ' + token
                    }
                }, (err, httpResponse, body) => {
                    if (body.success) {
                        var response = { isError: false, user: [], err: [] };
                        resolve(response);
                    } else {
                        var response = { isError: true, user: [], err: [{ 'msg': 'User Update Failed!' }] };
                        resolve(response);
                    }
                });
            }
        });
    });

    return promise;
}

const addSysadmin = async (count) => {
    
    if(count==0){
        var payloadData={};
        payloadData.email = "sysadm@yopmail.com"
        const sha256 = crypto.createHash('md5').update(payloadData.email).digest('hex');
        payloadData.did = 'did:snapcert:' + sha256;
    
        const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
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
    
        payloadData.privateKey = privateKey;
        payloadData.publicKey = publicKey;
    
        const verifiableData = payloadData.did;
    
        const signaturee = crypto.sign("sha256", Buffer.from(verifiableData), {
            key: privateKey,
            padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
        })
    
        payloadData.signature = signaturee.toString("base64");
        payloadData.password = bcrypt.hashSync("Snap@123", 10);
        const userData = new userSchema({
            "firstName": "System",
            "lastName": "Admin",
            "email": payloadData.email,
            "phoneNumber": "+918754219865",
            "isVerified": true,
            "did": payloadData.did,
            "privateKey": payloadData.privateKey,
            "publicKey": payloadData.publicKey,
            "signature": payloadData.signature,
            "password": payloadData.password,
            "timeZone": "Asia/Calcutta",
            "createdBy": {
                "firstName": "System",
                "lastName": "Admin",
                "email": "sysadm@yopmail.com"
            },
            "updatedBy": {
                "firstName": "System",
                "lastName": "Admin",
                "email": "sysadm@yopmail.com"
            }
        });
        userData.save();
        const userRefData = new userRefSchema({
            "userId": userData._id,
            "userName": userData.firstName + " " + userData.lastName,
            "role": "sysadmin",
            "entity": "system",
            "createdBy": userData._id,
            "updatedBy": userData._id
        });
        userRefData.save();
    }
}
module.exports = {
    addUserOnBlockchain,
    getUserFromBlockchain,
    addSysadmin
}