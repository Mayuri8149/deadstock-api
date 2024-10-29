var request = require('request');

var addAssetOnBlockchain = (transaction) => {
    var promise = new Promise((resolve, reject) => {
        if (process.env.NODE_ENV == 'production') {

        } else {
            addAssetOnBlockchainTestServer(transaction).then((result) => {
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

var addAssetOnBlockchainTestServer = (transaction) => {
    var promise = new Promise((resolve, reject) => {                    
                    request.post({
                            url: 'http://40.77.9.92:8080/tracechainbsn/api/insertassetrecords',
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },   
                            json: {      
                            "Status": "Active",
                            "Transaction": "tx",
                            //Use the below txnid in actual application
                            "TransactionID": transaction.transactionid,
                            // Id for test purposes
                            // "TransactionID": "7842.FP11017",
                            "TransactionEntity": transaction.transactionEntity,
                            "Branch": transaction.transactionEntityBranch,
                            "TransactionType": transaction.transtypeCode,
                            "PartnerEntity": transaction.refEntity,
                            "PartnerBranch": transaction.refEntityBranch,
                            "OrderID": "NA",
                            "AssetName": transaction.assetName,
                            "AssetLocation": transaction.location,
                            "AssetType": transaction.assetType,
                            "BalanceQty": transaction.assetQuantity,
                            "Qty": transaction.assetQuantity,
                            "UOM": transaction.assetUom,
                            "EffectiveDate": transaction.effectiveDate,
                            "ExpiryDate": transaction.expiryDate,
                            "ReferenceAsset": "NA",
                            "ReferenceOrder": "NA",
                            // "AllValues": "NA",
                            "AllValues":JSON.stringify(transaction.fields),
                            "Acknowledgement": transaction.entityAsset,
                            "AssetID": transaction.assetId,
                            "Module": transaction.moduleCode,
                            "FileHash": "NA",
                            "FilePath": "NA",
                            "InputAssetID": ""
                            // "InputAssetID": transaction.inputAssets
                        }      
                    }, (err, result) => {
                        if (result.body.statusCode == 200) {
                            var response = { isError: false, transaction: transaction, err: [] };
                            resolve(response);
                        } else {
                            var response = { isError: true, status: result.body.statusMessage, err: [{ 'msg': result.body.statusMessage }] };
                            resolve(response);
                        }
                    });
    });
    return promise;
}

var addOrderOnBlockchain = (transaction, ordersData) => {
    // console.log("ordersData from func----",ordersData)
    var promise = new Promise((resolve, reject) => {
        if (process.env.NODE_ENV == 'production') {

        } else {
            addOrderOnBlockchainTestServer(transaction, ordersData).then((result) => {
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

var addOrderOnBlockchainTestServer = (transaction, ordersData) => {

     var promise = new Promise((resolve, reject) => {                    
        request.post({
                url: 'http://40.77.9.92:8080/tracechainbsn/api/insertorderrecords',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },   
                json: {      
                "Status": "Active",
                "Transaction": "order",
                //Use the below txnid in actual application
                "TransactionID": transaction.transactionid.concat('.').concat(ordersData.line_number),
                "TransactionEntity": transaction.transactionEntity,
                "Branch": transaction.transactionEntitybranch,
                "TransactionType": transaction.transtypeCode,
                "PartnerEntity": transaction.refEntity,
                "PartnerBranch": transaction.refEntityBranch,
                "OrderID": transaction.orderId,
                // "AssetName": JSON.stringify(ordersData),
                "AssetName": ordersData.order_item,
                "AssetLocation": transaction.location,
                "AssetType": "NA",
                "BalanceQty": ordersData.order_quantity,
                "Qty": ordersData.order_quantity,
                "UOM": ordersData.order_uom,
                "EffectiveDate": "NA",
                "ExpiryDate": "NA",
                "ReferenceAsset": "NA",
                "ReferenceOrder": JSON.stringify(transaction.ref_order),
                // "AllValues": "NA",
                "AllValues":JSON.stringify(transaction.fields),
                "Acknowledgement": ordersData.entity_asset,
                "AssetID": "NA",
                "Module": transaction.moduleCode,
                "FileHash": "NA",
                "FilePath": "NA",
                "InputAssetID": ""
                // "InputAssetID": transaction.inputAssets
            }      
        }, (err, result) => {
            if (result.body.statusCode == 200) {
                // console.log('Success', result.body);
                var response = { isError: false, transaction: transaction, err: [] };
                resolve(response);
            } else {
                // console.log('Failed', result.body);
                var response = { isError: true, status: result.body.statusMessage, err: [{ 'msg': result.body.statusMessage }] };
                resolve(response);
            }
        });
});
return promise;   
}

var blockchainQuery = (transactionid) => {
    var promise = new Promise((resolve, reject) => {
        if (process.env.NODE_ENV == 'production') {

        } else {
            blockchainQueryOnTestServer(transactionid).then((result) => {
                if (!result.isError) {
                    let transaction = result.transaction.replace(/[\\]/g,'')
                    console.log("Transaction in src====", transaction)
                    var response = { isError: false, transaction: transaction, err: [] };
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

var blockchainQueryOnTestServer = (transactionid) => {
    var promise = new Promise((resolve, reject) => {
        request.post({
            url: 'http://40.77.9.92:8080/tracechainbsn/api/getassetforquery',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            json:{
                    "selector": {
                      "Acknowledgement": transactionid
                    }
            }
        }, (err, result) => {
                if (result.body.statusCode == 200) {
                    var response = { isError: false, transaction: result.body.entity, err: [] };
                    resolve(response);
                } else {
                    var response = { isError: true, status: result.body.statusMessage, err: [{ 'msg': result.body.statusMessage }] };
                    resolve(response);
                }
        })

    });

    return promise;
}

module.exports = {
    addAssetOnBlockchain,
    addOrderOnBlockchain,
    blockchainQuery
}