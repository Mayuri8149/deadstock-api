const { Asset, AssetInventory, EprAsset, EprAssetInventory, ObjectId } = require('../models/asset');
const constants = require("../lang/constant");
const commonService = require("../services/commonService");
const stateService = require('../services/stateService');
const aws = require("aws-sdk");
const fs = require("fs");
const dotenv = require("dotenv");
const pdf = require("html-pdf");
const ejs = require("ejs");
const base64 = require('base64topdf');
const multer = require("multer");

const addEPRAsset = async (payloadData) => {
   
    const stateValue = await stateService.getOneState(payloadData.geolocation.state)
    console.log('stateValue---',stateValue.stateCode)
    payloadData.state = stateValue.stateCode;
    payloadData.eprAssetType = 'Certificate';
    payloadData.created_on = payloadData.modified_on = new Date(Date.now());
    payloadData.is_deleted = false;

   const result = await EprAsset.findOneAndUpdate(
        {   eprTransactionid:payloadData.eprTransactionid },
        {
            $set: payloadData
        },
        { new: true, useFindAndModify: false, upsert: true }
    );
     
    const inventory_result = await updateEPRAssetInventory([result]);
    return result;
}

const eprreceiveAsset = async (payloadData, transactiontypeData) => {
    console.log('eprreceiveAsset--',payloadData)
    const inventoryArr = [];
    payloadData.assetWithoutReference = true;

    const stateValue = await stateService.getOneState(payloadData.geolocation.state)
    payloadData.state = stateValue.stateCode;
    console.log('payloadData.state--',payloadData.state)
    const multipleReceiveAssetData = payloadData.eprOrderDetails[0].orderEprItems.map((r) => {
    
        var multipleObj = {
        "organizationId":payloadData.organizationId,
        "eprConsume": transactiontypeData.eprConsume,
        "eprReceive": transactiontypeData.eprReceive,
        "eprAssetId": r.epr_ref_order+'.'+('000' + r.epr_line_number).substr(-3),
        // "eprEntityAsset": payloadData.eprTransactionid+'.'+r.epr_line_number,
        "moduleCode": payloadData.moduleCode,
        "transtypeCode": payloadData.transtypeCode,
        // "assetMfgDate": m.effectiveDate,
        // "assetExpiryDate": m.expiryDate,
        "eprAssetName": r.epr_order_item,
        "eprAssetUom": r.epr_order_uom,        
        "assetType" : constants[3],
        "eprAssetType" : constants[7],
        "eprAssetCategory": r.epr_asset_category,
        "location" : payloadData.location,
        "geolocation" : payloadData.geolocation,
        "state" : payloadData.state,
        "eprOrderId": payloadData.transactionid,
        "eprRefOrder": r.epr_ref_order_transactionid,
        "eprAssetQuantity": r.epr_accepted_quantity,
        "rejected_quantity": r.epr_rejected_quantity,
        // "transactionid": payloadData.refEntity+'.'+assetID,  
        "refEntity" : payloadData.refEntity, 
        "refEntityType": payloadData.refEntityType, 
        "refEntityBranch" : payloadData.refEntityBranch,   
        "transactionEntity" : payloadData.transactionEntity,
        "transactionEntityType": payloadData.transactionEntityType,
        "transactionEntityBranch": payloadData.transactionEntityBranch,
        "creator_id": payloadData.creator_id,"modifier_id" : payloadData.modifier_id, "created_by" : payloadData.created_by, "modified_by": payloadData.modified_by, "creator_role": payloadData.creator_role, "modifier_role": payloadData.modifier_role
        };

            if(payloadData.transactionEntityBranch){
                multipleObj.eprTransactionid = multipleObj.eprEntityAsset = payloadData.transactionEntity+'.'+payloadData.transactionEntityBranch+'.'+r.epr_ref_order+'.'+('000' + r.epr_line_number).substr(-3);
            }else{
                multipleObj.eprTransactionid = multipleObj.eprEntityAsset = payloadData.transactionEntity+'.'+r.epr_ref_order+'.'+('000' + r.epr_line_number).substr(-3);
            }  

        return multipleObj;
    })
        console.log('64----epr addMultipleAssets', multipleReceiveAssetData)
        const result = await addMultipleEprAssets(multipleReceiveAssetData);
}

const addMultipleEprAssets = async (payloadData) => {
    console.log('80--- epr---',payloadData)
    const result = await EprAsset.insertMany(
    payloadData
    );
    const multiplePayloadData = payloadData.map( (m) => {   
        var multipleObj = {
        "organizationId":m.organizationId,    
        "eprAssetId": m.eprAssetId,
        "eprAssetName": m.eprAssetName,
        "eprEntityAsset": m.eprEntityAsset,
        "eprAssetMfgDate": m.eprAssetMfgDate,
        "eprAssetExpiryDate": m.eprAssetExpiryDate,
        "eprAssetUom": m.eprAssetUom,        
        "eprTransactionid": m.eprTransactionid,
        "eprReceive" :m.eprReceive,      
        "eprConsume" :m.eprConsume,      
        };

        
        if(m.epr_rejected_quantity){
            console.log('93 rejected quantity condition---')
            multipleObj.entity = m.refEntity, 
            multipleObj.entityType = m.refEntityType, 
            multipleObj.entityBranch = m.refEntityBranch,
            multipleObj.eprAssetQuantity = m.epr_rejected_quantity
            multipleObj.eprAssetType = "Rejected"
        }
          
        if(payloadData.eprReceive || m.eprReceive){
            // multipleObj.eprEntityAsset = m.eprEntityAsset, 
            multipleObj.entity = m.transactionEntity 
            multipleObj.entityType = m.transactionEntityType
            multipleObj.entityBranch = m.transactionEntityBranch
            multipleObj.eprAssetQuantity = m.eprAssetQuantity
            multipleObj.eprAssetType = m.eprAssetType
        }
        else{
            multipleObj.entity = m.refEntity, 
            multipleObj.entityType = m.refEntityType, 
            multipleObj.entityBranch = m.refEntityBranch,
            multipleObj.eprAssetQuantity = m.eprAssetQuantity
            multipleObj.eprAssetType = m.eprAssetType    
        }
       
        return multipleObj;
    });  
    console.log('63-',multiplePayloadData)
    let arrays = [payloadData, multiplePayloadData]
    const updateArr = multiplePayloadData.map(arr => {
    const selectedAsset = payloadData.filter((element) => element.eprEntityAsset == arr.eprEntityAsset)
        arr = Object.assign({}, selectedAsset[0], arr);
        return arr;
    }); 
    console.log('70-payloadData.eprReceive---',payloadData.eprReceive, 'updateArr[0].eprReceive--',updateArr[0].eprReceive)
    if(payloadData.eprReceive || updateArr[0].eprReceive){
        console.log('72 epr--',payloadData)
        const inventory_result = await updateEPRAssetInventory(payloadData);
    }else{
        console.log('75 epr---else of receive asset---',updateArr)
        const inventory_result = await updateEPRAssetInventory(updateArr);
    }

return result;
}

