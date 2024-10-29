const express = require('express');
var router = express.Router();
const Joi = require('@hapi/joi');
const _ = require('lodash');
const assetService = require('../services/assetService');
const eprAssetService = require('../services/eprAssetService');
const eprOrderService = require('../services/eprOrderService');
const orderService = require('../services/orderService');
const assetCategoryService = require('../services/assetCategoryService');
const { authenticateTransaction, validateOrderTransactionId } = require('../middleware/transaction');
const transactionService = require('../services/transactionServices');
const SUCCESSMSG = require("../lang/success");
const ERRORMSG = require("../lang/error");
const commonService = require("../services/commonService");
const assetTraceabilityModel= require("../../../routes/v1/assettracebility/model")
const constants = require("../lang/constant");
const assetprovenanceService = require('../services/assetprovenanceService');
const {addOrderOnBlockchain} = require('../services/bcsrc')
const { addNft } = require('../services/nftService');
const { transferNft } = require('../services/nftService');

router.get('/updateOrderNFT', async (req, res) => {
    console.log("req.query",req.query)
    const { error } = validateGetOrder(req.query);
    if (error) return req.app.responseHelper.send(res, false, {}, [{ "msg": error.details[0].message }], 500);
    const result = await orderService.updateOrderRecordNFT(req.query);
    console.log("order oute result",result);
    let responseObj = result;
    responseObj['message'] = SUCCESSMSG[4001];
console.log("responseObj:",responseObj);
    return req.app.responseHelper.send(res, true, responseObj, [], 200);
});


router.get('/updateTransferAdd', async (req, res) => {
    console.log("req.query",req.query)
    const { error } = validateGetOrderTransferAdd(req.query);
    if (error) return req.app.responseHelper.send(res, false, {}, [{ "msg": error.details[0].message }], 500);
    const result = await orderService.updateOrderRecordTransferAddress(req.query);
    console.log("order oute result",result);
    let responseObj = result;
    responseObj['message'] = SUCCESSMSG[4001];
console.log("responseObj:",responseObj);
    return req.app.responseHelper.send(res, true, responseObj, [], 200);
});

