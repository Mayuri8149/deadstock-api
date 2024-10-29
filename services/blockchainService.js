var request = require('request');
// var transactionModel = require('../routes/v1/transaction/model');

var updateOnBlockchain = (transaction, fabricSetup, certifiers) => {
    var promise = new Promise((resolve, reject) => {
        if (process.env.NODE_ENV == 'production') {

        } else {
            updateOnBlockchainTestServer(transaction, fabricSetup, certifiers).then((result) => {
                if (!result.isError) {
                    var response = { isError: false, transaction: result.transaction, err: [] };
                    resolve(response);
                } else {
                    var response = { isError: true, transaction: [], err: result.err };
                    resolve(response);
                }
            });
        }
    });

    return promise;
}

var updateOnBlockchainTestServer = (transaction, fabricSetup, certifiers) => {
    var promise = new Promise((resolve, reject) => {
        request.post({
            url: 'http://20.102.76.133:4000/users',
            dataType: 'json',
            contentType: 'application/x-www-form-urlencoded',
            form: {
                username: "user",
                orgName: fabricSetup.fabricOrgId
            }
        }, (err, result) => {
            if (result != undefined) {
                var details = JSON.parse(result.body);
                if (details.success) {
                    var token = details.token;
                    console.log('transaction.fields--',transaction)
                    var stringifiedParsedData = JSON.stringify(transaction.fields);                    
                    var objectData = stringifiedParsedData.replace(/\'/g, '"');
                    var fieldsObjectData = objectData.replace(/\"/g, "'");
                    console.log('objectData-',objectData);
                    console.log('fieldsObjectData-',fieldsObjectData);
                    if(transaction.refOrder == undefined){
                        console.log('in ref order undefined case')
                        transaction.refOrder = '';
                    }else{
                        console.log('else of ref order undefined')
                        transaction.refOrder = transaction.refOrder;
                    }
                    // var balanceQty
                    var formData = {
                        'peers': ['peer0.org1.example.com', 'peer0.org2.example.com'],
                        'fcn': 'UpdateAsset',
                        'args': [
                            // "{\"TransactionID\":\""+transaction.transactionid+"\",\"TransactionEntity\":\""+transaction.transactionEntity+"\",\"Branch\":\""+transaction.branch+"\",\"Module\":\""+transaction.moduleCode+"\",\"TransactionType\":\""+transaction.transactionTypeCode+"\",\"PartnerEntity\":\""+transaction.refEntity+"\",\"PartnerBranch\":\""+""+"\",\"AssetID\":\""+transaction.assetId+"\",\"OrderID\":\""+""+"\",\"AssetName\":\""+transaction.assetName+"\",\"AssetLocation\":\""+transaction.assetLocation+"\",\"AssetType\":\""+transaction.assetType+"\",\"BalanceQty\":\""+transaction.quantity+"\",\"Qty\":\""+transaction.quantity+"\",\"UOM\":\""+transaction.uom+"\",\"EffectiveDate\":\""+transaction.effectiveDate+"\",\"ExpiryDate\":\""+transaction.expiryDate+"\",\"ReferenceAsset\":\""+transaction.refAsset+"\",\"ReferenceOrder\":\""+transaction.refOrder+"\",\"Status\":\""+transaction.status+"\",\"AllValues\":\""+""+"\",\"Acknowledgement\":\""+""+"\",\"Transaction\":\""+transaction.transaction+"\"}"
                            // {
                            //     "TransactionID": transaction.transactionid + 
                            // }
                            transaction.transactionid,           //1
                            transaction.transactionEntity,       //2 
                            transaction.branch,                  //3
                            transaction.moduleCode,              //4
                            transaction.transactionTypeCode,     //5
                            transaction.refEntity,               //6
                            '', // Partner Branch               //7
                            transaction.assetId,                 //8
                            '', // Order Id                     //9
                            transaction.assetName,               //10
                            '', // Asset Type                   //11
                            transaction.assetLocation,           //12
                            transaction.quantity,              //13
                            transaction.quantity,                //14
                            transaction.uom,                     //15
                            transaction.effectiveDate,           //16
                            transaction.expiryDate,              //17
                            transaction.refAsset,                //18
                            transaction.refOrder,                //19
                            '',                                 //20
                            fieldsObjectData,                  //21
                            transaction.status,                  //22
                            ''                                  //23
                        ]
                        // 'args': [
                        //     "{\"TransactionID\":\"t2\",
                        //     \"TransactionEntity\":\"ttt\",
                        //     \"Branch\":\"test\",
                        //     \"TransactionType\" :\"test\",\"PartnerEntity\" :\"test\",\"PartnerBranch\" :\"test\",
                        //     \"AssetID\" :\"test\",\"OrderID\" :\"test\",\"AssetName\" :\"test\",\
                        //     \"AssetLocation\" :\"test\",\"Qty\" :\"test\",\"UOM\":\"kg\",\"EffectiveDate\" :\"test\",
                        //     \"ExpiryDate\" :\"1600138309939\",\"ReferenceAsset\" :\"1600138309939\",
                        //     \"ReferenceOrder\" :\"test\", \"Status\": \"Certificate\"}"]

                    }
                    console.log('ars', formData)

                    request.post({
                        url: 'http://20.102.76.133:4000/' + 'channels/' + fabricSetup.fabricChannelId + '/chaincodes/asset_cc',
                        json: true,
                        traditional: true,
                        body: formData,
                        headers: {
                            'Authorization': 'Bearer ' + token
                        }
                    }, (err, httpResponse, body) => {
                        console.log('bodyUpdateOrderAsset', body)
                        if (body.result.message) {
                            var response = { isError: false, transaction: transaction, err: [] };
                            resolve(response);
                        } else {
                            var response = { isError: true, transaction: [], err: [{ 'msg': 'Transaction Update Failed!' }] };
                            resolve(response);
                        }
                    });
                }
            }
        })
    });
    return promise;
}

var addAssetOnBlockchain = (transaction, fabricSetup, certifiers) => {
    var promise = new Promise((resolve, reject) => {
        if (process.env.NODE_ENV == 'production') {

        } else {
            addAssetOnBlockchainTestServer(transaction, fabricSetup, certifiers).then((result) => {
                if (!result.isError) {
                    var response = { isError: false, transaction: result.transaction, err: [] };
                    resolve(response);
                } else {
                    var response = { isError: true, transaction: [], err: result.err };
                    resolve(response);
                }
            });
        }
    });

    return promise;
}

var addAssetOnBlockchainTestServer = (transaction, fabricSetup, certifiers) => {
    var promise = new Promise((resolve, reject) => {
        request.post({
            url: 'http://20.102.76.133:4000/users',
            dataType: 'json',
            contentType: 'application/x-www-form-urlencoded',
            form: {
                username: "user",
                orgName: fabricSetup.fabricOrgId
            }
        }, (err, result) => {
            if (result != undefined) {
                var details = JSON.parse(result.body);
                if (details.success) {
                    var token = details.token;
                    console.log('token', token)
                    console.log('transaction.fields--',transaction.fields)
                    var stringifiedParsedData = JSON.stringify(transaction.fields);                    
                    var objectData = stringifiedParsedData.replace(/\'/g, '"');
                    var fieldsObjectData = objectData.replace(/\"/g, "'");
                    console.log('objectData-',objectData);
                    console.log('fieldsObjectData-',fieldsObjectData);
                    var formData = {
                        'peers': ['peer0.org1.example.com', 'peer0.org2.example.com'],
                        'fcn': 'InsertAssetRecords',
                        'args': [
                            // "{\"TransactionID\":\""+transaction.transactionid+"\",\"TransactionEntity\":\""+transaction.transactionEntity+"\",\"Branch\":\""+transaction.branch+"\",\"Module\":\""+transaction.moduleCode+"\",\"TransactionType\":\""+transaction.transactionTypeCode+"\",\"PartnerEntity\":\""+transaction.refEntity+"\",\"PartnerBranch\":\""+""+"\",\"AssetID\":\""+transaction.assetId+"\",\"OrderID\":\""+""+"\",\"AssetName\":\""+transaction.assetName+"\",\"AssetLocation\":\""+transaction.assetLocation+"\",\"AssetType\":\""+transaction.assetType+"\",\"BalanceQty\":\""+transaction.quantity+"\",\"Qty\":\""+transaction.quantity+"\",\"UOM\":\""+transaction.uom+"\",\"EffectiveDate\":\""+transaction.effectiveDate+"\",\"ExpiryDate\":\""+transaction.expiryDate+"\",\"ReferenceAsset\":\""+transaction.refAsset+"\",\"ReferenceOrder\":\""+transaction.refOrder+"\",\"Status\":\""+transaction.status+"\",\"AllValues\":\""+""+"\",\"Acknowledgement\":\""+""+"\",\"Transaction\":\""+transaction.transaction+"\"}"

                            "{\"TransactionID\":\""+transaction.transactionid+"\",\"TransactionEntity\":\""+transaction.transactionEntity+"\",\"Branch\":\""+transaction.branch+"\",\"Module\":\""+transaction.moduleCode+"\",\"TransactionType\":\""+transaction.transactionTypeCode+"\",\"PartnerEntity\":\""+transaction.refEntity+"\",\"AssetID\":\""+transaction.assetId+"\",\"AssetName\":\""+transaction.assetName+"\",\"AssetLocation\":\""+transaction.assetLocation+"\",\"AssetType\":\""+transaction.assetType+"\",\"BalanceQty\":\""+transaction.quantity+"\",\"Qty\":\""+transaction.quantity+"\",\"UOM\":\""+transaction.uom+"\",\"EffectiveDate\":\""+transaction.effectiveDate+"\",\"ExpiryDate\":\""+transaction.expiryDate+"\",\"ReferenceAsset\":\""+transaction.refAsset+"\",\"ReferenceOrder\":\""+transaction.refOrder+"\",\"Status\":\""+transaction.status+"\",\"AllValues\":\""+fieldsObjectData+"\",\"Transaction\":\""+transaction.transaction+"\"}"
                        ]
                        // 'args': [
                        //     "{\"TransactionID\":\"t2\",
                        //     \"TransactionEntity\":\"ttt\",
                        //     \"Branch\":\"test\",
                        //     \"TransactionType\" :\"test\",\"PartnerEntity\" :\"test\",\"PartnerBranch\" :\"test\",
                        //     \"AssetID\" :\"test\",\"OrderID\" :\"test\",\"AssetName\" :\"test\",\
                        //     \"AssetLocation\" :\"test\",\"Qty\" :\"test\",\"UOM\":\"kg\",\"EffectiveDate\" :\"test\",
                        //     \"ExpiryDate\" :\"1600138309939\",\"ReferenceAsset\" :\"1600138309939\",
                        //     \"ReferenceOrder\" :\"test\", \"Status\": \"Certificate\"}"]

                    }
                    console.log('formData.args', formData.args)
                    request.post({
                        url: 'http://20.102.76.133:4000/' + 'channels/' + fabricSetup.fabricChannelId + '/chaincodes/asset_cc',
                        json: true,
                        traditional: true,
                        body: formData,
                        headers: {
                            'Authorization': 'Bearer ' + token
                        }
                    }, (err, httpResponse, body) => {
                        console.log('bodyAsset', body)
                        if (body.result.message) {
                            var response = { isError: false, transaction: transaction, err: [] };
                            resolve(response);
                        } else {
                            var response = { isError: true, transaction: [], err: [{ 'msg': 'Transaction Update Failed!' }] };
                            resolve(response);
                        }
                    });
                }
            }
        })
    });
    return promise;
}

var addOrderOnBlockchain = (transaction, fabricSetup, certifiers) => {
    var promise = new Promise((resolve, reject) => {
        if (process.env.NODE_ENV == 'production') {

        } else {
            addOrderOnBlockchainTestServer(transaction, fabricSetup, certifiers).then((result) => {
                if (!result.isError) {
                    var response = { isError: false, transaction: result.transaction, err: [] };
                    resolve(response);
                } else {
                    var response = { isError: true, transaction: [], err: result.err };
                    resolve(response);
                }
            });
        }
    });

    return promise;
}

var addOrderOnBlockchainTestServer = (transaction, fabricSetup, certifiers) => {
    var promise = new Promise((resolve, reject) => {
        request.post({
            url: 'http://20.102.76.133:4000/users',
            dataType: 'json',
            contentType: 'application/x-www-form-urlencoded',
            form: {
                username: "user",
                orgName: fabricSetup.fabricOrgId
            }
        }, (err, result) => {
            if (result != undefined) {
                var details = JSON.parse(result.body);

                if (details.success) {
                    var token = details.token;
                    console.log(';aeraf', token);
                    console.log('transaction.fields--',transaction.fields)
                    var stringifiedParsedData = JSON.stringify(transaction.fields);                    
                    var objectData = stringifiedParsedData.replace(/\'/g, '"');
                    var fieldsObjectData = objectData.replace(/\"/g, "'");
                    console.log('objectData-',objectData);
                    console.log('fieldsObjectData-',fieldsObjectData);

                    var formData = {
                        'peers': ['peer0.org1.example.com', 'peer0.org2.example.com'],
                        'fcn': 'InsertOrderRecords',
                        'args': [
                            "{\"TransactionID\":\""+transaction.transactionid+"\",\"TransactionEntity\":\""+transaction.transactionEntity+"\",\"Branch\":\""+transaction.branch+"\",\"Module\":\""+transaction.moduleCode+"\",\"TransactionType\":\""+transaction.transactionTypeCode+"\",\"PartnerEntity\":\""+transaction.refEntity+"\",\"PartnerBranch\":\""+""+"\",\"OrderID\":\""+transaction.orderId+"\",\"AssetType\":\""+transaction.assetType+"\",\"BalanceQty\":\""+transaction.quantity+"\",\"Qty\":\""+transaction.quantity+"\",\"UOM\":\""+transaction.uom+"\",\"ReferenceAsset\":\""+transaction.refAsset+"\",\"ReferenceOrder\":\""+transaction.refOrder+"\",\"Status\":\""+transaction.status+"\",\"AllValues\":\""+ fieldsObjectData +"\",\"Transaction\":\""+transaction.transaction+"\"}"

                        ]
                        // 'args': [
                        //     "{\"TransactionID\":\"t2\",
                        //     \"TransactionEntity\":\"ttt\",
                        //     \"Branch\":\"test\",
                        //     \"TransactionType\" :\"test\",\"PartnerEntity\" :\"test\",\"PartnerBranch\" :\"test\",
                        //     \"AssetID\" :\"test\",\"OrderID\" :\"test\",\"AssetName\" :\"test\",\
                        //     \"AssetLocation\" :\"test\",\"Qty\" :\"test\",\"UOM\":\"kg\",\"EffectiveDate\" :\"test\",
                        //     \"ExpiryDate\" :\"1600138309939\",\"ReferenceAsset\" :\"1600138309939\",
                        //     \"ReferenceOrder\" :\"test\", \"Status\": \"Certificate\"}"]

                    }
                    request.post({
                        url: 'http://20.102.76.133:4000/' + 'channels/' + fabricSetup.fabricChannelId + '/chaincodes/asset_cc',
                        json: true,
                        traditional: true,
                        body: formData,
                        headers: {
                            'Authorization': 'Bearer ' + token
                        }
                    }, (err, httpResponse, body) => {
                        console.log('bodyOrder', body)
                        if (body.result.message) {
                            var response = { isError: false, transaction: transaction, err: [] };
                            resolve(response);
                        } else {
                            var response = { isError: true, transaction: [], err: [{ 'msg': 'Transaction Update Failed!' }] };
                            resolve(response);
                        }
                    });
                }
            }
        })
    });
    return promise;
}

var blockchainQuery = (transactionid, fabricSetup) => {
    var promise = new Promise((resolve, reject) => {
        if (process.env.NODE_ENV == 'production') {
            // blockchainQueryOnProd(transactionId).then((result) => {
            //     if (result.isError) {
            //         var response = { isError: true, transaction: result.transaction, err: [] };
            //         resolve(response);
            //     } else {
            //         var response = { isError: false, transaction: result.transaction, err: [] };
            //         resolve(response);
            //     }
            // });
        } else {
            blockchainQueryOnTestServer(transactionid, fabricSetup).then((result) => {
                if (!result.isError) {
                    var response = { isError: false, transaction: result.transaction, err: [] };
                    resolve(response);
                } else {
                    var response = { isError: true, transaction: result.transaction, err: [] };
                    resolve(response);
                }
            });
        }
    });

    return promise;
}

var blockchainQueryOnTestServer = (transactionid, fabricSetup) => {
    console.log("transactionid",transactionid)
    console.log("fabricSetup0",fabricSetup)
    var promise = new Promise((resolve, reject) => {
        // request.post({
        //     /*  Start- Name -Shubhangi, Date Of Code - 18-01-2021 zoho Task Number -SCI-I697*/
        //     url: 'http://20.102.76.133:4000/' + 'users',
        //     /*  End- Name -Shubhangi, Date Of Code - 18-01-2021 zoho Task Number -SCI-I697*/
        //     dataType: 'json',
        //     contentType: 'application/x-www-form-urlencoded',
        //     form: {
        //         username: "neha",
        //         orgName: fabricSetup.fabricOrgId
        //     }
        // }, (err, httpResponse, body) => {
            request.post({
                url: 'http://20.102.76.133:4000/users',
                dataType: 'json',
                contentType: 'application/x-www-form-urlencoded',
                form: {
                    username: "user",
                    orgName: fabricSetup.fabricOrgId
                }
            }, (err, body) => {
            // console.log('body 313',JSON.parse(body.body))
            // var token = JSON.parse(body.body);
            if (err) {
                console.log('error 324',err)
                var response = {
                    isError: true,
                    transaction: 'Something went wrong! Please try again later!',
                    errors: []
                };
                resolve(response);
            } else {
                var data = JSON.parse(body.body);
                if (data.success) {
                    var token = data.token;
                    console.log('token 313',token)

                    /*  Start- Name -Shubhangi, Date Of Code - 18-01-2021 zoho Task Number -SCI-I697*/
                    // var url = 'http://20.102.76.133:4000/' + 'channels/' + fabricSetup.fabricChannelId + '/chaincodes/asset_cc?peer=peer0.org1.example.com&fcn=query&args=%5B%22' + transactionid + '%22%5D'

                    var url = 'http://20.102.76.133:4000/channels/mychannel/chaincodes/asset_cc?args=' +[transactionid] + '&peer=peer0.org1.example.com&fcn=GetAssetByTransactionID'

                    /*  End- Name -Shubhangi, Date Of Code - 18-01-2021 zoho Task Number -SCI-I697*/
                    request.get({
                        url: url,
                        contentType: 'application/json',
                        headers: {
                            'Authorization': 'Bearer ' + token
                        }
                    }, function (err, httpResponse, result) {
                        console.log('bodyQuery', result)
                        if (result == 'Error: {"Error":"Nil amount"}') {
                            var response = {
                                isError: true,
                                transaction: 'Verification Failed : Incorrect data OR Transaction does not exist.',
                                errors: []
                            };
                            resolve(response);
                        } else {
                            var body = JSON.parse(body);
                            console.log('body in service-',body)
                            var response = {
                                isError: false,
                                transaction: body,
                                errors: []
                            };
                            resolve(response);
                        }
                    })
                }
            }
        })
    });

    return promise;
}

module.exports = {
    addAssetOnBlockchain,
    addOrderOnBlockchain,
    blockchainQuery,
    updateOnBlockchain,
    blockchainQueryOnTestServer
}