const eprassetQuantity = async (payloadData) =>{    //Create Certificate
    console.log('84- eprassetQuantity',payloadData)
    let refEprAssetArr = [];
    let refAssetObj = { "refEprAssetId": payloadData.eprAssetId, "refEprTransactionid" : payloadData.eprTransactionid, "refEprEntityAsset" : payloadData.eprEntityAsset }
    refEprAssetArr.push(refAssetObj); 
    console.log('refEprAssetArr--',refEprAssetArr)
    if(payloadData.assetType == constants[2])
    payloadData.eprAssetQuantity = -(payloadData.eprAssetQuantity);
    else payloadData.eprAssetQuantity = payloadData.eprAssetQuantity;

    if(payloadData.inputEprAssets && payloadData.inputEprAssets.length != 0){
        console.log('90--------eprassetQuantity--')
        const assetPayloadData = payloadData.inputEprAssets.map(z => (z.inputEprAssetId))
        const assetDetails = await getEprAssetDetails(assetPayloadData, payloadData);    
        console.log('assetPayloadData----203--',assetPayloadData)
        console.log('payloadData----204-',payloadData)
        console.log('assetDetails----205--',assetDetails)
        const assetArray = assetDetails.map((y) => {
            const assetArrObj = { "eprAssetType": y.eprAssetType, "eprAssetCategory": y.eprAssetCategory, "eprAssetId": y.eprAssetId, "eprAssetName": y.eprAssetName, "eprAssetUom": y.eprAssetUom, "eprOrderId": payloadData.eprOrderId, "moduleCode": payloadData.moduleCode, "transtypeCode": payloadData.transtypeCode, "eprEntityAsset": y.eprEntityAsset, "assetType" : constants[2], "creator_id": payloadData.creator_id, "modifier_id" : payloadData.modifier_id, "created_by" : payloadData.created_by, "modified_by": payloadData.modified_by, "creator_role": payloadData.creator_role, "modifier_role": payloadData.modifier_role};

            if(payloadData.transactionEntityBranch){
                assetArrObj.eprTransactionid = payloadData.transactionEntity+'.'+payloadData.transactionEntityBranch+'.'+y.eprAssetId;                
            }else{
                assetArrObj.eprTransactionid = payloadData.transactionEntity+'.'+y.eprAssetId;
            }
            return assetArrObj;
        })
        const inputAssetArray = payloadData.inputEprAssets.map(x => (
            { "eprRefAsset" :refEprAssetArr , "eprAssetQuantity": - x.inputEprAssetQuantity, "eprEntityAsset": x.entity_epr_asset, "organizationId":payloadData.organizationId, "transactionEntityType": payloadData.transactionEntityType, "transactionEntityBranch" : payloadData.transactionEntityBranch, "transactionEntity" : payloadData.transactionEntity, "refEntityType" : payloadData.refEntityType , "refEntityBranch" : payloadData.refEntityBranch, "refEntity" : payloadData.refEntity }
            ))

        const merged = {};
        const arrays = [assetArray, inputAssetArray]
        arrays.forEach(arr => {
            arr.forEach(item => {
                merged[item["eprEntityAsset"]] = Object.assign({}, merged[item["eprEntityAsset"]], item);
            });
        });
        const assetArr = Object.values(merged);
        console.log('231--assetArray',assetArray)
        console.log('232--inputAssetArray',inputAssetArray)
        console.log('233--addMultipleEprAssets',assetArr)
        const result = await addMultipleEprAssets(assetArr);
    }

    return payloadData;
}

const getEprAssetDetails = async (assetPayloadData, payloadData) =>{
    console.log('EPR 91------',assetPayloadData,'---------------',payloadData)
    const conditionObj = { };
    conditionObj["eprTransactionid"] = { $in: assetPayloadData };
    // conditionObj["assetType"] = { $in: [constants[1], constants[3]] };
    // constants[1]
    conditionObj["eprAssetStatus"] = { $ne: "Revoked"};

    const aggregateArr = [
        {
            $match: conditionObj
        }
    ];    
    console.log('conditionObj---137--',conditionObj)
    let projectObj = {
        eprAssetCategory:1, 
        eprAssetType: 1,
        eprAssetName:1, 
        eprAssetId:1,
        eprAssetUom:1, moduleCode:1, transtypeCode:1, eprTransactionid:1, eprEntityAsset:1,
        eprAssetMfgDate:1, eprAssetExpiryDate:1
    };
    aggregateArr.push({ $project: projectObj });
    var result = await EprAsset.aggregate(aggregateArr);
    console.log('result-- 203 EPR asset--',result)
    return result;
}

const addEprAssetOnAssetType = async (payloadData) => {
    console.log('269 payloadData---',payloadData)
    const stateValue = await stateService.getOneState(payloadData.geolocation.state)
    payloadData.state = stateValue.stateCode;
    console.log('stateValue 285---',payloadData.state)

    // eprConsume
    if(payloadData.eprConsume)
    payloadData.eprAssetQuantity = -(payloadData.eprAssetQuantity);
    else payloadData.eprAssetQuantity = payloadData.eprAssetQuantity;

    console.log('EPR 115 --payload data--',payloadData)
    var orderedData = payloadData.eprOrderDetails[0].orderEprItems;
    var assetPayloadData = [];
    var assetRejectedQty = [];

    const orderEprItems = payloadData.eprOrderDetails[0].orderEprItems.map(z => (z.epr_entity_asset))

    const assetDetails = await getEprAssetDetails(orderEprItems, payloadData);
    console.log('222--assetDetails--',assetDetails)
    const assetArray = assetDetails.map((y) => {
    const assetArrObj = { "eprAssetType": y.eprAssetType, "eprOrderId": payloadData.refOrderId, "eprAssetId": y.eprAssetId,"moduleCode": y.moduleCode, "transtypeCode": y.transtypeCode, "eprAssetMfgDate": y.eprAssetMfgDate, "eprAssetExpiryDate": y.eprAssetExpiryDate};

    if(payloadData.transactionEntityBranch){
        assetArrObj.eprTransactionid = payloadData.transactionEntity+'.'+payloadData.transactionEntityBranch+'.'+y.epr_ordered_assetId;                
    }else{
        assetArrObj.eprTransactionid = payloadData.transactionEntity+'.'+y.epr_ordered_assetId;
    }
    return assetArrObj;
})

const inputAssetArray = payloadData.eprOrderDetails[0].orderEprItems.map((x) => {
    var inputAssetObj =
    { "state" : payloadData.state ,"eprAssetId": x.epr_ordered_assetId, "eprAssetName":x.epr_order_item , "eprAssetUom": x.epr_order_uom, "eprEntityAsset": x.epr_entity_asset,"eprRefOrder": x.epr_ref_order_transactionid,"eprAssetCategory": x.epr_asset_category, "organizationId":payloadData.organizationId, "moduleCode" : payloadData.moduleCode, "transtypeCode" : payloadData.transtypeCode, "transactionEntityType": payloadData.transactionEntityType, "transactionEntityBranch" : payloadData.transactionEntityBranch, "transactionEntity" : payloadData.transactionEntity, "refEntityType" : payloadData.refEntityType , "refEntityBranch" : payloadData.refEntityBranch, "refEntity" : payloadData.refEntity, "creator_id": payloadData.creator_id, "modifier_id" : payloadData.modifier_id, "created_by" : payloadData.created_by, "modified_by": payloadData.modified_by, "creator_role": payloadData.creator_role, "modifier_role": payloadData.modifier_role };

    if(payloadData.eprConsume){
        inputAssetObj.assetType = constants[2];
        inputAssetObj.eprAssetQuantity = - x.epr_order_quantity;
        inputAssetObj.eprConsume = payloadData.eprConsume;
        if(payloadData.transactionEntityBranch){
            inputAssetObj.eprTransactionid = payloadData.transactionEntity+'.'+payloadData.transactionEntityBranch+'.'+x.epr_ordered_assetId;                
        }else{
            inputAssetObj.eprTransactionid = payloadData.transactionEntity+'.'+x.epr_ordered_assetId;
        }
                
    }else if(payloadData.eprReceive){
        inputAssetObj.assetType = constants[3];
        inputAssetObj.eprReceive = payloadData.eprReceive;
        inputAssetObj.eprAssetQuantity = x.epr_accepted_quantity;
        inputAssetObj.rejected_quantity = x.epr_rejected_quantity;

        if(payloadData.transactionEntityBranch){
            inputAssetObj.eprTransactionid = payloadData.transactionEntity+'.'+payloadData.transactionEntityBranch+'.'+x.epr_ordered_assetId;                
        }else{
            inputAssetObj.eprTransactionid = payloadData.transactionEntity+'.'+x.epr_ordered_assetId;
        }
    }else{
        inputAssetObj.eprAssetQuantity = x.epr_order_quantity; 
        if(payloadData.transactionEntityBranch){
            inputAssetObj.eprTransactionid = payloadData.transactionEntity+'.'+payloadData.transactionEntityBranch+'.'+x.epr_ordered_assetId;                
        }else{
            inputAssetObj.eprTransactionid = payloadData.transactionEntity+'.'+x.epr_ordered_assetId;
        }
    }
        return inputAssetObj;
    });
    console.log('331-----inputAssetArray--',inputAssetArray)
    console.log('332-----assetArray--',assetArray)
    const addToInsert = inputAssetArray.map(arr => {
        const selectedAsset = assetArray.filter((element) => element.eprEntityAsset == arr.eprEntityAsset)
        arr = Object.assign({}, selectedAsset[0], arr);
        return arr;
    });     
    console.log('epr 146--',addToInsert)   
    const result = await addMultipleEprAssets(addToInsert);    
}