router.post('/add_order', authenticateTransaction, validateOrderTransactionId, async (req, res) => {
    if(!req.transactionData.validTransactionEntityData.transtypes.epr){
        const { error } = validateAddOrder(req.validTransactionIdData);
        if (error) return req.app.responseHelper.send(res, false, {}, [{ "msg": error.details[0].message}], 500);
    }    
    req.body.assetType = req.transactionData.validTransactionEntityData.transtypes.assetType;
    let payloadData = req.body;
    const transactionTypeResult = await transactionService.getTransTypeData(req.transactionData.validTransactionEntityData.transtypes);
    
    if((payloadData.orderDetails[0].referredAsset || payloadData.orderDetails[0].orderItems[0].accepted_quantity && req.transactionData.validTransactionEntityData.transtypes.assetType != undefined && !transactionTypeResult.assetWithoutReference)){
        req.body.assetType = req.transactionData.validTransactionEntityData.transtypes.assetType;
        const result = await orderService.addOrder(req.validTransactionIdData, req.transactionData.validTransactionEntityData.transtypes);
        req.validTransactionIdData.refOrderId = req.body.transactionid;
        const asset_res = await assetService.addAssetOnAssetType(req.validTransactionIdData);
        var responseObj = {
            'message': SUCCESSMSG[1001],
            result
        }
    }else if((!payloadData.orderDetails[0].referredAsset && !payloadData.orderDetails[0].referredOrder) || req.transactionData.validTransactionEntityData.transtypes.assetWithoutReference ){
        const result = await orderService.addOrder(req.validTransactionIdData, req.transactionData.validTransactionEntityData.transtypes);
        var responseObj = {
            'message': SUCCESSMSG[1001],
            result
        }
    }

    // if(req.body.assetType=='Consume Asset'){
    //     const statusUpdate= "Onsale";
    //     const resultUpdateAsset = await assetService.updateAssetFromProvenance(req.body,statusUpdate);
    // }
    // if(req.body.assetType=='Receive Asset'){
    //     const statusUpdate= "Sold";
    //     const resultUpdateAsset = await assetService.updateAssetFromProvenance(req.body,statusUpdate);
    // }
    
    

    if(payloadData.orderDetails[0].referredOrder && req.transactionData.validTransactionEntityData.transtypes.assetType){
        const updateresult = await orderService.updateOrderStatus(payloadData.orderDetails[0].orderItems, req.validTransactionIdData);
        const result = await orderService.addOrder(req.validTransactionIdData, req.transactionData.validTransactionEntityData.transtypes);
        var responseObj = {
            'message': SUCCESSMSG[1001],
            result
        }
    }
    // let responseObj = {
    //     'message': SUCCESSMSG[1001],
    //     result
    // }
    if(!payloadData.orderDetails[0].referredAsset && transactionTypeResult){
        if(transactionTypeResult.assetWithoutReference){
            const referredAssetResult = await assetService.receiveAsset(payloadData);
            // payloadData.orderDetails = referredAssetResult;
            // req.validTransactionIdData.orderId =  req.transactionData.validTransactionEntityData.transtypes.transactionAutoNumber;
            const result = await orderService.addOrder(req.validTransactionIdData, req.transactionData.validTransactionEntityData.transtypes);
                if(req.transactionData.validTransactionEntityData.transtypes.epr && req.transactionData.validTransactionEntityData.transtypes.eprReceive){
                    req.validTransactionIdData.orderDetails=referredAssetResult
                    const eprPayloadData = await transactionService.getEPROrderData(req.validTransactionIdData, req.user);
                   // eprPayloadData.transactionid = req.body.transactionid
                    const eprreferredAssetResult = await eprAssetService.eprreceiveAsset(eprPayloadData, req.transactionData.validTransactionEntityData.transtypes)
                }
                var responseObj = {
                    'message': SUCCESSMSG[1001],
                    result
                }
        }
          
        
    
    }

      // NFT transfer API call
    //   if(req.transactionData.validTransactionEntityData.transtypes.assetType=="Receive Asset"){
    //     for(let i = 0;i < responseObj.result.orderDetails[0].orderItems.length;i++){
    //         let promisesNft=[]
    //         //console.log("responseObj.result.orderDetails[0].orderItems[i].assetName",responseObj.result.orderDetails[0].orderItems[i])
    //         promisesNft.push(transferNft(responseObj.result.orderDetails[0].orderItems[i].order_item));
    //         //console.log("promisesNft",promisesNft)
    //         let resultsNft = await Promise.all(promisesNft);
    //         //console.log("resultsNft",resultsNft)
    //     }
    //   }
      
   
    if(responseObj.message =='Transaction added successfully.'){
        let promises=[]
        let fabricsetup = {
            username: req.user.email,
            orgName:  req.transactionData.validTransactionEntityData.fabricOrgId
        }
        for(let i = 0;i < responseObj.result.orderDetails[0].orderItems.length;i++){
            promises.push(addOrderOnBlockchain(responseObj.result, fabricsetup, responseObj.result.orderDetails[0].orderItems[i]));
        }
        var results = await Promise.all(promises);
    }
    return req.app.responseHelper.send(res, true, responseObj.result, [], 200);
})

router.get('/getTransTypeData', async (req, res) => {
    const { error } = validateGetTransType(req.query);
    if (error) return req.app.responseHelper.send(res, false, {}, [{ "msg": error.details[0].message }], 500);
    const result = await transactionService.getTransTypeData(req.query);
        let responseObj = result;
        responseObj['message'] = SUCCESSMSG[5003];
        return req.app.responseHelper.send(res, true, responseObj, [], 200);

})


router.get('/:orderObjectId', async (req, res) => {
    req.query.orderObjectId = req.params.orderObjectId;
    req.query.isCorporate = req.user.entity && req.user.entity.toLowerCase() == "corporate";
    const result = await orderService.getOrderFullDetails(req.query);
    if (!result) {
        return req.app.responseHelper.send(res, false, {}, [{ "msg": ERRORMSG[50001] }], 404);
    }
    let responseObj = result;
    responseObj['message'] = SUCCESSMSG[5002];

    return req.app.responseHelper.send(res, true, responseObj, [], 200);
});


router.get('/', async (req, res) => {
    const { error } = validateGetOrders(req.query);
    if (error) return req.app.responseHelper.send(res, false, {}, [{ "msg": error.details[0].message }], 500);
    req.query.isCorporate = req.user.entity && req.user.entity.toLowerCase() == "corporate";
    req.query.corporateId = req.user.reference.corporateId
    req.query.userEntityCode = req.user.reference.code
    const result = await orderService.getOrders(req.query, req.user);
    let responseObj = result;
    responseObj['message'] = SUCCESSMSG[5001];

    return req.app.responseHelper.send(res, true, responseObj, [], 200);
})

