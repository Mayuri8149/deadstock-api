var crypto = require('crypto');
var sha256 = require('sha256');

var generateDid = (email) => {
    var promise = new Promise((resolve, reject) => {
        var sha256 = crypto.createHash('md5').update(email).digest('hex');
        var did = 'did:snapcert:' + sha256;

        if (did) {
            var response = { isError: false, did: did, err: [] };
            resolve(response);
        } else {
            var response = { isError: true, did: [], err: [{ 'msg': 'DID creation failed!' }] };
            resolve(response);
        }
    });

    return promise;
}

var generatePriPubKey = () => {
    var promise = new Promise((resolve, reject) => {
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

        if (privateKey, publicKey) {
            var keys = {
                privateKey: privateKey,
                publicKey: publicKey
            }
            var response = { isError: false, keys: keys, err: [] };
            resolve(response);
        } else {
            var response = { isError: true, keys: [], err: [{ 'msg': 'Key creation failed!' }] };
            resolve(response);
        }
    });

    return promise;
}

var createSignature = (verifiableData, privateKey) => {
    var promise = new Promise((resolve, reject) => {
        var signature = crypto.sign('sha256', Buffer.from(verifiableData), {
            key: privateKey,
            padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
        });

        if (signature) {
            var response = { isError: false, signature: signature, err: [] };
            resolve(response);
        } else {
            var response = { isError: true, signature: [], err: [{ 'msg': 'Signature creation failed!' }] };
            resolve(response);
        }
    });

    return promise;
}

var createHashForTrueFlag = (obj) => {
    var keys =  Object.values(obj.transactionHash);  

    var transactionid = "";

    for (var transactionidkey of keys) {
        var str = transactionidkey;
        if(isNaN(str)){
            var res = str.toUpperCase();
        }else{
            var res = str;
        }

        transactionid += res + "";
    }

    transactionid = sha256(transactionid);
    return transactionid;
};

var createHash = (obj) => {
    var transactionid = "";

    for (var transactionidkey in obj) {
        var str = obj[transactionidkey];
        if(isNaN(str)){
            var res = str.toUpperCase();
        }else{
            var res = str;
        }
        transactionid += res + "";
    }
    transactionid = sha256(transactionid);
    return transactionid;
};

module.exports = {
    generateDid,
    generatePriPubKey,
    createSignature,
    createHashForTrueFlag,
    createHash
}