const updateEPRAssetInventory = async (assetPayloadData) =>{
    console.log('EPR assetPayloadData---',assetPayloadData)
    const inventoryArr = [];
    const payloadData = assetPayloadData.map( (m) => {   
        var inventoryObj = {
        "organizationId":m.organizationId,    
        "eprAssetId": m.eprAssetId,
        "eprEntityAsset": m.eprEntityAsset, 
        // "entityType": m.transactionEntityType, 
        // "entityBranch": m.transactionEntityBranch,
        "epreprAssetMfgDate": m.eprAssetMfgDate,
        "epreprAssetExpiryDate": m.eprAssetExpiryDate,
        "eprAssetUom": m.eprAssetUom,        
        };
        
        if(m.assetType == constants[1]){            
            inventoryObj.entity = m.transactionEntity
            inventoryObj.entityType = m.transactionEntityType
            inventoryObj.entityBranch = m.transactionEntityBranch
            inventoryObj.producedQuantity = m.eprAssetQuantity
            inventoryObj.consumedQuantity = 0
            inventoryObj.receivedQuantity = 0
            inventoryObj.rejectedQuantity = 0
            inventoryObj.balancedQuantity = m.eprAssetQuantity

            if(m.transactionEntityBranch){
                inventoryObj.eprTransactionid=  m.transactionEntity+'.'+m.transactionEntityBranch+'.'+m.eprAssetId;
            }else{
                inventoryObj.eprTransactionid=  m.transactionEntity+'.'+m.eprAssetId;
            } 
            inventoryArr.push(inventoryObj);   
        }


        if(m.eprConsume || m.assetType == constants[2]){
            inventoryObj.entity = m.transactionEntity
            inventoryObj.entityType = m.transactionEntityType
            inventoryObj.entityBranch = m.transactionEntityBranch
            inventoryObj.consumedQuantity = -m.eprAssetQuantity
            inventoryObj.producedQuantity = 0
            inventoryObj.receivedQuantity = 0
            inventoryObj.rejectedQuantity = 0
            inventoryObj.balancedQuantity = m.eprAssetQuantity

            if(m.transactionEntityBranch){
                inventoryObj.eprTransactionid=  m.transactionEntity+'.'+m.transactionEntityBranch+'.'+m.eprAssetId;
            }else{
                inventoryObj.eprTransactionid=  m.transactionEntity+'.'+m.eprAssetId;
            }
            inventoryArr.push(inventoryObj);
        }
        
        if(m.eprReceive){
            inventoryObj.entity = m.transactionEntity
            inventoryObj.entityType = m.transactionEntityType
            inventoryObj.entityBranch = m.transactionEntityBranch
            inventoryObj.receivedQuantity = m.eprAssetQuantity
            inventoryObj.rejectedQuantity = 0
            inventoryObj.consumedQuantity = 0
            inventoryObj.producedQuantity = 0
            inventoryObj.balancedQuantity = m.eprAssetQuantity
            if(m.transactionEntityBranch){
                inventoryObj.eprTransactionid=  m.transactionEntity+'.'+m.transactionEntityBranch+'.'+m.eprAssetId;
            }else{
                inventoryObj.eprTransactionid=  m.transactionEntity+'.'+m.eprAssetId;
            }
            console.log ("1 inventoryObj...........", inventoryObj);
            inventoryArr.push(inventoryObj);   

            if(m.epr_rejected_quantity != 0){
                let rejectedInventoryObj = Object.assign({},inventoryObj)
                rejectedInventoryObj.entity = m.refEntity
                rejectedInventoryObj.entityType = m.refEntityType
                rejectedInventoryObj.entityBranch = m.refEntityBranch
                rejectedInventoryObj.rejectedQuantity = m.rejected_quantity
                rejectedInventoryObj.consumedQuantity = 0
                rejectedInventoryObj.producedQuantity = 0
                rejectedInventoryObj.receivedQuantity = 0
                rejectedInventoryObj.balancedQuantity = 0
                if(m.refEntityBranch){
                    rejectedInventoryObj.eprTransactionid=  m.refEntity+'.'+m.refEntityBranch+'.'+m.eprAssetId;
                }else{
                    rejectedInventoryObj.eprTransactionid=  m.refEntity+'.'+m.eprAssetId;
                }
                inventoryArr.push(rejectedInventoryObj);   
            }            
        }       
    });
    console.log ("EPR update asset invent...............", inventoryArr);
    inventoryArr.forEach( async (item, index, arr) =>
    await updateAssetInventoryStocks(arr[index]));    
    
    return payloadData;
}

const updateAssetInventoryStocks = async (payloadData) => {
    console.log('updateAssetInventoryStocks---payloadData-----',payloadData)
    let conditionObj =  {   
        entity: payloadData.entity,
        eprAssetId: payloadData.eprAssetId,
        eprEntityAsset: payloadData.eprEntityAsset,
        organizationId:payloadData.organizationId,
        entityType: payloadData.entityType,
        eprTransactionid: payloadData.eprTransactionid
    };         
    
    let updateSet =    {};  
    if (payloadData.eprAssetUom) { updateSet.eprAssetUom = payloadData.eprAssetUom; }
    if (payloadData.eprAssetMfgDate) { updateSet.eprAssetMfgDate = payloadData.eprAssetMfgDate; }
    if (payloadData.eprAssetExpiryDate) { updateSet.eprAssetExpiryDate = payloadData.eprAssetExpiryDate; } 
    if (payloadData.entityBranch) { updateSet.entityBranch = payloadData.entityBranch; } 
   
    let result = {};
    result = await EprAssetInventory.findOneAndUpdate(conditionObj,
        {
            $inc: { balancedQuantity: payloadData.balancedQuantity,
                    producedQuantity: payloadData.producedQuantity,
                    receivedQuantity: payloadData.receivedQuantity,
                    consumedQuantity: payloadData.consumedQuantity,
                    rejectedQuantity: payloadData.rejectedQuantity, 
                },
            $set: updateSet
        },
        { new: true, useFindAndModify: false, upsert: true }
        );
        console.log('391 inventory--',result)
    return result;

}