router.get('/orderapi/getPartnerOrders', async (req, res) => {
    const { error } = validateGetOrders(req.query);
    if (error) return req.app.responseHelper.send(res, false, {}, [{ "msg": error.details[0].message }], 500);
    // req.query.isCorporate = req.user.entity && req.user.entity.toLowerCase() == "corporate";
    // req.query.corporateId = req.user.reference.corporateId
    // req.query.userEntityCode = req.user.reference.code
    const result = await orderService.getPartnerOrders(req.query);
    let responseObj = result;
    responseObj['message'] = SUCCESSMSG[5001];

    return req.app.responseHelper.send(res, true, responseObj, [], 200);
})
// getTransTypeData


router.post('/assetTraceabilitySearch', async (req, res) => {
    const { error } = validatePostTraceability(req.body);
    if (error) return req.app.responseHelper.send(res, false, {}, [{ "msg": error.details[0].message }], 500);
    let result=[];
    if(req.body.fabricOrgId){
        const fabricsetup = {
            username: req.user.email,
            orgName:  req.body.fabricOrgId
        }
        const bcResult = await commonService.getTraceabilityBC(fabricsetup,req.body);
        let resultArr = await orderService.getTraceabilityDetails(req.body);
        if (resultArr==null || resultArr.length==0) {
            resultArr = await orderService.getTraceabilityDetailsAsset(req.body);  
        }
        result=[resultArr,bcResult];
    }else{
        console.log("req.body",req.body)
        result = await orderService.getTraceabilityDetails(req.body); 
        
    }
    let resultOrderWithoutAsset = await orderService.getTraceabilityDetailsOrder(req.body);
    if(resultOrderWithoutAsset!=null)
    result=result.concat(resultOrderWithoutAsset);
    console.log("result",result)
    if (result==null || result.length==0) {
        let resultAsset=[];
        resultAsset = await orderService.getTraceabilityDetailsAsset(req.body);  
       // console.log("resultAsset",resultAsset)
        if (resultAsset==null || resultAsset.length==0) {
            return req.app.responseHelper.send(res, false, {}, [{ "msg": ERRORMSG[40001] }], 404);
        }else{
            let responseObjAsset = resultAsset;
            responseObjAsset['message'] = SUCCESSMSG[4002];
            return req.app.responseHelper.send(res, true, responseObjAsset, [], 200);
        }
    }
    let responseObj = result;
    responseObj['message'] = SUCCESSMSG[4002];
    return req.app.responseHelper.send(res, true, responseObj, [], 200);
});

