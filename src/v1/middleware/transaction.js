// const { ObjectId } = require('../models/asset');
const transtypeModel = require('../../../routes/v1/transactiontype/model');
const transactionService = require('../services/transactionServices');

//Update transaction type table with updated transactionAutoNumber to avoid concurrency
const validateAssetTransactionId = async (req, res, next) => {
    const validTransactionEntityData = await transactionService.getTransactionTypeData("transaction", req.body); // Add this function in transaction service
    console.log('validTransactionEntityData-------',validTransactionEntityData.transtypes)
    if (!validTransactionEntityData) {
        return req.app.responseHelper.send(res, false, {}, [{ "msg": "Invalid transactionid data." }], 500);
    }else{
        let transObj = {}
        let assetObj = {}
        const objectID = assetObj.transTypeId = validTransactionEntityData.transtypes._id;
        const autoNumber = (validTransactionEntityData.transtypes.transactionAutoNumber.replace(/\'/g, '').split(/(\d+)/).filter(Boolean)); 
        let incrementedNumber = parseInt(autoNumber[1]);
        let updatedAutoNumber = validTransactionEntityData.transtypes.transactionTypePrefix + ( parseInt(incrementedNumber) + parseInt(req.body.assets.length))
        
        transObj.transactionAutoNumber = updatedAutoNumber
        const updateTransType = await transtypeModel.updateTransactionAutoNumber(objectID, transObj);
        let recursiveFunction = await transactionService.recursiveData(validTransactionEntityData.transtypes, updatedAutoNumber, req.body.assets.length)
        const assetIdsArr = req.body.assets.map((elem,index) => {
            let assetID = recursiveFunction[index];
            const assetArrObj = elem
            assetArrObj.inputAssets = req.body.inputAssets;
            assetArrObj.assetId = assetID
            assetArrObj.assetType = validTransactionEntityData.transtypes.assetType;
            assetArrObj.provenance = validTransactionEntityData.transtypes.provenance;
            if(!validTransactionEntityData.corporates){
                assetArrObj.transactionid = assetArrObj.entityAsset = validTransactionEntityData.code+'.'+validTransactionEntityData.branches.code+'.'+assetID;            
            }else{
                assetArrObj.transactionid = assetArrObj.entityAsset = validTransactionEntityData.corporates.code+'.'+assetID;   
            }

            if(elem.geolocation.formattedAddress){
                assetArrObj.location = elem.geolocation.formattedAddress;
            }
            return assetArrObj;
        })
        req.validTransactionIdData = assetIdsArr;
        next();
       
    }
}

const validateOrderTransactionId = async (req, res, next) => {
    const validTransactionEntityData = await transactionService.validateTransactionData("transaction", req.body); // Add this function in transaction service
    if (!validTransactionEntityData) {
        return req.app.responseHelper.send(res, false, {}, [{ "msg": "Invalid transactionid data." }], 500);
    }else{
        const transObj = {}
        const objectID = validTransactionEntityData.transtypes._id;
        const autoNumber = (validTransactionEntityData.transtypes.transactionAutoNumber.replace(/\'/g, '').split(/(\d+)/).filter(Boolean)); 
        let incrementedNumber = parseInt(autoNumber[1]);
        let updatedAutoNumber = validTransactionEntityData.transtypes.transactionTypePrefix + (++incrementedNumber);
       
        transObj.transactionAutoNumber = updatedAutoNumber
        const updateTransType = await transtypeModel.updateTransactionAutoNumber(objectID, transObj);
        let recursiveFunction = await transactionService.recursiveData(validTransactionEntityData.transtypes, updatedAutoNumber, 1)
       // Order data
        var orderObj = req.body;
        if(orderObj.geolocation){
            orderObj.location = orderObj.geolocation.formattedAddress;
        }
        let orderID = updateTransType.transactionAutoNumber;
        orderObj.orderId = orderID;
        const transactionidResult = transactionService.generateTransactionid(req.user, validTransactionEntityData, orderID);
        let orderObject = { ...orderObj, ...transactionidResult};
        req.validTransactionIdData = orderObject;
        next();   
       
    }
}

const authenticateTransaction = async (req, res, next) => {
    middlewareData = {}
    req.body.corporateId = req.user.reference.corporateId;
    
    const validTransactionEntityData = await transactionService.validateTransactionData("transaction", req.body);
    if (!validTransactionEntityData) {
        console.log("Invalid transaction data.");
        return req.app.responseHelper.send(res, false, {}, [{ "msg": "Invalid transaction data." }], 500);
    }
    const validRef = await transactionService.validateTransactionData("ref", req.body);
    if (!validRef) {
        console.log("Invalid ref data.");
        return req.app.responseHelper.send(res, false, {}, [{ "msg": "Invalid ref data." }], 500);
    }
    middlewareData.validTransactionEntityData = validTransactionEntityData;
    middlewareData.validRef = validRef;
    req.transactionData = middlewareData;
    delete req.body.corporateId;
    next();
}

module.exports = {
    validateAssetTransactionId,
    validateOrderTransactionId,
    authenticateTransaction
}