var request = require('request')
const moment = require('moment-timezone')

//Non-BSN Network
var addAssetOnBlockchain = (transaction,fabricsetup) => {
        var promise = new Promise((resolve, reject) => {
            if (process.env.NODE_ENV == 'production') {

            } else {
                addAssetOnBlockchainTestServer(transaction,fabricsetup).then((result) => {
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

        return promise
    }

//Non-BSN Network
var addAssetOnBlockchainTestServer = (transaction,fabricsetup) => {
    //console.log("transaction",transaction)
        var promise = new Promise((resolve, reject) => {
            request.post({
                url: global.config.tracechainBlockchainServer.userReg,
                dataType: 'json',
                contentType: 'application/x-www-form-urlencoded',
                form: {
                    username: fabricsetup.username,
                    orgName: fabricsetup.orgName
                }
            },(err, result)=>{
                if(result != undefined) {
                    var details = JSON.parse(result.body)
                    if(details.success) {
                        var token = details.token
                        // var allvalue = JSON.stringify(transaction.fields)
                       // console.log('transaction.fields--',transaction.fields)
                        var stringifiedParsedData = JSON.stringify(transaction.fields)                 
                        var objectData = stringifiedParsedData.replace(/\'/g, '"')
                        var fieldsObjectData = objectData.replace(/\"/g, "'") 
                        let timestamp = moment().tz("Asia/Kolkata").format('YYYY-MM-DD HH:mm:ss').toString().slice(0, 19).replace('T', ' ')
                        var formData = {
                            'peers': ['peer0.org1.example.com', 'peer0.org2.example.com'],
                            'fcn': 'InsertAssetRecords',
                            'args': ["{\"TransactionID\": \""+transaction.transactionid+"\",\"TransactionEntity\": \""+transaction.transactionEntity+"\",\"Branch\": \""+transaction.transactionEntityBranch+"\",\"module\" : \""+transaction.moduleCode+"\",\"TransactionType\": \""+transaction.transtypeCode+"\",\"PartnerEntity\": \""+transaction.refEntity+"\",\"PartnerBranch\": \""+transaction.refEntityBranch+"\",\"AssetID\": \""+transaction.assetId+"\",\"OrderID\": \"NA\",\"AssetName\": \""+transaction.assetName+"\",\"AssetLocation\": \""+transaction.location+"\",\"AssetType\": \""+transaction.assetType+"\",\"BalanceQty\": \""+transaction.assetQuantity+"\",\"Qty\": \""+transaction.assetQuantity+"\",\"UOM\": \""+transaction.assetUom+"\",\"EffectiveDate\": \""+transaction.effectiveDate+"\",\"ExpiryDate\": \""+transaction.expiryDate+"\",\"ReferenceAsset\": \"NA\",\"ReferenceOrder\": \"NA\",\"Status\":\"Active\",\"AllValues\": \""+fieldsObjectData+"\", \"Acknowledgement\": \""+transaction.entityAsset+"\",\"Transaction\": \"NA\",\"TimeStamp\": \""+timestamp+"\"}"
                            ]
                        }   
                        console.log("FormData.args========",formData.args)
                        request.post({
                            url: global.config.tracechainBlockchainServer.chaincodeUrl,
                            json: true,
                            traditional: true,
                            body: formData,
                            headers: {
                                'Authorization': 'Bearer ' + token
                            }
                        },(err, result)=>{
                            console.log("Result Body========", result.body)
                            if (!result.body.error) {
                                var response = { isError: false, transaction: result.body, err: [] };
                                resolve(response);
                            } else {
                                var response = { isError: true, status: result.body.statusMessage, err: [{ 'msg': result.body.statusMessage }] };
                                resolve(response);
                            }
                        })
                    }
                }
            })
        })
        return promise;
    }

//Non-BSN Network
var addOrderOnBlockchain = (transaction, fabricsetup, ordersData) => {
        // console.log("ordersData from func----",ordersData)
        var promise = new Promise((resolve, reject) => {
            if (process.env.NODE_ENV == 'production') {
    
            } else {
                addOrderOnBlockchainTestServer(transaction,fabricsetup, ordersData).then((result) => {
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

//Non-BSN Network
var addOrderOnBlockchainTestServer = (transaction,fabricsetup,ordersData) => {
   // console.log("transaction",transaction)
        var promise = new Promise((resolve, reject) => {
            request.post({
                url: global.config.tracechainBlockchainServer.userReg,
                dataType: 'json',
                contentType: 'application/x-www-form-urlencoded',
                form: {
                    username: fabricsetup.username,
                    orgName: fabricsetup.orgName
                }
            }, (err, result) => {
                if (result != undefined) {
                    var details = JSON.parse(result.body);
                    if (details.success) {
                        var token = details.token;
                       // console.log('transaction.fields--',transaction.fields)
                        var stringifiedParsedData = JSON.stringify(transaction.fields)                 
                        var objectData = stringifiedParsedData.replace(/\'/g, '"')
                        var fieldsObjectData = objectData.replace(/\"/g, "'")  
                        let timestamp = moment().tz("Asia/Kolkata").format('YYYY-MM-DD HH:mm:ss').toString().slice(0, 19).replace('T', ' ')
                        var formData = {
                            'peers': ['peer0.org1.example.com', 'peer0.org2.example.com'],
                            'fcn': 'InsertOrderRecords',
                            'args': [
                                "{\"TransactionID\": \""+transaction.transactionid.concat('.').concat(ordersData.line_number)+"\",\"TransactionEntity\": \""+transaction.transactionEntity+"\",\"Branch\": \""+transaction.transactionEntityBranch+"\",\"module\" : \""+transaction.moduleCode+"\",\"TransactionType\": \""+transaction.transtypeCode+"\",\"PartnerEntity\": \""+transaction.refEntity+"\",\"PartnerBranch\": \""+transaction.refEntityBranch+"\",\"AssetID\": \"NA\",\"OrderID\": \""+transaction.orderId+"\",\"AssetName\": \""+ordersData.order_item+"\",\"AssetLocation\": \""+transaction.location+"\",\"AssetType\": \"NA\",\"BalanceQty\": \""+ordersData.order_quantity+"\",\"Qty\": \""+ordersData.order_quantity+"\",\"UOM\": \""+ordersData.order_uom+"\",\"EffectiveDate\": \""+transaction.effectiveDate+"\",\"ExpiryDate\": \""+transaction.expiryDate+"\",\"ReferenceAsset\": \"NA\",\"ReferenceOrder\": \""+JSON.stringify(transaction.ref_order)+"\",\"Status\":\"Active\",\"AllValues\": \""+fieldsObjectData+"\", \"Acknowledgement\": \""+ordersData.entity_asset+"\",\"Transaction\": \"order\",\"TimeStamp\": \""+timestamp+"\"}"
                            ]
                        }
                        console.log("formData",formData)
                        request.post({
                            url: global.config.tracechainBlockchainServer.chaincodeUrl,
                            json: true,
                            traditional: true,
                            body: formData,
                            headers: {
                                'Authorization': 'Bearer ' + token
                            }
                        }, (err, result) => {
                            console.log('bodyOrder', result.body);
                            if (!result.body.error) {
                                var response = { isError: false, transaction: result.transaction, err: [] };
                                resolve(response);
                            } else {
                                var response = { isError: true, transaction: [], err: result.err };
                                resolve(response);
                            }
                        });
                    }
                }
            })
        });
        return promise;
    }

    var blockchainTraceability = (transactionid, fabricsetup) => {
        var promise = new Promise((resolve, reject) => {
            if (process.env.NODE_ENV == 'production') {
    
            } else {
                blockchainTraceabilityOnTestServer(transactionid, fabricsetup).then((result) => {
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
    
    var blockchainTraceabilityOnTestServer = (transactionid,fabricsetup) => {
        var promise = new Promise((resolve, reject) => {
            request.post({
                url: global.config.tracechainBlockchainServer.userReg,
                dataType: 'json',
                contentType: 'application/x-www-form-urlencoded',
                form: {
                    username: fabricsetup.username,
                    orgName: fabricsetup.orgName
                }
            }, (err, result) => {
            if (result != undefined) {
                var details = JSON.parse(result.body);
                if (details.success) {
                    var token = details.token;
                    // var transaction = transactionid
                    var formData = {
                        'peers': ['peer0.org1.example.com', 'peer0.org2.example.com'],
                        'fcn': 'GetAssetForQuery',
                        'args': [
                            `{\"selector\":{\"Acknowledgement\":\"${transactionid}\"}}`
                        ]
                    }
                    request.post({
                        url:global.config.tracechainBlockchainServer.chaincodeUrl,
                        json: true,
                        traditional: true,
                        body:formData,
                        headers: {
                            'Authorization': 'Bearer ' + token
                        }
                    }, function (err, result) {
                        // console.log('bodyQuery', result)
                        if (err) {
                            var response = {
                                isError: true,
                                transaction: 'Verification Failed : Incorrect data OR Transaction does not exist.',
                                errors: []
                            };
                            resolve(response);
                        } else {
                            var result = result.toJSON();
                           // console.log('body in service-',result.body)
                            var response = {
                                isError: false,
                                transaction: result.body,
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
    blockchainTraceability
}