const getEprEntityAssets =  async (payloadData) => {
    const conditionObj = {};

    if(payloadData.transactionEntity){
        conditionObj.entity = payloadData.transactionEntity
    }
    if(payloadData.transactionEntityBranch){
        conditionObj.entityBranch = payloadData.transactionEntityBranch
    }
    if(payloadData._id){
        conditionObj._id = ObjectId(payloadData._id)
    }
    if(payloadData.organizationId){
        conditionObj.organizationId = ObjectId(payloadData.organizationId)
    }
    
    if ("eprAssetName" in payloadData && payloadData.eprAssetName) {
        conditionObj["asset.eprAssetName"] = { $regex: payloadData.eprAssetName, $options: "i" } 
    }
    
    if ("eprAssetId" in payloadData && payloadData.eprAssetId) {
        conditionObj["eprAssetId"] = { $regex: payloadData.eprAssetId, $options: "i" } 
    }
    
    if ("transactionEntityName" in payloadData && payloadData.transactionEntityName) {
        conditionObj["transactionEntityName"] = { $regex: payloadData.transactionEntityName, $options: "i" } 
    }

    if ("assetLocation" in payloadData && payloadData.assetLocation) {
        conditionObj["asset.location"] = { $regex: payloadData.assetLocation, $options: "i" } 
    }
    
    if ("eprTransactionId" in payloadData && payloadData.eprTransactionId) {
        conditionObj["eprTransactionid"] = { $regex: payloadData.eprTransactionId, $options: "i" } 
    }
    
    if ("eprAssetCategory" in payloadData && payloadData.eprAssetCategory) {
        conditionObj["assetcategory.assetCategory"] = { $regex: payloadData.eprAssetCategory, $options: "i" } 
    }
    if ("partnerBranch" in payloadData && payloadData.partnerBranch) {
        conditionObj1["department.name"] = { $regex: payloadData.partnerBranch, $options: "i" } 
    }

    if ("inputAssetSearch_key" in payloadData && payloadData.inputAssetSearch_key) {
        conditionObj['$and'] = [{
            $or: [
                { 'asset.eprAssetName': { $regex: `${payloadData.inputAssetSearch_key}`, $options: "i" } },
                { 'eprAssetId': { $regex: `${payloadData.inputAssetSearch_key}`, $options: "i" } },
                { 'assetcategory.assetCategory': { $regex: `${payloadData.inputAssetSearch_key}`, $options: "i" } },
                { 'eprAssetUom': { $regex: `${payloadData.inputAssetSearch_key}`, $options: "i" } },
                { 'balancedQuantityString': { $regex: `${payloadData.inputAssetSearch_key}`, $options: "i" } },
            ]
        }]
    }
    
    let andObj = [                                            
        {
            "$expr":{
                "$eq":[
                    "$transactionEntity",
                    "$$transactionEntity"
                ]
            }
        },
        {
            "$expr":{
                "$eq":[
                    "$$transactionEntityBranch",
                    "$transactionEntityBranch"
                ]
            }
        },
        {
            "$expr":{
                "$eq":[
                    "$eprAssetType",
                    "$$eprAssetType"
                ]
            }
        },
        {
            "$expr":{
                "$eq":[
                    "$eprAssetId",
                    "$$eprAssetId"
                ]
            }
        },
        
    ];
    if(payloadData.payloadDate) {
        andObj.push({
            "$expr":{
                "$eq":[
                    { $dateToString: { format: "%m-%Y", date: "$created_on" } },
                    payloadData.payloadDate.toString()
                ]
            }
        });
    }
    if(payloadData.state) {
        andObj.push({
            "$expr":{
                "$eq":[
                    "$state",
                    "$$state"
                ]
            }
        });
    }
    if(payloadData.eprAssetCategoryId) {
        andObj.push({
            "$expr":{
                "$eq":[
                    "$eprAssetCategory",
                    "$$eprAssetCategory"
                    ]
                }
        });
    }
    if(payloadData.eprAssetId) {
        andObj.push({
            "$expr":{
                "$eq":[
                    "$eprAssetId",
                    "$$eprAssetId"
                ]
                        
            }
        });
    }
    const aggregateArr = []
    if(payloadData.getAllBalancedQuantity==true || payloadData.getAllBalancedQuantity=='true'){
        aggregateArr.push(
            {
                $lookup: {
                    from: "epr_assets",
                    let: { "eprTransactionid": "$eprTransactionid", "transactionEntity": "$entity","eprAssetId": "$eprAssetId"},
                    as: "asset",
                    pipeline: [
                        {
                            $match: {
                                $and: [
                                    { $expr: { $eq: ["$eprTransactionid", "$$eprTransactionid"] } },
                                    { $expr: { $eq: ["$$transactionEntity", "$transactionEntity"] } },
                                    { $expr: { $eq: ["$eprAssetId", "$$eprAssetId"] } }
                                ]
                            }
                        },
                        {
                            $sort:{
                                created_on:1
                            }
                        },
                        {
                            $limit:1
                        }
                    ]
                }
            },
            {
                $unwind: "$asset"
            }
        )
    }else{
        aggregateArr.push(
            {
                $lookup: {
                    from: "epr_assets",
                    as: "asset",
                    let: { "transactionEntity": "$entity", "transactionEntityBranch": "$entityBranch", "eprAssetId": "$eprAssetId","eprAssetType": payloadData.eprAssetType,"state":payloadData.state, "payloadDate": payloadData.payloadDate,"eprAssetCategory": ObjectId(payloadData.eprAssetCategoryId) },
                    pipeline: [
                        {
                            $addFields: {
                            "monthYear" : { $dateToString: { format: "%m-%Y", date: "$created_on" } },                
                            },
                    },
                    {                        
                        $match: {
                            "$and" : andObj
                        },
                    },
                    {
                        $sort:{
                            created_on:1
                        }
                    },
                    {
                        $limit:1
                    }
                ]
            }
        },
        {
            $unwind: "$asset"
        }
    )
}
    aggregateArr.push(
        {
            $addFields: {
                balancedQuantityString: { $toString: '$balancedQuantity' }  
            },
        },
        {
            $lookup: {
                from: "assetcategories",
                localField: "asset.eprAssetCategory",
                foreignField: "_id",
                as: "assetcategory",
            
            }
        },
        {
            $unwind:{
                "path": "$assetcategory",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            $lookup: {
                from: 'uoms',
                "let": { "eprAssetUom": "$eprAssetUom","orgId": "$organizationId" },
                as: "uom",
                pipeline: [
                    {
                        $match: {
                            $and: [
                                {$expr: { $eq: ['$$eprAssetUom', '$uom'] }},
                                {$expr: { $eq: ["$$orgId", "$organizationId"] }} ,
                                ]
                        }
                    },

                ]
            }
        },
        {
            $unwind:{
                "path": "$uom",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
        $match: conditionObj
        }
    )

    let sortKey = "eprAssetId";
    let sortOrder = -1;
    if("sortKey" in payloadData && "sortOrder" in payloadData && payloadData.sortKey && payloadData.sortOrder){
        sortKey = payloadData.sortKey;
        if( payloadData.sortKey == 'eprAssetName'){
            sortKey = "asset.eprAssetName"
        }
        if( payloadData.sortKey == 'assetLocation'){
            sortKey = "asset.location"
        }
        if( payloadData.sortKey == 'eprAssetCategory'){
            sortKey = "assetcategory.assetCategory"
        }
        if( payloadData.sortKey == 'partnerBranch'){
            sortKey = "department.name"
        }
        sortOrder = payloadData.sortOrder && payloadData.sortOrder.toLowerCase() == "desc" ? -1 : 1;
    }
    aggregateArr.push({ $sort: {
        [sortKey]: sortOrder
    } });

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
    const assetDetails = await EprAssetInventory.aggregate(aggregateArr);
    const responseObj = {
        'result': assetDetails[0]['paginatedResults'],
        'totalCount': assetDetails[0]['totalCount'] && assetDetails[0]['totalCount'].length ? assetDetails[0]['totalCount'][0]['count'] : 0
    };
    return responseObj;
}

const getEPRAssetFullDetails = async (payloadData) => {
    const conditionObj = {
        _id: ObjectId(payloadData.assetObjectId)
    }

    const aggregateArr = [
        {
            $match: conditionObj
        },
        {
            $addFields: {
            'inputEprAssetsSum': {                    
                total: { $sum:"$inputEprAssets.inputEprAssetQuantity" },
                },
            } , 
        },
        {
            $unwind: {
                "path": "$inputEprAssets",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            $lookup: {
                from: 'uoms',
                "let": { "assetUom": "$inputEprAssets.inputEprAssetUom","orgId": "$organizationId" },
                as: "inputEprAssets.assetUom_details",
                pipeline: [
                    {
                        $match: {
                            $and: [
                                {$expr: { $eq: ['$$assetUom', '$uom'] }},
                                {$expr: { $eq: ["$$orgId", "$organizationId"] }} ,
                                ]
                        }
                    },

                ]
            }
        },
        {
            $lookup: {
                from: 'epr_assets',
                "let": { "inputEprAssetId": "$inputEprAssets.entity_epr_asset" },
                as: "inputEprAssets.inputEprAssets_details",
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$$inputEprAssetId', '$eprEntityAsset'] }
                        }
                    },
                    {
                        $group: {
                            _id:"$eprEntityAsset",
                            assetName:{$first:"$eprAssetName"},
                            refEntity:{$first:"$refEntity"},
                            assetCategory:{$first:"$eprAssetCategory"},
                            created_on: {$first:"$created_on"}
                        }
                    },
                    {
                        $lookup: {
                            from: 'corporates',
                            "let": { "refEntity": "$refEntity" },
                            as: "corporate_refEntityDetails",
                            pipeline: [
                                {
                                    $match: {
                                        $expr: { $and: [{ $eq: ['$$refEntity', '$code'] }] }
                                    }
                                },
                                {
                                    $group: {
                                        _id:"$code",
                                        companyName:{$first:"$companyName"},
                                    }
                                },            
                            ]
                        }
                    },
                    {
                        $lookup: {
                            from: "assetcategories",
                            "let": { "assetCategory": "$assetCategory" },
                            as: "assetCategoryDetails",
                            pipeline: [
                                {
                                    $match: {
                                        $expr: { $and: [{ $eq: ['$$assetCategory', '$_id'] }] }
                                    }
                                },
                                {
                                    $group: {
                                        _id:"$_id",
                                        assetCategory:{$first:"$assetCategory"},
                                    }
                                },
                            ]
                        }
                    },
                   
                    ////////////////////////////////////////////////////////////////////////////////////////
                    {
                        $lookup: {
                            from: 'organizations',
                            "let": { "refEntity": "$refEntity" },
                            as: "organization_refEntityDetails",
                            pipeline: [
                                {
                                    $match: {
                                        $expr: { $and: [{ $eq: ['$$refEntity', '$code'] }] }
                                    }
                                },
                                {
                                    $group: {
                                        _id:"$code",
                                        name:{$first:"$name"},
                                    }
                                },            
                            ]
                        }
                    },

                    //////////////////////////////////////////////////////////////////////////////
                ]
            }
        },
        
        {
            $lookup: {
                from: "modules",
                as: "modules",
                let: { "orgId": "$organizationId", "moduleCode": "$moduleCode" },
                pipeline: [
                    {
                        $match: {
                            $and: [
                                { $expr: { $eq: ["$organizationId", "$$orgId"] } },
                                // { $expr: { $eq: ["$_id", "$$moduleId"] } },
                                { $expr: { $eq: ["$code", "$$moduleCode"] } },
                                { $expr: { $eq: ["$is_deleted", false] } },
                            ]
                        }
                    },
                    {
                        $project: {
                            organizationId: 1,
                            departmentId: 1,
                            code: 1,
                            name: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: {
                "path": "$modules",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            $lookup: {
                from: 'organizations',
                "let": { "otransactionEntity": "$transactionEntity", "orefEntity": "$refEntity" },
                as: "organizations_details",
                pipeline: [
                    {
                        $match: {
                            $expr: { $or: [{ $eq: ['$$otransactionEntity', '$code'] }, { $eq: ['$$orefEntity', '$code'] }] }
                        }
                    },

                ]
            }
        },
        {
            $lookup: {
                from: 'departments',
                "let": { "transactionEntityBranch": "$transactionEntityBranch", "refEntityBranch": "$refEntityBranch" },
                as: "branch",
                pipeline: [
                    {
                        $match: {
                            $expr: { $or: [{ $eq: ['$$transactionEntityBranch', '$code'] }, { $eq: ['$$refEntityBranch', '$code'] }] }
                        }
                    },

                ]
            }
        },
        {
            $unwind: {
                "path": "$branch",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            $lookup: {
                from: 'corporates',
                "let": { "ctransactionEntity": "$transactionEntity", "crefEntity": "$refEntity" },
                as: "corporates_details",
                pipeline: [
                    {
                        $match: {
                            $expr: { $or: [{ $eq: ['$$ctransactionEntity', '$code'] }, { $eq: ['$$crefEntity', '$code'] }] }
                        }
                    },

                ]
            }
        },
        {
            $lookup: {
                from: "transtypes",
                as: "transtype",
                let: { "transtypeCode": "$transtypeCode", "moduleId": "$modules._id", "organizationId": "$organizationId" },
                pipeline: [
                    {
                        $match: {
                            $and: [
                                { $expr: { $eq: ["$transactionTypeCode", "$$transtypeCode"] } },
                                { $expr: { $eq: ["$moduleId", "$$moduleId"] } },
                                { $expr: { $eq: ["$organizationId", "$$organizationId"] } },
                                { $expr: { $eq: ["$is_deleted", false] } },
    
                            ]
                        }
                    }
                ]
            }
        },
        {
            $unwind:
            {
                "path": "$transtype",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            $lookup: {
                from: "assetcategories",
                localField: "eprAssetCategory",
                foreignField: "_id",
                as: "eprAssetCategory",
               
            }
        },
        {
            $unwind:{
                "path": "$eprAssetCategory",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            $addFields: {
                allEntityTypes: {
                    $concatArrays: ["$organizations_details", "$corporates_details"]
                }
            }
        },
        {
            $addFields: {
                //'organizations_details': 0,
                //'corporates_details': 0,
                'transactionEntityDetails': {
                    $filter: {
                        input: "$allEntityTypes",
                        as: "item",
                        cond: { $eq: ["$$item.code", "$transactionEntity"] }
                    }
                },
                'refEntityDetails': {
                    $filter: {
                        input: "$allEntityTypes",
                        as: "item",
                        cond: { $eq: ["$$item.code", "$refEntity"] }
                    }
                }
            }
        },
        {
            $project: {
                allEntityTypes: 0,
                'organizations_details': 0,
                'corporates_details': 0,
            }
        },
        {
            $unwind: {
                "path": "$transactionEntityDetails",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            $unwind: {
                "path": "$refEntityDetails",
                "preserveNullAndEmptyArrays": true
            },
    
        },
        {
            $lookup: {
                from: 'uoms',
                "let": { "eprAssetUom": "$eprAssetUom","orgId": "$organizationId" },
                as: "uom",
                pipeline: [
                    {
                        $match: {
                            $and: [
                                {$expr: { $eq: ['$$eprAssetUom', '$uom'] }},
                                {$expr: { $eq: ["$$orgId", "$organizationId"] }} ,
                                ]
                        }
                    },

                ]
            }
        },
        {
            $unwind:{
                "path": "$uom",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            $group: { 
                _id:
        { certificateNumber : "$certificateNumber", eprAssetId:"$eprAssetId",eprAssetName:"$eprAssetName",eprAssetQuantity:"$eprAssetQuantity",
            assetType:"$assetType",eprAssetUom:"$eprAssetUom",eprAssetMfgDate:"$eprAssetMfgDate",eprAssetExpiryDate:"$eprAssetExpiryDate",
            is_deleted:"$is_deleted",provenance:"$provenance",eprAssetCategory:"$eprAssetCategory",
             fields:"$fields",eprEntityAsset:"$eprEntityAsset",
                        location: "$location", organizationId:"$organizationId", refEntity:"$refEntity",
                        refEntityBranch: "$refEntityBranch", refEntityType: "$refEntityType", status:"$status",transactionEntity:"$transactionEntity",
                         transactionEntityBranch:"$transactionEntityBranch",  uom:"$uom",
                         transactionEntityType: "$transactionEntityType",
                          transtypeCode: "$transtypeCode", "created_by": "$created_by",
                          "created_on":"$created_on", creator_role:"$creator_role", modified_by: "$modified_by",
                          modified_on: "$modified_on","modifier_role":"$modifier_role",
                          moduleCode: "$moduleCode", upload_file: "$upload_file", upload_certificate:"$upload_certificate", branch:"$branch",
                           "refbranch":"$refbranch", transtype:"$transtype",refOrder:"$refOrder",orderId:"$orderId",
                             transactionEntityDetails: "$transactionEntityDetails",
                             inputEprAssetsSum : "$inputEprAssetsSum",outside_docs: "$outside_docs",
                             refEntityDetails: "$refEntityDetails",modules:"$modules",eprTransactionid: "$eprTransactionid",state: "$state",
                        },
                        inputEprAssets: {$addToSet:"$inputEprAssets"}
            }
        }
    ];
    const result = await EprAsset.aggregate(aggregateArr);
    // console.log('res--- 123--', JSON.stringify(result[0]))

    return result && result.length ? result[0] : null;
}


const eprPrint = async (asset) => { 
    const certificateNumber = asset._id.certificateNumber;
    const bucketName="eprcertificate";
    const keyName =  'certificate.ejs';
    
    const getS3Result= await commonService.getFileOnS3(bucketName,keyName)
        .then(data => {
        return data;
        })
        .catch(err => {
            console.error(err);
            return req.app.responseHelper.send(res, false, err, [{ "msg": ERRORMSG[40001] }], 404);
        });
    
        if(getS3Result!=undefined){
            var read_and_edit_me = Buffer.from(getS3Result.Body).toString();
            console.log("1 asset----",asset.inputEprAssets)
            console.log("asset inputEprAssetsSum----",asset._id.inputEprAssetsSum.total)
            const client_name = asset._id.refEntityDetails.name ? asset._id.refEntityDetails.name : asset._id.refEntityDetails.companyName;
            const createdDate = new Date(asset._id.created_on);
            const createdyear = createdDate.getFullYear();
            const createdyearPlus = createdDate.getFullYear()+1
            const createdyearMinus = createdDate.getFullYear()-1
            const longmonthname = createdDate.toLocaleString('default', { month: 'long' });
            const shortmonthname = createdDate.toLocaleString('default', { month: 'short' });
            const longFinancialYear = "April "+createdyearMinus +"- March "+createdyear;
            const shortFinancialYear = createdyearMinus+"-"+createdyear;

            const certificateName = asset._id.certificateNumber.split('.').slice(0, -1).join('.');

            read_and_edit_me = ejs.render(read_and_edit_me, {
                client: {
                    "clientname": client_name,
                    "category": asset._id.eprAssetCategory.assetCategory,
                    "address": asset._id.location,
                    "financialyear": longFinancialYear,
                    "period": "Quarter 4",
                    "month" : longmonthname+' ' +createdyear,
                    "state" : asset._id.state,
                    "waste_stream" : asset._id.eprAssetName,
                    "total_quantity" : asset._id.inputEprAssetsSum.total,
                    "quantity_allocation": asset._id.eprAssetQuantity,
                    // "regno" : "29518",
                    "certificate_number":"EPR/"+client_name+"/"+asset._id.state+"/"+shortmonthname+"/"+asset._id.certificateNumber.split('.').slice(0, -1).join('.')+"/"+shortFinancialYear,
                    "issued_date" : asset._id.created_on.toISOString().substring(0, 10),
                    // "timep":"Akshay",
                    // "logo": "",                        
                    "monthlyDetails" : asset.inputEprAssets
        
                    }
            });

           const buff = Buffer.from(read_and_edit_me);
           const contentType = "pdf";
           commonService.uploadFileOnS3(bucketName,certificateNumber,buff,contentType)    
            .then(dataUploadFile => {
               return certificateNumber;
            })
            .catch(err => {
                console.error(err)
                return certificateNumber;
            })
        }
  }

  const geteprAssets = async (payloadData) => {
  const conditionObj = {}
  const conditionObj1 ={}

  if(payloadData.transactionEntity){
      conditionObj.transactionEntity = payloadData.transactionEntity
  }
  if(payloadData.transactionid){
      conditionObj.eprTransactionid = payloadData.transactionid
  }
  if(payloadData.transactionTypeCode){
      conditionObj.transtypeCode = payloadData.transactionTypeCode
  }

  if ("statusFlag" in payloadData && payloadData.statusFlag) {
    conditionObj["status"] = { $ne:payloadData.statusFlag};
  }

  if(payloadData.inputAssetFlag){
    conditionObj.assetType = "Produce Asset"
}
  
  if ("assetType" in payloadData && payloadData.assetType && payloadData.assetType.length) {
      const assetTypeArr = payloadData.assetType.map((e) => RegExp(`${e}`, 'i'));
      conditionObj["assetType"] = { $in: assetTypeArr };
  }

  if ("eprAssetName" in payloadData && payloadData.eprAssetName) {
      conditionObj["eprAssetName"] = { $regex: payloadData.eprAssetName, $options: "i" } 
  }
  if ("eprAssetId" in payloadData && payloadData.eprAssetId) {
      conditionObj["eprAssetId"] = { $regex: payloadData.eprAssetId, $options: "i" } 
  }
  if ("moduleId" in payloadData && payloadData.moduleId) {
      conditionObj["moduleCode"] = { $regex: payloadData.moduleId, $options: "i" } 
  }
  if ("moduleName" in payloadData && payloadData.moduleName) {
      conditionObj1["module.name"] = { $regex: payloadData.moduleName, $options: "i" } 
  }
  if ("transactionTypeName" in payloadData && payloadData.transactionTypeName) {
      conditionObj1["transtype.transactionTypeName"] = { $regex: payloadData.transactionTypeName, $options: "i" } 
  }
  if ("transactionTypeCode" in payloadData && payloadData.transactionTypeCode) {
      conditionObj["transtypeCode"] = { $regex: payloadData.transactionTypeCode, $options: "i" } 
  }
  if ("assetLocation" in payloadData && payloadData.assetLocation) {
      conditionObj["location"] = { $regex: payloadData.assetLocation, $options: "i" } 
  }
  if ("eprTransactionId" in payloadData && payloadData.eprTransactionId) {
      conditionObj1["eprTransactionid"] = { $regex: payloadData.eprTransactionId, $options: "i" } 
  }
  if ("status" in payloadData && payloadData.status) {
      conditionObj["customstatus"] = { $regex: payloadData.status, $options: "i" } 
  }
  if ("eprAssetCategory" in payloadData && payloadData.eprAssetCategory) {
      conditionObj1["eprAssetcategory.assetCategory"] = { $regex: payloadData.eprAssetCategory, $options: "i" } 
  }
  if ("refEntityName" in payloadData && payloadData.refEntityName) {
      conditionObj1["$or"] = [
          { "refEntityDetails.companyName": { $regex: payloadData.refEntityName, $options: "i" } },
          { "refEntityDetails.name": { $regex: payloadData.refEntityName, $options: "i" } },
         ]
  }
  if ("branchLocation" in payloadData && payloadData.branchLocation) {
      conditionObj1["$or"] = [
          { "department.code": { $regex: payloadData.branchLocation, $options: "i" } },
          { "department.name": { $regex: payloadData.branchLocation, $options: "i" } },
          { "transactionEntityDetails.location": { $regex: payloadData.branchLocation, $options: "i" } },
          { "refEntityDetails.location": { $regex: payloadData.branchLocation, $options: "i" } }
      ] 
  }
 
  const aggregateArr = [
      {
          $addFields:{
              "customstatus": {
                  "$switch": {
                    "branches": [
                      { "case": { "$eq": [ "$status", "New" ] }, "then": "Open" },
                      { "case": { "$ne": [ "$status", "New" ] }, "then": "Closed" }
                    ]
                  }
                }
          }
      },
      {
          $match: conditionObj
      },
      {
          $lookup: {
              from: "assetcategories",
              localField: "eprAssetCategory",
              foreignField: "_id",
              as: "eprAssetcategory",
             
          }
      },
      {
          "$unwind":{
             "path":"$eprAssetcategory",
             "preserveNullAndEmptyArrays":true
          }
       },
       {
          "$lookup":{
             "from":"modules",
             "as":"module",
             "let":{
                "moduleCode":"$moduleCode",
                "organizationId":"$organizationId"
             },
             "pipeline":[
                {
                   "$match":{
                      "$and":[
                         {
                            "$expr":{
                               "$eq":[
                                  "$code",
                                  "$$moduleCode"
                               ]
                            }
                         },
                         {
                            "$expr":{
                               "$eq":[
                                  "$organizationId",
                                  "$$organizationId"
                               ]
                            }
                         },
                         {
                            "$expr":{
                               "$eq":[
                                  "$is_deleted",
                                  false
                               ]
                            }
                         }
                      ]
                   }
                }
             ]
          }
       },
       {
          "$unwind":{
             "path":"$module",
             "preserveNullAndEmptyArrays":true
          }
       },

      {
          "$lookup":{
             "from":"organizations",
             "let":{
                "transactionEntity":"$transactionEntity",
               // "refEntity":"$refEntity"
             },
             "as":"organizations_details",
             "pipeline":[
                {
                   "$match":{
                      "$expr":{
                         "$and":[
                            {
                               "$eq":[
                                  "$$transactionEntity",
                                  "$code"
                               ]
                            },
                            // {
                            //   "$eq":[
                            //       "$$refEntity",
                            //       "$code"
                            //   ]
                            // }
                         ]
                      }
                   }
                }
             ]
          }
       },
       {
          "$lookup":{
             "from":"organizations",
             "let":{
                //"transactionEntity":"$transactionEntity",
                "refEntity":"$refEntity"
             },
             "as":"reforganizations_details",
             "pipeline":[
                {
                   "$match":{
                      "$expr":{
                         "$and":[
                            // {
                            //   "$eq":[
                            //       "$$transactionEntity",
                            //       "$code"
                            //   ]
                            // },
                            {
                              "$eq":[
                                  "$$refEntity",
                                  "$code"
                              ]
                            }
                         ]
                      }
                   }
                }
             ]
          }
       },
       {
          "$lookup":{
             "from":"corporates",
             "let":{
                "ctransactionEntity":"$transactionEntity",
               // "crefEntity":"$refEntity"
             },
             "as":"corporates_details",
             "pipeline":[
                {
                   "$match":{
                      "$expr":{
                         "$and":[
                            {
                               "$eq":[
                                  "$$ctransactionEntity",
                                  "$code"
                               ]
                            }
                            // {
                            //   "$eq":[
                            //       "$$crefEntity",
                            //       "$code"
                            //   ]
                            // }
                         ]
                      }
                   }
                }
             ]
          }
       },
       {
          "$lookup":{
             "from":"corporates",
             "let":{
                //"ctransactionEntity":"$transactionEntity",
                "crefEntity":"$refEntity"
             },
             "as":"refcorporates_details",
             "pipeline":[
                {
                   "$match":{
                      "$expr":{
                         "$and":[
                            // {
                            //   "$eq":[
                            //       "$$ctransactionEntity",
                            //       "$code"
                            //   ]
                            // },
                            {
                              "$eq":[
                                  "$$crefEntity",
                                  "$code"
                              ]
                            }
                         ]
                      }
                   }
                }
             ]
          }
       },
  {
      "$lookup":{
         "from":"departments",
         "let":{
            "transactionEntityBranch":"$transactionEntityBranch",
            "organizationId": "$organizationId" 
         },
         "as":"department",
         "pipeline":[
            {
              "$match":{
                  "$expr":{
                     "$and":[
                        {
                          "$eq":[
                              "$$transactionEntityBranch",
                              "$code"
                          ]
                        },
                        {$eq: ["$organizationId", "$$organizationId"] }
                     ]
                  }
              }
            }
         ]
      }
  },
  {
      "$unwind":{
         "path":"$department",
         "preserveNullAndEmptyArrays":true
      }
  },
  {
    $lookup: {
        from: 'departments',
        "let": { "refEntityBranch": "$refEntityBranch","organizationId": "$organizationId" },
        as: "refbranch",
        pipeline: [
            {
                $match: {
                    $and: [
                    {$expr: { $eq: ['$$refEntityBranch', '$code']  }},
                    {$expr: { $eq: ["$organizationId", "$$organizationId"] }}
                    ]
                }
            }

        ]
    }
},
{
    $unwind: {
        "path": "$refbranch",
        "preserveNullAndEmptyArrays": true
    }
},
    
      {
          "$addFields":{
             "allEntityTypes":{
                "$concatArrays":[
                  "$organizations_details",
                  "$corporates_details",
                  //"$refcorporates_details",
                  //"$reforganizations_details"
                ]
             },
             "allRefEntityTypes":{
                "$concatArrays":[
                  "$refcorporates_details",
                  "$reforganizations_details"
                ]
             },
             
          }
      },
      {
          "$addFields":{
             "transactionEntityDetails":{
                "$filter":{
                  "input":"$allEntityTypes",
                  "as":"item",
                  "cond":{
                      "$eq":[
                         "$$item.code",
                         "$transactionEntity"
                      ]
                  }
                }
             },
             "refEntityDetails":{
                "$filter":{
                  "input":"$allRefEntityTypes",
                  "as":"item",
                  "cond":{
                      "$eq":[
                         "$$item.code",
                         "$refEntity"
                      ]
                  }
                }
             }
          }
      },
      {
          $project: {
              // allEntityTypes: 0,
              'organizations_details': 0,
              // 'corporates_details': 0,
          }
      },
      {
          "$unwind":{
             "path":"$transactionEntityDetails",
             "preserveNullAndEmptyArrays":true
          }
      },
      {
          "$unwind":{
             "path":"$refEntityDetails",
             "preserveNullAndEmptyArrays":true
          }
      },
      {
          "$unwind":{
             "path":"$corporates_details",
             "preserveNullAndEmptyArrays":true
          }
      },
      {
          "$lookup":{
             "from":"transtypes",
             "as":"transtype",
             "let":{
                "transtypeCode":"$transtypeCode",
                "moduleId":"$module._id",
                "organizationId":"$organizationId",
                "transactionEntityTypeId":"$transactionEntityDetails._id",
                "refEntityTypeId":"$refEntityDetails._id",
                "transactionEntityType":"$transactionEntityType",
                "corpId":"$corporates_details._id"
             },
             "pipeline":[
                {
                  "$match":{
                      "$and":[
                         {
                            "$expr":{
                              "$eq":[
                                  "$transactionTypeCode",
                                  "$$transtypeCode"
                              ]
                            }
                         },
                         {
                            "$expr":{
                              "$eq":[
                                  "$moduleId",
                                  "$$moduleId"
                              ]
                            }
                         },
                         {
                            "$expr":{
                              "$eq":[
                                  "$organizationId",
                                  "$$organizationId"
                              ]
                            }
                         },
                        
                          {
                            "$expr":{
                               
                                         $cond: { if: { $and:[{$eq: ["$$transactionEntityType", "Partner"] }]}, 
                                         //then: {$eq: ["$corporateId", ObjectId("60d225d3140821001353e72d")] },
                                         then: {$eq: ["$corporateId", "$$corpId"] },
                                         else: { $eq: ["$corporateId", null] }
                                             
                                         } 
                                    
                                    } ,
                                 }
                            
                      ]
                  }
                }
             ]
          }
      },
      {
          "$unwind":"$transtype"
      },
      {
        $lookup: {
            from: 'uoms',
            "let": { "eprAssetUom": "$eprAssetUom","orgId": "$organizationId" },
            as: "uom",
            pipeline: [
                {
                    $match: {
                        $and: [
                            {$expr: { $eq: ['$$eprAssetUom', '$uom'] }},
                            {$expr: { $eq: ["$$orgId", "$organizationId"] }} ,
                            ]
                    }
                },

            ]
        }
    },
    {
        $unwind:{
            "path": "$uom",
            "preserveNullAndEmptyArrays": true
        }
    },
      {
          $match: conditionObj1
      },
  ];
  if ("allFields" in payloadData && payloadData.allFields && payloadData.allFields == 'false') {
      let projectObj = {
          _id: 1,
          assetType: 1,
          eprAssetName: 1,
          eprAssetId: 1
      };

      aggregateArr.push({ $project: projectObj });
  }

  let sortKey = "eprAssetId";
  let sortOrder = -1;
  if("sortKey" in payloadData && "sortOrder" in payloadData && payloadData.sortKey && payloadData.sortOrder){
      sortKey = payloadData.sortKey;
      if( payloadData.sortKey == 'transactionTypeName'){
          sortKey = "transtype.transactionTypeName"
      }
      if( payloadData.sortKey == 'moduleName'){
          sortKey = "module.name"
      }
      if( payloadData.sortKey == 'eprAssetCategory'){
        sortKey = "eprAssetcategory.assetCategory"
    }
      sortOrder = payloadData.sortOrder.toLowerCase() == "desc" ? -1 : 1;
  }
  aggregateArr.push({ $sort: {
      [sortKey]: sortOrder
  } });

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
  var assetDetails = await EprAsset.aggregate(aggregateArr);
  const responseObj = {
      'totalCount': assetDetails[0]['totalCount'] && assetDetails[0]['totalCount'].length ? assetDetails[0]['totalCount'][0]['count'] : 0,
      'result': assetDetails[0]['paginatedResults']
  };
  return responseObj;
}

const getEprEntityAssetsByOrder =  async (payloadData) => {
    const conditionObj = {};

    if(payloadData.organizationId){
        conditionObj.organizationId = ObjectId(payloadData.organizationId)
    }
    
    
    if ("eprOrderId" in payloadData && payloadData.eprOrderId) {
        conditionObj["asset.eprOrderId"] = { $regex: payloadData.eprOrderId, $options: "i" } 
    }
    
    
    if ("eprAssetType" in payloadData && payloadData.eprAssetType) {
        conditionObj["asset.eprAssetType"] = { $regex: payloadData.eprAssetType, $options: "i" } 
    }

    if ("eprEntityAsset" in payloadData && payloadData.eprEntityAsset) {
        const arrEntityAsset = payloadData.eprEntityAsset.split(',');
        conditionObj["asset.eprEntityAsset"] = { $in: arrEntityAsset };
    }
    
    let andObj = [                                            
        {
            "$expr":{
                "$eq":[
                    "$transactionEntity",
                    "$$transactionEntity"
                ]
            }
        },
        {
            "$expr":{
                "$eq":[
                    "$$transactionEntityBranch",
                    "$transactionEntityBranch"
                ]
            }
        },
        {
            "$expr":{
                "$eq":[
                    "$eprAssetType",
                    "$$eprAssetType"
                ]
            }
        },
        {
            "$expr":{
                "$eq":[
                    "$eprAssetId",
                    "$$eprAssetId"
                ]
            }
        },
        
    ];
    if(payloadData.payloadDate) {
        andObj.push({
            "$expr":{
                "$eq":[
                    { $dateToString: { format: "%m-%Y", date: "$created_on" } },
                    payloadData.payloadDate.toString()
                ]
            }
        });
    }
    if(payloadData.state) {
        andObj.push({
            "$expr":{
                "$eq":[
                    "$state",
                    "$$state"
                ]
            }
        });
    }
    if(payloadData.eprAssetCategory) {
        andObj.push({
            "$expr":{
                "$eq":[
                    "$eprAssetCategory",
                    "$$eprAssetCategory"
                    ]
                }
        });
    }
    if(payloadData.eprAssetId) {
        andObj.push({
            "$expr":{
                "$eq":[
                    "$eprAssetId",
                    "$$eprAssetId"
                ]
                        
            }
        });
    }
    const aggregateArr = [
        {
            $lookup: {
                from: "epr_assets",
                as: "asset",
                let: { "transactionEntity": "$entity", "transactionEntityBranch": "$entityBranch", "eprAssetId": "$eprAssetId","eprAssetCategory": ObjectId(payloadData.eprAssetCategory),"eprAssetType": payloadData.eprAssetType,"state":payloadData.state, "payloadDate": payloadData.payloadDate },
                pipeline: [
                    {
                        $addFields: {
                            "monthYear" : { $dateToString: { format: "%m-%Y", date: "$created_on" } },                
                            },
                    },
                    {                        
                        $match: {
                            "$and" : andObj
                        },
                    },
                    {
                        $sort:{
                            created_on:1
                        }
                    },
                    {
                        $limit:1
                    }
                ]
            }
        },
        {
            $unwind: "$asset"
        },
        {
            $lookup: {
                from: "assetcategories",
                localField: "asset.eprAssetCategory",
                foreignField: "_id",
                as: "assetcategory",
               
            }
        },
        {
            $unwind:{
                "path": "$assetcategory",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            $match: conditionObj
        }
    ];

    let sortKey = "eprAssetId";
    let sortOrder = -1;
    if("sortKey" in payloadData && "sortOrder" in payloadData && payloadData.sortKey && payloadData.sortOrder){
        sortKey = payloadData.sortKey;
        if( payloadData.sortKey == 'eprAssetName'){
            sortKey = "asset.eprAssetName"
        }
        if( payloadData.sortKey == 'assetLocation'){
            sortKey = "asset.location"
        }
        if( payloadData.sortKey == 'eprAssetCategory'){
            sortKey = "assetcategory.assetCategory"
        }
        sortOrder = payloadData.sortOrder && payloadData.sortOrder.toLowerCase() == "desc" ? -1 : 1;
    }
    aggregateArr.push({ $sort: {
        [sortKey]: sortOrder
    } });

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
    const assetDetails = await EprAssetInventory.aggregate(aggregateArr);
    const responseObj = {
        'result': assetDetails[0]['paginatedResults'],
        'totalCount': assetDetails[0]['totalCount'] && assetDetails[0]['totalCount'].length ? assetDetails[0]['totalCount'][0]['count'] : 0
    };
    return responseObj;
}


const getEprAssetDetailsByEntityAsset = async (payloadData) =>{
    const conditionObj = { };
    if ("eprEntityAsset" in payloadData && payloadData.eprEntityAsset) {
        conditionObj["eprEntityAsset"] = { $in: [payloadData.eprEntityAsset] };
    }
    if ("assetType" in payloadData && payloadData.assetType) {
        conditionObj["assetType"] = payloadData.assetType;
    }
    if(payloadData.organizationId){
        conditionObj.organizationId = ObjectId(payloadData.organizationId)
    }
    if ("eprAssetType" in payloadData && payloadData.eprAssetType) {
        conditionObj["eprAssetType"] = { $regex: payloadData.eprAssetType, $options: "i" } 
    }
    if ("eprAssetCategory" in payloadData && payloadData.eprAssetCategory) {
        conditionObj["eprAssetCategory"] =  ObjectId(payloadData.eprAssetCategory);
    }

    
 
    const aggregateArr = [
        {
            $lookup: {
                from: "assetcategories",
                localField: "eprAssetCategory",
                foreignField: "_id",
                as: "assetcategory",
               
            }
        },
        {
            $unwind:{
                "path": "$assetcategory",
                "preserveNullAndEmptyArrays": true
            }
        },

        {
            "$lookup":{
               "from":"organizations",
               "let":{
                  "transactionEntity":"$transactionEntity",
                 // "refEntity":"$refEntity"
               },
               "as":"organizations_details",
               "pipeline":[
                  {
                     "$match":{
                        "$expr":{
                           "$and":[
                              {
                                 "$eq":[
                                    "$$transactionEntity",
                                    "$code"
                                 ]
                              },
                              // {
                              //   "$eq":[
                              //       "$$refEntity",
                              //       "$code"
                              //   ]
                              // }
                           ]
                        }
                     }
                  }
               ]
            }
         },
         {
            "$lookup":{
               "from":"organizations",
               "let":{
                  //"transactionEntity":"$transactionEntity",
                  "refEntity":"$refEntity"
               },
               "as":"reforganizations_details",
               "pipeline":[
                  {
                     "$match":{
                        "$expr":{
                           "$and":[
                              // {
                              //   "$eq":[
                              //       "$$transactionEntity",
                              //       "$code"
                              //   ]
                              // },
                              {
                                "$eq":[
                                    "$$refEntity",
                                    "$code"
                                ]
                              }
                           ]
                        }
                     }
                  }
               ]
            }
         },
         {
            "$lookup":{
               "from":"corporates",
               "let":{
                  "ctransactionEntity":"$transactionEntity",
                 // "crefEntity":"$refEntity"
               },
               "as":"corporates_details",
               "pipeline":[
                  {
                     "$match":{
                        "$expr":{
                           "$and":[
                              {
                                 "$eq":[
                                    "$$ctransactionEntity",
                                    "$code"
                                 ]
                              }
                              // {
                              //   "$eq":[
                              //       "$$crefEntity",
                              //       "$code"
                              //   ]
                              // }
                           ]
                        }
                     }
                  }
               ]
            }
         },
         {
            "$lookup":{
               "from":"corporates",
               "let":{
                  //"ctransactionEntity":"$transactionEntity",
                  "crefEntity":"$refEntity"
               },
               "as":"refcorporates_details",
               "pipeline":[
                  {
                     "$match":{
                        "$expr":{
                           "$and":[
                              // {
                              //   "$eq":[
                              //       "$$ctransactionEntity",
                              //       "$code"
                              //   ]
                              // },
                              {
                                "$eq":[
                                    "$$crefEntity",
                                    "$code"
                                ]
                              }
                           ]
                        }
                     }
                  }
               ]
            }
         },
        //  {
        //     "$addFields":{
        //        "allEntityTypes":{
        //           "$concatArrays":[
        //             "$organizations_details",
        //             "$corporates_details",
        //             //"$refcorporates_details",
        //             //"$reforganizations_details"
        //           ]
        //        },
        //        "allRefEntityTypes":{
        //           "$concatArrays":[
        //             "$refcorporates_details",
        //             "$reforganizations_details"
        //           ]
        //        },
               
        //     }
        // },
        {
            $match: conditionObj
        }
    ];    
    let projectObj = {
        eprAssetCategory:1, 
        eprAssetType: 1,
        eprAssetName:1, 
        eprAssetId:1,
        eprAssetUom:1, moduleCode:1, transtypeCode:1, eprTransactionid:1, eprEntityAsset:1,
        eprAssetMfgDate:1, eprAssetExpiryDate:1,state:1,eprOrderId:1,created_on:1,eprAssetQuantity:1,
        eprRefOrder:1,
        'assetcategory.assetCategory': 1, 
        'organizations_details':1  ,
        'corporates_details':1  ,
        'reforganizations_details':1,
        'refcorporates_details':1
    };
    aggregateArr.push({ $project: projectObj });
    var result = await EprAsset.aggregate(aggregateArr);
    return result;
}




const updateEprData = async (payloadData) => {
    if (!payloadData) {
        return false;
    }
    let whereObj = {};
    if(payloadData.id){
        whereObj._id =  ObjectId(payloadData.id)
    }
    if(payloadData.outside_docs){
        return await EprAsset.findOneAndUpdate(whereObj, { $set: payloadData });
    }
}

module.exports = {
    addEPRAsset,
    eprreceiveAsset,
    addMultipleEprAssets,
    eprassetQuantity,
    addEprAssetOnAssetType,
    updateEPRAssetInventory,
    updateAssetInventoryStocks,
    getEprEntityAssets,
    getEPRAssetFullDetails,
    eprPrint,
    geteprAssets,
    getEprEntityAssetsByOrder,
    getEprAssetDetailsByEntityAsset,
    updateEprData
}