router.post('/provenance', async (req, res) => {
    const payLoadObjSetup={
        organizationId:req.body.organizationId
    }
    const assetTraceSetupDetails = await assetprovenanceService.getAssetProvenanceFullDetails(payLoadObjSetup);
    let filteredTransTypeSetupDetails;
    if(assetTraceSetupDetails!=null && assetTraceSetupDetails!=""){
        filteredTransTypeSetupDetails = assetTraceSetupDetails.assetProvenanceField.filter((e,i) => e.hasOwnProperty('label'))
    }
    const payLoad= await commonService.createPayload(req.body,assetTraceSetupDetails)
   console.log("payload:::",payLoad)
    const payLoadObj={
        assetCategory:payLoad.assetDetails.assetcategory._id
    }
    const assetCategoryServiceData = await assetCategoryService.getAssetCategoryDetails(payLoadObj);
    const assetCategoryName = assetCategoryServiceData[0].provenanceTemplatePath;
    if(assetCategoryName!=undefined){
        let result = await orderService.getTraceabilityDetails(payLoad);
        if (result==null || result.length==0) {
            result = await orderService.getTraceabilityDetailsAsset(payLoad); 
        }
        const bucketName="tracechain";
        const filePath= "provenance/"+assetCategoryName+"/";
        const keyName =  filePath+"index.html";
    
        const getS3Result= await commonService.getFileOnS3(bucketName,keyName)
        .then(data => {
        return data;
        })
        .catch(err => {
          //  console.error(err);
            return req.app.responseHelper.send(res, false, err, [{ "msg": ERRORMSG[40001] }], 404);
        });

        if(getS3Result!=undefined){
            var read_and_edit_me = Buffer.from(getS3Result.Body).toString();
            const awsPath= "https://tracechain.s3.ap-south-1.amazonaws.com/provenance/"+assetCategoryName;
            const updatedHtmlLayout = await commonService.replaceStrValues(read_and_edit_me,payLoad,awsPath,result,filteredTransTypeSetupDetails)  
            const buff = Buffer.from(updatedHtmlLayout, "utf-8");
            const uploadFileKey= filePath+payLoad.assetDetails.transactionid+".html";
            const contentType = "text/html";
            const getS3ResultFinal= await commonService.uploadFileOnS3(bucketName,uploadFileKey,buff, contentType)    
            .then(dataUploadFile => {
                // getS3Result.fileName = req.body.transactionId+".html";
                // var dataHtml = buff.toString('base64');
                // //getS3Result.neBlob = 'data:application/html;base64,' + dataHtml;
                // getS3Result.neBlob =dataHtml;
                return dataUploadFile;
            })
            .catch(err => {
             //   console.error(err)
                return req.app.responseHelper.send(res, false, {}, [{ "msg": ERRORMSG[40001] }], 404);
            })
             // NFT API call
            if(getS3ResultFinal!=undefined){
                //console.log("getS3ResultFinal............238",getS3ResultFinal)
                const hashValue = getS3ResultFinal.ETag.replace(/"/g, '');
                const nftPayload= {
                    assetName:payLoad.assetDetails.assetName,
                    assetQuantity:payLoad.assetDetails.assetQuantity,
                    assetUom:payLoad.assetDetails.assetUom,
                    assetID:payLoad.assetDetails.assetId,
                    transactionid:payLoad.assetDetails.transactionid,
                    expiryDate:payLoad.assetDetails.expiryDate,
                    effectiveDate:payLoad.assetDetails.effectiveDate,
                    Url:awsPath+"/"+payLoad.assetDetails.transactionid+".html",
                    hash:hashValue,
                    provenanceTemplatePath:payLoad.assetDetails.assetcategory.provenanceTemplatePath
                }
               // console.log("nftPayload",nftPayload)
                // console.log("PayloadDataabcd",payLoad.assetDetails.transactionid)
                // let nftData =await addNft(nftPayload);
                // console.log('nftData---',nftData)
                // if(nftData){
                //     var responseObj = {  
                //         'message': SUCCESSMSG[1001],
                //         "TxHash": nftData.nft.TxHash,
                //         "Contract_Address":nftData.nft.Contract_Address,    
                //         result,            
                //     }
                // }
                return req.app.responseHelper.send(res, true, nftPayload, [], 200);
            }
        }    
    }else{
        return req.app.responseHelper.send(res, false, {}, [{ "msg": ERRORMSG[40001] }], 404);
    }
    
});

router.post('/edit',  async(req, res) => {
    var payloadData = req.body
    
    const result = await orderService.updateOrderData(payloadData);
    if (!result) {
        let errors = [{
            "msg": "Something went wrong!"
        }];
        return req.app.responseHelper.send(res, false, errors, [], 500);
    }
    return req.app.responseHelper.send(res, true, {}, [], 200);
});

router.put('/revokeOrder', async (req, res) => {
    let payloadData =  req.body;
    payloadData.entity = req.user.reference.code
    payloadData.entityBranch = req.user.reference.branch
    const result = await orderService.findOrder(payloadData);
    if(result){
        var cancelResult = await orderService.cancelOrder(payloadData, result)
        if(cancelResult){
            let responseObj = {  
                'message': SUCCESSMSG[4004],
                result 
            }
            return req.app.responseHelper.send(res, true, responseObj, [], 200);
        }else{
            let responseObj = {  
                'message': ERRORMSG[105],
                result
            }
            return req.app.responseHelper.send(res, false, responseObj, [], 200);
        }
    }else{
        let responseObj = {  
            'message': ERRORMSG[50001],      
        }
        return req.app.responseHelper.send(res, false, responseObj, [], 200);
    }
});

router.put('/updateOrder', async (req, res) => {
    let payloadData =  req.body;
    payloadData.entity = req.user.reference.code
    payloadData.entityBranch = req.user.reference.branch
    const result = await orderService.findOrder(payloadData);
    if(result){
        var cancelResult = await orderService.updateOrder(payloadData, result)
        if(cancelResult && result.status == 'New' ){
            let responseObj = {  
                'message': SUCCESSMSG[4005],
                result 
            }
            return req.app.responseHelper.send(res, true, responseObj, [], 200);
        }else{
            let responseObj = {  
                'message': ERRORMSG[107],
                result
            }
            return req.app.responseHelper.send(res, false, responseObj, [], 200);
        }
    }else{
        let responseObj = {  
            'message': ERRORMSG[50001],      
        }
        return req.app.responseHelper.send(res, false, responseObj, [], 200);
    }
});



function validateAddOrder(payloadData) {
    const orderSchema = Joi.object().keys({
        referredAsset: Joi.boolean(),
        referredOrder: Joi.boolean(),
        orderItems: Joi.array()
    });
    const schema = {
        orderId: Joi.string().required(),
        transactionid: Joi.string().required(),
        refOrder: Joi.string(),
        organizationId: Joi.string().required(),
        moduleCode: Joi.string().required(),
        transtypeCode: Joi.string().required(),
        assetType: Joi.string(),
        transactionEntity: Joi.string().required(),
        transactionEntityBranch: Joi.string(),
        transactionEntityType: Joi.string().required().valid(['Organization', 'Partner']),
        refEntity: Joi.string().required(),
        refEntityBranch: Joi.string(),
        refEntityType: Joi.string().required().valid(['Organization', 'Partner']),
        orderDetails: Joi.array().items(orderSchema),
        location: Joi.string().allow(''),
        geolocation: Joi.object(),
        fields: Joi.object(),
        outside_docs: Joi.object(),
        upload_file: Joi.string(),
        upload_certificate: Joi.string(),
        status: Joi.string().required().valid(['New', 'Cancelled', 'Rejected', 'Closed']),
        creator_id: Joi.string(),
        modifier_id:  Joi.string(),
        created_by: Joi.string(),
        modified_by: Joi.string(),
        creator_role: Joi.string(),
        modifier_role: Joi.string(),
        trans_from_address: Joi.string().allow('')
    }
    return Joi.validate(payloadData, schema);
}

function validateGetOrders(payloadData) {
    const schema = {
        isPartner: Joi.string(),
        isRefEntity: Joi.string(),
        transactionEntity: Joi.string().allow(''),
        refEntity: Joi.string(),
        organizationId: Joi.string().required(),
        // entityCode: Joi.string().required(),
        entityType: Joi.string().valid(["transactionEntity", "refEntity", ""]),
        transactionTypeCode: Joi.string(),
        assetId: Joi.string().allow(''),
        orderId: Joi.string().allow(''),
        assetLocation: Joi.string(),
        status: Joi.string(),
        assetName: Joi.string().allow(''),
        refEntityName: Joi.string().allow(''),
        moduleId: Joi.string().allow(''),
        moduleName: Joi.string().allow(''),
        transactionTypeName: Joi.string().allow(''),
        transactionTypeCode: Joi.string().allow(''),
        branchLocation: Joi.string(),
        startIndex: Joi.string(),
        limit: Joi.string(),
        searchKey: Joi.string(),
        allFields: Joi.boolean(),
        outside_docs: Joi.object(),
        sortKey: Joi.string().allow(''),
        sortOrder: Joi.string().valid(["ASC", "DESC", ""]).insensitive(),
        isType: Joi.string().valid(["orderlist", ""]),
        refOrder: Joi.string().allow(''),
        statusFlag: Joi.string().allow(''),
        branchCode: Joi.string().allow(''),
        trxEntityBranchLocation: Joi.string(),
        nft_status: Joi.string()
    }
    return Joi.validate(payloadData, schema);
}

function validateGetTransType(payloadData) {
    const schema = {
        organizationId: Joi.string().required(),
        transactionTypeCode: Joi.string().required(),
        moduleId: Joi.string().allow(''),
    }
    return Joi.validate(payloadData, schema);
}

function validatePostTraceability(payloadData) {
    const schema = {
        inputAssetArr: Joi.array(),
        transactionCode: Joi.array(),
        organizationId: Joi.string().required(),
        fabricOrgId: Joi.string().allow(''),
        orderId:Joi.string().allow(''),
    }
    return Joi.validate(payloadData, schema);
}

function validateGetOrder(payloadData) {
    const schema = {
        transactionId: Joi.string(),
        nft_status: Joi.string(),
        lineno: Joi.string().allow(''),
        TransFrom_Address: Joi.string().allow('')        
    }
    return Joi.validate(payloadData, schema);
}

function validateGetOrderTransferAdd(payloadData) {
    const schema = {
        transactionId: Joi.string(),
        TransFrom_Address: Joi.string().allow('')        
    }
    return Joi.validate(payloadData, schema);
}

module.exports = router;