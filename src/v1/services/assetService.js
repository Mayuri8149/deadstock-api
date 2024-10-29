const { Asset, AssetInventory, EprAsset, EprAssetInventory, ObjectId } = require('../models/asset');
const constants = require("../lang/constant");
const transactionService = require('../services/transactionServices');

const addAsset = async (assetPayloadData) => {
    var resultArray = []
    for(let payloadData of assetPayloadData){
    if(payloadData.assetType == constants[2])
    payloadData.assetQuantity = -(payloadData.assetQuantity);
    else payloadData.assetQuantity = payloadData.assetQuantity;
    payloadData.created_on = payloadData.modified_on = new Date(Date.now());
    payloadData.is_deleted = false;
    payloadData.nft_status = "Not Created";
    const result = await Asset.findOneAndUpdate(
        {   transactionid:payloadData.transactionid },
        {
            $set: payloadData
        },
        { new: true, useFindAndModify: false, upsert: true }
    );
     resultArray.push(result)
    }
    const inventory_result = await updateAssetInventory(resultArray);
    return resultArray;
}

const assetQuantityOnAssetType = async (payloadData) =>{
    let refAssetArr = [];
    let refAssetObj = { "refAssetId": payloadData.assetId, "refTransactionid" : payloadData.transactionid, "refEntityAsset" : payloadData.entityAsset }
    refAssetArr.push(refAssetObj);
    if(payloadData.assetType == constants[2])
    payloadData.assetQuantity = -(payloadData.assetQuantity);
    else payloadData.assetQuantity = payloadData.assetQuantity;
    if(payloadData.inputAssets && payloadData.inputAssets.length != 0){
        const assetPayloadData = payloadData.inputAssets.map(elem => (elem.inputAssetId))
        const assetDetails = await getAssetDetails(assetPayloadData);
        /////////////////////
        const assetArray = assetDetails.map((elem) => {
            const assetArrObj = { "assetCategory": elem.assetCategory, "assetId": elem.assetId, "assetName": elem.assetName, "assetUom": elem.assetUom, "moduleCode": payloadData.moduleCode, "transtypeCode": payloadData.transtypeCode, "entityAsset": elem.entityAsset, "assetType" : constants[2], "effectiveDate": elem.effectiveDate, "expiryDate": elem.expiryDate ,"creator_id": payloadData.creator_id, "modifier_id" : payloadData.modifier_id, "created_by" : payloadData.created_by, "modified_by": payloadData.modified_by, "creator_role": payloadData.creator_role, "modifier_role": payloadData.modifier_role};

            if(payloadData.transactionEntityBranch){
                assetArrObj.transactionid = payloadData.transactionEntity+'.'+payloadData.transactionEntityBranch+'.'+elem.assetId;
            }else{
                assetArrObj.transactionid = payloadData.transactionEntity+'.'+elem.assetId;
            }
            return assetArrObj;
        })
        const inputAssetArray = payloadData.inputAssets.map(elem => (
            { "assetQuantity": - elem.inputAssetQuantity, "assetUom": elem.inputAssetUom, "entityAsset": elem.entity_asset, "refAsset" :refAssetArr ,"organizationId":payloadData.organizationId, "transactionEntityType": payloadData.transactionEntityType, "transactionEntityBranch" : payloadData.transactionEntityBranch, "transactionEntity" : payloadData.transactionEntity, "refEntityType" : payloadData.refEntityType , "refEntityBranch" : payloadData.refEntityBranch, "refEntity" : payloadData.refEntity }
            ))
        const merged = {};
        const arrays = [assetArray, inputAssetArray]
        arrays.forEach(arr => {
            arr.forEach(item => {
                merged[item["entityAsset"]] = Object.assign({}, merged[item["entityAsset"]], item);
            });
        });
        const assetArr = Object.values(merged);
        
        const result = await addMultipleAssets(assetArr);
    }
    
    return payloadData;
}

const consumedAssets = async (multipleObj, user, inputAssets) =>{
    let refAssetArr = []; // Details of Poduced Assets
    let consumeRefArr = [];
    for(let payloadData of multipleObj){
    let refAssetObj = { "refAssetId": payloadData.assetId, "refTransactionid" : payloadData.transactionid, "refEntityAsset" : payloadData.entityAsset }
    refAssetArr.push(refAssetObj);
    } 
    if(inputAssets.length){
        const assetPayloadData = inputAssets.map(elem => (elem.entity_asset))
        const assetDetails = await getAssetDetails(assetPayloadData);
        const userData = transactionService.creatorDetails(user);
        const entityData = transactionService.entityDetails(multipleObj[0]);
        const mergedData = assetDetails.map(({ _id, ...data }) => ({
            ...data,
            ...userData,
            ...entityData,
            refAssetArr,
            "assetType": constants[2],
            ...inputAssets.filter(elem => elem.entity_asset == data.entityAsset).
            reduce((val, elem) => { return Object.assign(val, { "assetQuantity": - elem.inputAssetQuantity })}, {})
        }))

        let result = await addMultipleAssets(mergedData);
        result.map(inputs => {
            let consumeRefObj = { "consumeAssetId": inputs.assetId, "consumeTransactionid" : inputs.transactionid, "consumeEntityAsset" : inputs.entityAsset, "consumeObjectId" : inputs._id }
            consumeRefArr.push(consumeRefObj);
            })
    }
    return consumeRefArr;
}

const receiveEprAsset = async (payloadData, transactiontypeData) => {
    payloadData.assetWithoutReference = true;

    const abc = (payloadData.eprOrderId.replace(/\'/g, '').split(/(\d+)/).filter(Boolean)); 
    let incrementedNumber = parseInt(abc[1]);

    const multipleReceiveAssetData = payloadData.eprOrderDetails[0].orderEprItems.map( (elem) => {
        let assetID = abc[0]+incrementedNumber ++;
        var multipleObj = {
        "organizationId":payloadData.organizationId,    
        "assetId": assetID,
        "eprEntityAsset": payloadData.eprTransactionid+'.'+elem.epr_line_number,
        "moduleCode": payloadData.moduleCode,
        "transtypeCode": payloadData.transtypeCode,
        // "assetMfgDate": elem.effectiveDate,
        // "assetExpiryDate": elem.expiryDate,
        "assetName": elem.epr_order_item,
        "assetUom": elem.epr_order_uom,        
        "assetType" : constants[3],
        "assetCategory": elem.asset_category,
        "location" : payloadData.geolocation.location,
        "geolocation" : payloadData.geolocation,
        "orderId": elem.epr_ref_order,
        "refOrder": elem.epr_ref_order_transactionid,
        "assetQuantity": elem.epr_accepted_quantity,
        "rejected_quantity": elem.epr_rejected_quantity,
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
                multipleObj.transactionid = payloadData.transactionEntity+'.'+payloadData.transactionEntityBranch+'.'+assetID;
            }else{
                multipleObj.transactionid = payloadData.transactionEntity+'.'+assetID;
            }  

        return multipleObj;
    })
        const result = await addMultipleAssets(multipleReceiveAssetData);
}

const findAllAsset = async (payloadData) => {
    let conditionObj = { }
    if (payloadData.entityAsset) { conditionObj.entityAsset = payloadData.entityAsset; }
    if (payloadData.transactionid) { conditionObj.transactionid = payloadData.transactionid; }
    if (payloadData.assetType) { conditionObj.assetType = payloadData.assetType; }
    if (payloadData.orderId) { conditionObj.orderId = payloadData.orderId; }
    if (payloadData.status) { conditionObj.status = payloadData.status; }
    if (payloadData.transactionEntity) { conditionObj.transactionEntity = payloadData.transactionEntity; }
    if (payloadData.transactionEntityBranch) { conditionObj.transactionEntityBranch = payloadData.transactionEntityBranch; }
    
    const result = await Asset.find(
        conditionObj
    );

    return result;
}

const findMultipleAsset = async (payloadData) => {
    
    const assetArray = payloadData.map( async (elem) => { 
        // var result = [];
        let conditionObj = { }
        if (elem.entityAsset) { conditionObj.entityAsset = elem.entityAsset; }
        if (elem.transactionid) { conditionObj.transactionid = elem.transactionid; }
        if (elem.assetType) { conditionObj.assetType = elem.assetType; }
        if (elem.assetQuantity) { conditionObj.assetQuantity = elem.assetQuantity; }
        if (elem.assetId) { conditionObj.assetId = elem.assetId; }
        if (elem.orderId) { conditionObj.orderId = elem.orderId; }
        if (elem.status) { conditionObj.status = elem.status; }
        if (elem.transactionEntity) { conditionObj.transactionEntity = elem.transactionEntity; }
        if (elem.transactionEntityBranch) { conditionObj.transactionEntityBranch = elem.transactionEntityBranch; }
        const result = await Asset.findOne(conditionObj)
        return result;    
        });
    return result;
}

const findAssets = async (payloadData , inventory ) => {   
    const assetArray = payloadData.map( async (elem) => {  
    let conditionObj = { }
    if (elem.entityAsset) { conditionObj.entityAsset = elem.entityAsset; }
    if (elem.transactionid) { conditionObj.transactionid = elem.transactionid; }
    if (elem.assetType) { conditionObj.assetType = elem.assetType; }
    if (elem.assetQuantity) { conditionObj.assetQuantity = elem.assetQuantity; }
    if (elem.assetId) { conditionObj.assetId = elem.assetId; }
    if (elem.orderId) { conditionObj.orderId = elem.orderId; }
    if (elem.status) { conditionObj.status = elem.status; }
    if (elem.transactionEntity) { conditionObj.transactionEntity = elem.transactionEntity; }
    if (elem.transactionEntityBranch) { conditionObj.transactionEntityBranch = elem.transactionEntityBranch; }
    
    var result = await Asset.findOneAndUpdate(
        conditionObj,
        { $set: {status : constants[4] } }
    );
    if(result){
        const inventoryUpdateResult = await updateInventoryRecords(inventory);
    }
    });
}

const updateAsset = async (payloadData) => {
    let conditionObj = { }
    if (payloadData.entityAsset) { conditionObj.entityAsset = payloadData.entityAsset; }
    if (payloadData.transactionid) { conditionObj.transactionid = payloadData.transactionid; }
    if (payloadData.assetType) { conditionObj.assetType = payloadData.assetType; }
    // if (payloadData.status) { conditionObj.status = payloadData.status; }
    
    const result = await Asset.findOneAndUpdate(
        conditionObj,
        { $set : {status : constants[4] } }
    );
    return result;
}

const updateRefAsset = async (payloadData , inventory ) => {
    
    if(!payloadData.status){
    for(let elem of payloadData.inputAssets){        

        const result = await Asset.findOneAndUpdate(
            {
                'refAsset.refEntityAsset': payloadData.entityAsset,
                'refAsset.refTransactionid': payloadData.transactionid,
                entityAsset : elem.entity_asset,
                assetType : constants[2]
            },
            { $set: { assetQuantity : - elem.inputAssetQuantity } 
            }
        );    
    }
    }else{
        const result = await Asset.updateMany(
            {   'refAsset.refEntityAsset': payloadData.entityAsset,
                'refAsset.refTransactionid': payloadData.transactionid,
                assetType: payloadData.assetType
            },
            { $set: {status : constants[4] } }
        );
    }   

    const inventoryUpdateResult = await updateInventoryRecords(inventory);

    // return result;
}

var updateAssets = async (payloadData , inventory ) => {
    for(let elem of payloadData){   
    let conditionObj = { }
    let updateSet = {}
        if (elem.entityAsset) { conditionObj.entityAsset = elem.entityAsset; }
        if (elem.orderId) { conditionObj.orderId = elem.orderId; }
        if (elem.assetType) { conditionObj.assetType = elem.assetType; }
        if (elem.assetQuantity) { updateSet.assetQuantity = elem.assetQuantity; }
        if (elem.transactionEntity) { conditionObj.transactionEntity = elem.transactionEntity; }
        if (elem.transactionEntityBranch) { conditionObj.transactionEntityBranch = elem.transactionEntityBranch; }
        if (elem.status) { updateSet.status = constants[4]; conditionObj.assetQuantity = elem.assetQuantity; } 
        
        const result = await Asset.findOneAndUpdate(
            conditionObj,
            { $set: updateSet }
        );
        if (!elem.status)
        { inventory.forEach(elem => {
            elem['assetType'] = result.assetType;
        })
        }
    }    
    const inventoryUpdateResult = await updateInventoryRecords(inventory);
    // return result;
}

const updateAssetStatus = async (asset) => {
    payloadData = {}
    let conditionObj = {}
    let updateSet = {}         
    if (asset.status && asset.status != ''){ updateSet.status = constants[4] }
    if (asset.assetName){ updateSet.assetName = asset.assetName }
    if (asset.assetQuantity){ updateSet.assetQuantity = asset.assetQuantity }
    if (asset.assetUom){ updateSet.assetUom = asset.assetUom }
    if (asset.effectiveDate){ updateSet.effectiveDate = asset.effectiveDate }
    if (asset.expiryDate){ updateSet.expiryDate = asset.expiryDate }
    if (asset.fields){ updateSet.fields = asset.fields }
    if (asset.geolocation){ updateSet.geolocation = asset.geolocation; 
        updateSet.location = asset.geolocation.formattedAddress;  }
    if (asset.location){ updateSet.location = asset.location }
    if (asset.inputAssets){ updateSet.inputAssets = asset.inputAssets }

    if (asset.transactionid){ conditionObj.transacionid = asset.transacionid}
    if (asset.entityAsset){ conditionObj.entityAsset = asset.entityAsset}
    if (asset.assetType){ conditionObj.assetType = asset.assetType}
    const result = await Asset.findOneAndUpdate(
        conditionObj,
        { 
            $set:updateSet
        }
    );
    asset.assetType = result.assetType
    const inventoryUpdateResult = await updateInventory(asset);
    return result;
}

const updateInventoryRecords = async (inventory) => {
    const inventoryArray = inventory.map( async(elem) => {
        let conditionObj = { }
            if (elem.entityAsset) { conditionObj.entityAsset = elem.entityAsset; }
            if (elem.entity) { conditionObj.entity = elem.entity; }
            if (elem.entityBranch) { conditionObj.entityBranch = elem.entityBranch; }

        if(inventory[0].assetType == constants[2]){
            const inventoryResult = await AssetInventory.findOneAndUpdate(
                conditionObj,
                {
                    $inc: { balancedQuantity: elem.assetQuantity,
                            consumedQuantity: -elem.assetQuantity }
                });
                return inventoryResult;

        }else if(inventory[0].assetType == constants[3]){
            const inventoryResult = await AssetInventory.findOneAndUpdate(
                conditionObj,
                {
                    $inc: { balancedQuantity: -elem.assetQuantity,
                            receivedQuantity: -elem.assetQuantity }
                });
                return inventoryResult;
        }
    })
    return inventoryArray
}

const updateInventory = async (asset) => {
    let updateAssetObj = {}
    updateAssetObj.transactionid = asset.transactionid
    updateAssetObj.entityAsset = asset.entityAsset
    if(asset.assetType) { updateAssetObj.assetType = asset.assetType }
    if(asset.assetQuantity) { updateAssetObj.assetQuantity = asset.assetQuantity }
    if(asset.accepted_quantity) { updateAssetObj.accepted_quantity = asset.accepted_quantity }
    if(asset.entity) { updateAssetObj.entity = asset.entity }
    if(asset.entityBranch) { updateAssetObj.entityBranch = asset.entityBranch }
    if(asset.refEntity) { updateAssetObj.refEntity = asset.refEntity }
    if(asset.refEntityBranch) { updateAssetObj.refEntityBranch = asset.refEntityBranch }
    const inventoryUpdateResult = await updateAssetInventoryStatus(updateAssetObj);
    return inventoryUpdateResult;
}

const updateAssetInventoryStatus = async (asset) => {
    let updateSet = {};
    let incrementSet = {};
    if(asset.accepted_quantity){
        incrementSet.balancedQuantity = -asset.accepted_quantity
        incrementSet.receivedQuantity = -asset.accepted_quantity
    }else if(asset.assetQuantity && asset.assetType == constants[1]){
        updateSet.balancedQuantity = asset.assetQuantity
        updateSet.producedQuantity = asset.assetQuantity
    }else if(asset.assetQuantity && asset.assetType == constants[3]){
        updateSet.balancedQuantity = asset.assetQuantity
        updateSet.receivedQuantity = asset.assetQuantity
    }else{
        updateSet.balancedQuantity = updateSet.producedQuantity = updateSet.receivedQuantity = updateSet.consumedQuantity = updateSet.rejectedQuantity = 0
    }
    let conditionObj = { }
    let refObj = { }
    if (asset.entityAsset) { conditionObj.entityAsset = asset.entityAsset; }
    if (asset.entity) { conditionObj.entity = asset.entity; }
    if (asset.entityBranch) { conditionObj.entityBranch = asset.entityBranch; }
    if (asset.transactionid) { conditionObj.transactionid = asset.transactionid; }

    if (asset.refEntity) { refObj.entity = asset.refEntity; }
    if (asset.refEntityBranch) { refObj.entityBranch = asset.refEntityBranch; }
    if (asset.entityAsset) { refObj.entityAsset = asset.entityAsset; }
    const updateresult = await AssetInventory.findOneAndUpdate(
        conditionObj,
        {
            $set : updateSet,
            $inc : incrementSet
        });
    return updateresult;        
}


const receiveAsset = async (payloadData) => {
    payloadData.assetWithoutReference = true;
    //call function of refOrder
    const multipleReceiveAssetData = payloadData.orderDetails[0].orderItems.map( (elem) => {
        let line_number = ('000' + elem.line_number).substr(-3)
        var multipleObj = {
        "organizationId":payloadData.organizationId,    
        "assetId": elem.ref_order+'.'+line_number,
        "entityAsset": elem.ref_order_transactionid+'.'+line_number,
        "moduleCode": payloadData.moduleCode,
        "transtypeCode": payloadData.transtypeCode,
        // "assetMfgDate": elem.effectiveDate,
        // "assetExpiryDate": elem.expiryDate,
        "line_number" : line_number,
        "assetName": elem.order_item,
        "assetUom": elem.order_uom,        
        "assetType" : constants[3],
        "assetCategory": elem.asset_category,
        "geolocation" : payloadData.geolocation,
        "location" : payloadData.geolocation.formattedAddress,
        "orderId": payloadData.transactionid,
        "refOrder": elem.ref_order_transactionid,
        "assetQuantity": elem.accepted_quantity,
        "rejected_quantity": elem.rejected_quantity,
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
                multipleObj.transactionid = payloadData.transactionEntity+'.'+payloadData.transactionEntityBranch+'.'+elem.ref_order+'.'+line_number;
            }else{
                multipleObj.transactionid = payloadData.transactionEntity+'.'+elem.ref_order+'.'+line_number;
            }  
        
        return multipleObj;

    })
        const result = await addMultipleAssets(multipleReceiveAssetData);
        const entityArray = [];        
        const orderArray = [];

        payloadData.orderDetails[0].orderItems.map((item)=>{
            item.entity_asset = item.ref_order_transactionid+'.'+ ('000' + item.line_number).substr(-3)
            item.ordered_assetId = item.ref_order+'.'+ ('000' + item.line_number).substr(-3)
            entityArray.push(item)   
        })
        const orderObj = { "referredAsset": payloadData.orderDetails[0].referredAsset, "referredOrder": payloadData.orderDetails[0].referredOrder, "orderItems" : entityArray };
        orderArray.push(orderObj)
        return orderArray;
}

const updateAssetInventoryStocks = async (payloadData) => {
    let conditionObj =  {   
        entity: payloadData.entity,
        assetId: payloadData.assetId,
        entityAsset: payloadData.entityAsset,
        organizationId:payloadData.organizationId,
        entityType: payloadData.entityType,
        transactionid: payloadData.transactionid
    };         
    
    let updateSet =    {};  
    if (payloadData.assetUom) { updateSet.assetUom = payloadData.assetUom; }
    if (payloadData.assetMfgDate) { updateSet.assetMfgDate = payloadData.assetMfgDate; }
    if (payloadData.assetExpiryDate) { updateSet.assetExpiryDate = payloadData.assetExpiryDate; } 
    if (payloadData.entityBranch) { updateSet.entityBranch = payloadData.entityBranch; } 
   
    let result = {};
    result = await AssetInventory.findOneAndUpdate(conditionObj,
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
    return payloadData;

}  

const updateAssetInventory = async (assetPayloadData) =>{
    const inventoryArr = [];
    const payloadData = assetPayloadData.map( (elem) => {
        var inventoryObj = {
        "organizationId":elem.organizationId,    
        "assetId": elem.assetId,
        "entityAsset": elem.entityAsset, 
        // "entityType": elem.transactionEntityType, 
        // "entityBranch": elem.transactionEntityBranch,
        "assetMfgDate": elem.effectiveDate,
        "assetExpiryDate": elem.expiryDate,
        "assetUom": elem.assetUom,        
        };
        
        if(elem.assetType == constants[1]){            
            inventoryObj.entity = elem.transactionEntity
            inventoryObj.entityType = elem.transactionEntityType
            inventoryObj.entityBranch = elem.transactionEntityBranch
            inventoryObj.producedQuantity = elem.assetQuantity
            inventoryObj.consumedQuantity = 0
            inventoryObj.receivedQuantity = 0
            inventoryObj.rejectedQuantity = 0
            inventoryObj.balancedQuantity = elem.assetQuantity

            if(elem.transactionEntityBranch){
                inventoryObj.transactionid=  elem.transactionEntity+'.'+elem.transactionEntityBranch+'.'+elem.assetId;
            }else{
                inventoryObj.transactionid=  elem.transactionEntity+'.'+elem.assetId;
            } 
            inventoryArr.push(inventoryObj);   
        }


        if(elem.assetType == constants[2]){
            inventoryObj.entity = elem.transactionEntity
            inventoryObj.entityType = elem.transactionEntityType
            inventoryObj.entityBranch = elem.transactionEntityBranch
            inventoryObj.consumedQuantity = -elem.assetQuantity
            inventoryObj.producedQuantity = 0
            inventoryObj.receivedQuantity = 0
            inventoryObj.rejectedQuantity = 0
            inventoryObj.balancedQuantity = elem.assetQuantity

            if(elem.transactionEntityBranch){
                inventoryObj.transactionid=  elem.transactionEntity+'.'+elem.transactionEntityBranch+'.'+elem.assetId;
            }else{
                inventoryObj.transactionid=  elem.transactionEntity+'.'+elem.assetId;
            }
            inventoryArr.push(inventoryObj);
        }
        
        if(elem.assetType == constants[3]){
            inventoryObj.entity = elem.transactionEntity
            inventoryObj.entityType = elem.transactionEntityType
            inventoryObj.entityBranch = elem.transactionEntityBranch
            inventoryObj.receivedQuantity = elem.assetQuantity
            inventoryObj.rejectedQuantity = 0
            inventoryObj.consumedQuantity = 0
            inventoryObj.producedQuantity = 0
            inventoryObj.balancedQuantity = elem.assetQuantity
            if(elem.transactionEntityBranch){
                inventoryObj.transactionid=  elem.transactionEntity+'.'+elem.transactionEntityBranch+'.'+elem.assetId;
            }else{
                inventoryObj.transactionid=  elem.transactionEntity+'.'+elem.assetId;
            }
            inventoryArr.push(inventoryObj);   

            if(elem.rejected_quantity != 0){
                let rejectedInventoryObj = Object.assign({},inventoryObj)
                rejectedInventoryObj.entity = elem.refEntity
                rejectedInventoryObj.entityType = elem.refEntityType
                rejectedInventoryObj.entityBranch = elem.refEntityBranch
                rejectedInventoryObj.rejectedQuantity = elem.rejected_quantity
                rejectedInventoryObj.consumedQuantity = 0
                rejectedInventoryObj.producedQuantity = 0
                rejectedInventoryObj.receivedQuantity = 0
                rejectedInventoryObj.balancedQuantity = 0
                if(elem.refEntityBranch){
                    rejectedInventoryObj.transactionid=  elem.refEntity+'.'+elem.refEntityBranch+'.'+elem.assetId;
                }else{
                    rejectedInventoryObj.transactionid=  elem.refEntity+'.'+elem.assetId;
                }
                inventoryArr.push(rejectedInventoryObj);   
            }            
        }       
    });
    inventoryArr.forEach( async (item, index, arr) =>
    await updateAssetInventoryStocks(arr[index]));    
    
    return payloadData;
}

const addMultipleAssets = async (payloadData) => {
        // if(payloadData[0].transactionEntity){
            var result = await Asset.insertMany(payloadData);
        // }
        const multiplePayloadData = payloadData.map( (elem) => {   
            var multipleObj = {
            "organizationId":elem.organizationId,    
            "assetCategory": elem.assetCategory,
            "assetId": elem.assetId,
            "entityAsset": elem.entityAsset,
            "assetMfgDate": elem.effectiveDate,
            "assetExpiryDate": elem.expiryDate,
            "assetUom": elem.assetUom,        
            "transactionid": elem.transactionid,        
            };

            
            if(elem.rejected_quantity){
                multipleObj.entity = elem.refEntity, 
                multipleObj.entityType = elem.refEntityType, 
                multipleObj.entityBranch = elem.refEntityBranch,
                multipleObj.assetQuantity = elem.rejected_quantity
                multipleObj.assetType = "Rejected"
            }
              
            if(elem.assetType == constants[3]){
                // multipleObj.entityAsset = elem.entityAsset, 
                multipleObj.entity = elem.transactionEntity 
                multipleObj.entityType = elem.transactionEntityType
                multipleObj.entityBranch = elem.transactionEntityBranch
                multipleObj.assetQuantity = elem.assetQuantity
                multipleObj.assetType = elem.assetType
            }
            else{
                multipleObj.entity = elem.refEntity, 
                multipleObj.entityType = elem.refEntityType, 
                multipleObj.entityBranch = elem.refEntityBranch,
                multipleObj.assetQuantity = elem.assetQuantity
                multipleObj.assetType = elem.assetType    
            }
           
            return multipleObj;
        });
        let arrays = [payloadData, multiplePayloadData]
        const updateArr = multiplePayloadData.map(arr => {
        const selectedAsset = payloadData.filter((element) => element.entityAsset == arr.entityAsset)
            arr = Object.assign({}, selectedAsset[0], arr);
            return arr;
        }); 
        if(payloadData.assetType == constants[3]){
            const inventory_result = await updateAssetInventory(payloadData);
        }else{
            const inventory_result = await updateAssetInventory(updateArr);
        }
 
    return result;
}

const addAssetOnAssetType = async (payloadData) => {
    const orderItems = payloadData.orderDetails[0].orderItems.map(elem => (elem.entity_asset))
    const assetDetails = await getAssetDetails(orderItems);
    const assetArray = assetDetails.map((elem) => {
    const assetArrObj = { "orderId": payloadData.refOrderId,"assetId": elem.assetId, "assetName": elem.assetName, "assetUom": elem.assetUom, "moduleCode": elem.moduleCode, "transtypeCode": elem.transtypeCode, "entityAsset": elem.entityAsset, "assetType" : constants[2], "effectiveDate": elem.effectiveDate, "expiryDate": elem.expiryDate, "creator_id": payloadData.creator_id, "modifier_id" : payloadData.modifier_id, "created_by" : payloadData.created_by, "modified_by": payloadData.modified_by, "creator_role": payloadData.creator_role, "modifier_role": payloadData.modifier_role,"location" : payloadData.location};

        if(payloadData.transactionEntityBranch){
            assetArrObj.transactionid = payloadData.transactionEntity+'.'+payloadData.transactionEntityBranch+'.'+elem.assetId;                
        }else{
            assetArrObj.transactionid = payloadData.transactionEntity+'.'+elem.assetId;
        }
        return assetArrObj;
    })
    const inputAssetArray = payloadData.orderDetails[0].orderItems.map((elem) => {
        var inputAssetObj =
        { "orderId": payloadData.refOrderId, "assetCategory": elem.asset_category, "assetType": payloadData.assetType, "assetId": elem.ordered_assetId, "assetName":elem.order_item , "assetUom": elem.order_uom, "entityAsset": elem.entity_asset,"refOrder": elem.ref_order_transactionid, "organizationId":payloadData.organizationId, "moduleCode" : payloadData.moduleCode, "transtypeCode" : payloadData.transtypeCode, "transactionEntityType": payloadData.transactionEntityType, "transactionEntityBranch" : payloadData.transactionEntityBranch, "transactionEntity" : payloadData.transactionEntity, "refEntityType" : payloadData.refEntityType , "refEntityBranch" : payloadData.refEntityBranch, "refEntity" : payloadData.refEntity, "location" : payloadData.location, "geolocation" : payloadData.geolocation, "location" : payloadData.geolocation.formattedAddress, "fields" : payloadData.fields, "creator_id": payloadData.creator_id, "modifier_id" : payloadData.modifier_id, "created_by" : payloadData.created_by, "modified_by": payloadData.modified_by, "creator_role": payloadData.creator_role, "modifier_role": payloadData.modifier_role };

        if(payloadData.assetType == constants[2]){
            inputAssetObj.assetQuantity = - elem.order_quantity;

            if(payloadData.transactionEntityBranch){
                inputAssetObj.transactionid = payloadData.transactionEntity+'.'+payloadData.transactionEntityBranch+'.'+elem.ordered_assetId;                
            }else{
                inputAssetObj.transactionid = payloadData.transactionEntity+'.'+elem.ordered_assetId;
            }
                    
        }else if(payloadData.assetType == constants[3]){
            inputAssetObj.assetQuantity = elem.accepted_quantity;
            inputAssetObj.rejected_quantity = elem.rejected_quantity;

            if(payloadData.transactionEntityBranch){
                inputAssetObj.transactionid = payloadData.transactionEntity+'.'+payloadData.transactionEntityBranch+'.'+elem.ordered_assetId;                
            }else{
                inputAssetObj.transactionid = payloadData.transactionEntity+'.'+elem.ordered_assetId;
            }
        }else{
            inputAssetObj.assetQuantity = elem.order_quantity; 
            if(payloadData.transactionEntityBranch){
                inputAssetObj.transactionid = payloadData.transactionEntity+'.'+payloadData.transactionEntityBranch+'.'+elem.ordered_assetId;                
            }else{
                inputAssetObj.transactionid = payloadData.transactionEntity+'.'+elem.ordered_assetId;
            }
        }
            return inputAssetObj;
        });
        
        const addToInsert = inputAssetArray.map(arr => {
            const selectedAsset = assetArray.filter((element) => element.entityAsset == arr.entityAsset)
            arr = Object.assign({}, selectedAsset[0], arr);
            return arr;
        });
        const result = await addMultipleAssets(addToInsert);    
}
//{ $in: [constants[1], constants[3]] };
const getAssetDetails = async (assetPayloadData) =>{
    const conditionObj = { };
    conditionObj["entityAsset"] = { $in: assetPayloadData };
    conditionObj["assetType"] = { $eq: constants[1] };
    conditionObj["status"] = { $ne: constants[5]};
    const aggregateArr = [
        {
            $match: conditionObj
        }
    ];    
    let projectObj = {
        assetCategory:1, 
        assetName:1, 
        assetId:1,
        assetUom:1, moduleCode:1, transtypeCode:1, transactionid:1, entityAsset:1,
        effectiveDate:1, expiryDate:1, organizationId: 1
    };
    aggregateArr.push({ $project: projectObj });
    var result = await Asset.aggregate(aggregateArr);
    return result;
}

const getAssets = async (payloadData) => {
      // const conditionObj = {
    //     transactionEntity: payloadData["transactionEntity"]
    // };
    const conditionObj = {}
    const conditionObj1 ={}

    if(payloadData.transactionEntity){
        conditionObj.transactionEntity = payloadData.transactionEntity
    }
    if(payloadData.transactionid){
        conditionObj.transactionid = payloadData.transactionid
    }
    if(payloadData.transactionTypeCode){
        conditionObj.transtypeCode = payloadData.transactionTypeCode
    }
    if(payloadData.inputAssetFlag){
        conditionObj.assetType = "Produce Asset"
    }
    if ("statusFlag" in payloadData && payloadData.statusFlag) {
        conditionObj["status"] = { $ne:payloadData.statusFlag};
    }
    // if("transactionEntity" in payloadData){
    //     conditionObj["transactionEntity"] = { $in: transactionEntity };
    // }

    // if("transactionid" in payloadData){
    //     conditionObj["transactionid"] = { $in: transactionid };
    // }
    if ("assetType" in payloadData && payloadData.assetType && payloadData.assetType.length) {
        const assetTypeArr = payloadData.assetType.map((e) => RegExp(`${e}`, 'i'));
        conditionObj["assetType"] = { $in: assetTypeArr };
    }

    // if ("searchKey" in payloadData && payloadData.searchKey) {
    //         conditionObj["$or"] = [
    //             { "assetName": { $regex: payloadData.searchKey, $options: "i" } },
    //             { "assetId": { $regex: payloadData.searchKey, $options: "i" } }
    //         ]
    // }

    if ("assetName" in payloadData && payloadData.assetName) {
        conditionObj["assetName"] = { $regex: payloadData.assetName, $options: "i" } 
    }
    if ("assetId" in payloadData && payloadData.assetId) {
        conditionObj["assetId"] = { $regex: payloadData.assetId, $options: "i" } 
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
    if ("assetTransactionId" in payloadData && payloadData.assetTransactionId) {
        conditionObj1["transactionid"] = { $regex: payloadData.assetTransactionId, $options: "i" } 
    }
    if ("status" in payloadData && payloadData.status) {
        conditionObj["customstatus"] = { $regex: payloadData.status, $options: "i" } 
    }
    if ("assetCategory" in payloadData && payloadData.assetCategory) {
        conditionObj1["assetcategory.assetCategory"] = { $regex: payloadData.assetCategory, $options: "i" } 
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
            // { "refEntityDetails.location": { $regex: payloadData.branchLocation, $options: "i" } }
        ] 
    }
    if ("partnerBranch" in payloadData && payloadData.partnerBranch) {
        conditionObj1["department.name"] = { $regex: payloadData.partnerBranch, $options: "i" } 
    }
    if ("searchKey" in payloadData && payloadData.searchKey) {
        conditionObj1['$and'] = [{
            $or: [
                { 'assetId': { $regex: `${payloadData.searchKey}`, $options: "i" } },
                { 'assetName': { $regex: `${payloadData.searchKey}`, $options: "i" } },
                { 'transactionid': { $regex: `${payloadData.searchKey}`, $options: "i" } },
                { 'transtypeCode': { $regex: `${payloadData.searchKey}`, $options: "i" } },
                { 'moduleCode': { $regex: `${payloadData.searchKey}`, $options: "i" } },
                { 'assetcategory.assetCategory': { $regex: `${payloadData.searchKey}`, $options: "i" } },
                { 'transtype.transactionTypeName': { $regex: `${payloadData.searchKey}`, $options: "i" }},
                { 'module.name': { $regex: `${payloadData.searchKey}`, $options: "i" } },
                { 'location' :  { $regex: payloadData.searchKey, $options: "i" } },
                { 'customstatus' :  { $regex: payloadData.searchKey, $options: "i" } },
                { "department.code": { $regex: payloadData.searchKey, $options: "i" } },
                { "department.name": { $regex: payloadData.searchKey, $options: "i" } },
                { "transactionEntityDetails.location": { $regex: payloadData.searchKey, $options: "i" } },
                { "refEntityDetails.companyName": { $regex: payloadData.searchKey, $options: "i" } },
                { "refEntityDetails.name": { $regex: payloadData.searchKey, $options: "i" } },
            ]
        }]
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
                localField: "assetCategory",
                foreignField: "_id",
                as: "assetcategory",
               
            }
        },
        {
            "$unwind":{
               "path":"$assetcategory",
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
                            "$$organizationId",
                            "$organizationId"
                        ]
                        },
                        {
                        "$or":[
                            {
                            "$eq":[
                                "$$transactionEntityBranch",
                                "$code"
                            ]
                            }
                        ]
                    }
                ],
                
            },
            
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
                "let": { "assetUom": "$assetUom","orgId": "$organizationId" },
                as: "uom",
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
            assetName: 1,
            assetId: 1
        };

        aggregateArr.push({ $project: projectObj });
    }

    let sortKey = "modified_on";
    let sortOrder = -1;
    if("sortKey" in payloadData && "sortOrder" in payloadData && payloadData.sortKey && payloadData.sortOrder){
        sortKey = payloadData.sortKey;
        if( payloadData.sortKey == 'transactionTypeName'){
            sortKey = "transtype.transactionTypeName"
        }
        if( payloadData.sortKey == 'moduleName'){
            sortKey = "module.name"
        }
        if( payloadData.sortKey == 'moduleId'){
            sortKey = "moduleCode"
        }
        if( payloadData.sortKey == 'assetCategory'){
            sortKey = "assetcategory.assetCategory"
        }
        if( payloadData.sortKey == 'assetLocation'){
            sortKey = "location"
        }
        if( payloadData.sortKey == 'partnerBranch'){
            sortKey = "department.name"
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
    var assetDetails = await Asset.aggregate(aggregateArr);
    const responseObj = {
        'totalCount': assetDetails[0]['totalCount'] && assetDetails[0]['totalCount'].length ? assetDetails[0]['totalCount'][0]['count'] : 0,
        'result': assetDetails[0]['paginatedResults']
    };
    return responseObj;
}

const totalReceivedAssets = async (payloadData) =>{
        let whereObj={};
            
        whereObj.is_deleted = false;
        whereObj.assetType = "Receive Asset";
        
        const aggregateArr = [
            {
                $match: whereObj
            },
            {
                $project: {
                    transactionid:1,     
                    refOrder:'$refOrder'               
                }
            },
            {
                $group: {
                    _id: { refOrder: "$refOrder" },
                    totalReceivedQty: { $sum: 1 }
                }
            },
        ]
        const categoriesResultArr = await SubCategories.aggregate(aggregateArr).allowDiskUse(true);
        return categoriesResultArr;
    };

    const getEntityAssets = async (payloadData) => {
        const conditionObj = {};
    
        if(payloadData.transactionEntity){
            conditionObj.entity = payloadData.transactionEntity
        }
        if(payloadData.transactionEntityBranch){
            conditionObj.entityBranch = payloadData.transactionEntityBranch
        }
        if(payloadData.organizationId){
            conditionObj.organizationId = ObjectId(payloadData.organizationId)
        }
        if(payloadData._id){
            conditionObj._id = ObjectId(payloadData._id)
        }
        // if(payloadData.assetCategory){
        //     conditionObj.assetCategory = ObjectId(payloadData.assetCategory)
        // }
    
        if("getAllBalancedQuantity" in payloadData && payloadData.getAllBalancedQuantity == "true"){
            delete conditionObj["balancedQuantity"]
        } else {
            conditionObj["balancedQuantity"] = {$gt: 0};   
        }
        
        if ("assetName" in payloadData && payloadData.assetName) {
            conditionObj["asset.assetName"] = { $regex: payloadData.assetName, $options: "i" } 
        }
        
        if ("assetId" in payloadData && payloadData.assetId) {
            conditionObj["assetId"] = { $regex: payloadData.assetId, $options: "i" } 
        }
        
        if ("transactionEntityName" in payloadData && payloadData.transactionEntityName) {
            conditionObj["transactionEntityName"] = { $regex: payloadData.transactionEntityName, $options: "i" } 
        }
    
        if ("assetLocation" in payloadData && payloadData.assetLocation) {
            conditionObj["asset.location"] = { $regex: payloadData.assetLocation, $options: "i" } 
        }
        
        if ("assetTransactionId" in payloadData && payloadData.assetTransactionId) {
            conditionObj["transactionid"] = { $regex: payloadData.assetTransactionId, $options: "i" } 
        }
        
        if ("assetType" in payloadData && payloadData.assetType) {
            conditionObj["assetType"] = { $regex: payloadData.assetType, $options: "i" } 
        }
        if ("assetCategory" in payloadData && payloadData.assetCategory) {
            conditionObj["assetcategory.assetCategory"] = { $regex: payloadData.assetCategory, $options: "i" } 
        }
        if ("searchKey" in payloadData && payloadData.searchKey) {
            conditionObj['$and'] = [{
                $or: [
                    { 'asset.assetName': { $regex: `${payloadData.searchKey}`, $options: "i" } },
                    { 'assetId': { $regex: `${payloadData.searchKey}`, $options: "i" } },
                    { 'additionalDescription': { $regex: `${payloadData.searchKey}`, $options: "i" } },
                    { 'transactionEntityName': { $regex: `${payloadData.searchKey}`, $options: "i" } },
                    { 'asset.location': { $regex: `${payloadData.searchKey}`, $options: "i" } },
                    { 'transactionid': { $regex: `${payloadData.searchKey}`, $options: "i" } },
                    { 'assetType': { $regex: `${payloadData.searchKey}`, $options: "i" } },
                    { 'assetcategory.assetCategory': { $regex: `${payloadData.searchKey}`, $options: "i" } }                   
                ]
            }]
        }
        if ("inputAssetSearch_key" in payloadData && payloadData.inputAssetSearch_key) {
            conditionObj['$and'] = [{
                $or: [
                    { 'asset.assetName': { $regex: `${payloadData.inputAssetSearch_key}`, $options: "i" } },
                    { 'assetId': { $regex: `${payloadData.inputAssetSearch_key}`, $options: "i" } },
                    { 'assetcategory.assetCategory': { $regex: `${payloadData.inputAssetSearch_key}`, $options: "i" } },
                    { 'assetUom': { $regex: `${payloadData.inputAssetSearch_key}`, $options: "i" } },
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
                        "$assetId",
                        "$$assetId"
                    ]
                }
            },            
        ];

        if(payloadData.transactionid) {
            andObj.push({
                "$expr":{
                    "$eq":[
                        "$transactionid",
                        "$$transactionid"
                        ]
                    }
            });
        }

        if(payloadData.assetStatus) {
            andObj.push({
                "$expr":{
                    "$eq":[
                        "$status",
                        "$$status"
                        ]
                    }
            });
        }

        if(payloadData.transactionEntityBranch) {
            andObj.push({
                "$expr":{
                    "$eq":[
                        "$transactionEntityBranch",
                        "$$transactionEntityBranch"
                        ]
                    }
            });
        }

        if(payloadData.assetCategoryId) {
            andObj.push({
                "$expr":{
                    "$eq":[
                        "$assetCategory",
                        "$$assetCategoryId"
                        ]
                    }
            });
        }



        const aggregateArr = [
            {
                $addFields: {
                    balancedQuantityString: { $toString: '$balancedQuantity' }  
                },
            },
            {
                $lookup: {
                    from: "assets",
                    as: "asset",
                    let: { "transactionid": "$transactionid", "transactionEntity": "$entity","assetId": "$assetId","transactionEntityBranch": "$entityBranch","assetCategoryId": ObjectId(payloadData.assetCategoryId), "status" : payloadData.assetStatus },
                    pipeline: [
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
            
            // {
            //     $lookup: {
            //         from: 'transtypes',
            //         "let": { "transactionTypeCode": "$asset.transtypeCode","orgId": "$organizationId" },
            //         as: "transactionTypeNFT",
            //         pipeline: [
            //             {
            //                 $match: {
            //                     $and: [
            //                         {$expr: { $eq: ['$$transactionTypeCode', '$transactionTypeCode'] }},
            //                         {$expr: { $eq: ["$$orgId", "$organizationId"] }} ,
            //                         ]
            //                 }
            //             },
            //             {
            //                 $group: {
            //                     _id:"$_id",
            //                     nft:{$first:"$nft"}
            //                 }
            //             },
   
            //         ]
            //     }
            // },
            // {
            //     $unwind:{
            //         "path": "$transactionTypeNFT",
            //         "preserveNullAndEmptyArrays": true
            //     }
            // },

            {
                $lookup: {
                    from: "assetcategories",
                    localField: "asset.assetCategory",
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
                    "let": { "assetUom": "$assetUom","orgId": "$organizationId" },
                    as: "uom",
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
                $unwind:{
                    "path": "$uom",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                $match: conditionObj
            }
        ];

        if ("nftFlag" in payloadData && payloadData.nftFlag && payloadData.nftFlag == 'true') {
            aggregateArr.push(
                {
                    $lookup: {
                        from: 'transtypes',
                        "let": { "transactionTypeCode": "$asset.transtypeCode","orgId": "$organizationId", "corpId": "$corporateId", "entity": payloadData.entity },
                        as: "transactionTypeNFT",
                        pipeline: [
                            {
                                $match: {
                                    $and: [
                                        {$expr: { $eq: ['$$transactionTypeCode', '$transactionTypeCode'] }},
                                        // {$expr: { $eq: ["$$orgId", "$organizationId"] }},
                                        {
                                            "$expr":{
                                               
                                                         $cond: { if: { $and:[{$eq: ["$$entity", "corporate"] }]},
                                                         //then: {$eq: ["$corporateId", ObjectId("60d225d3140821001353e72d")] },
                                                         then: {$eq: ["$corporateId", "$$corpId"] },
                                                         else: { $eq: ["$organizationId", "$$orgId"] }
                                                             
                                                         }
                                                   
                                                    } ,
                                                 }
                                        ]
                                }
                            },
                            {
                                $group: {
                                    _id:"$_id",
                                    nft:{$first:"$nft"}
                                }
                            },
       
                        ]
                    }
                },
                {
                    $unwind:{
                        "path": "$transactionTypeNFT",
                        "preserveNullAndEmptyArrays": true
                    }
                },
            )
        }
    
        if ("allFields" in payloadData && payloadData.allFields && payloadData.allFields == 'false') {
            let projectObj = {
                _id: 1,
                //assetType: 1,
                assetName: 1,
                assetId: 1,
                entityAsset: 1
            };
    
            aggregateArr.push({ $project: projectObj });
        }
        let sortKey = "asset.modified_on";
        let sortOrder = -1;
        if("sortKey" in payloadData && "sortOrder" in payloadData && payloadData.sortKey && payloadData.sortOrder){
            sortKey = payloadData.sortKey;
            if(payloadData.sortKey == 'assetName'){
                sortKey = "asset.assetName"
            }
            if(payloadData.sortKey == 'assetLocation'){
                sortKey = "asset.location"
            }
            if(payloadData.sortKey == 'assetCategory'){
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
        const assetDetails = await AssetInventory.aggregate(aggregateArr);
        const responseObj = {
            'result': assetDetails[0]['paginatedResults'],
            'totalCount': assetDetails[0]['totalCount'] && assetDetails[0]['totalCount'].length ? assetDetails[0]['totalCount'][0]['count'] : 0
        };
        return responseObj;
    }
    
const getAssetsList = async (payloadData) => {
    const conditionObj = {};
    if(payloadData.organizationId){
        conditionObj.organizationId = ObjectId(payloadData.organizationId)
    }

   // conditionObj.asset.inputAssets = {"$ne": null }
  // conditionObj["$asset.inputAssets"] = { $ne: null};
    const aggregateArr = [
        {
            $lookup: {
                from: "assets",
                as: "asset",
                let: { "transactionid": "$transactionid", "transactionEntity": "$entity","assetId": "$assetId" },
                pipeline: [
                    {
                        $match: {
                            $and: [
                                { $expr: { $eq: ["$transactionid", "$$transactionid"] } },
                                { $expr: { $eq: ["$transactionEntity", "$$transactionEntity"] } },
                                { $expr: { $eq: ["$assetId", "$$assetId"] } }
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
        },
        {
            $match: conditionObj
        },
        // {
        //     $match:{
        //         '$asset.inputAssets': {"$ne": null }
        //     }
        // },
        {
            $group: {
                _id: { entityAsset: "$entityAsset" },
                assetName:{
                    $first:'$asset.assetName'
                },
                assetId:{
                    $first:'$assetId'
                },
                entityAsset:{
                    $first:'$asset.entityAsset'
                },
                inputAssets:{
                    $first:'$asset.inputAssets'
                },
                assetCategory:{
                    $first:'$asset.assetCategory'
                },
                transactionEntity:{
                    $first:'$asset.transactionEntity'
                },
                location:{
                    $first:'$asset.location'
                },
                effectiveDate:{
                    $first:'$asset.effectiveDate'
                },
                expiryDate:{
                    $first:'$asset.expiryDate'
                },
                upload_file:{
                    $first:'$asset.upload_file'
                },
                upload_certificate: {
                    $first:'$asset.upload_certificate'
                },
                geolocation:{
                    $first:'$asset.geolocation'
                },
                assetMongoId:{
                    $first:'$asset._id'
                },
                assetQuantity:{
                    $first:'$asset.assetQuantity'
                }
            }
        },       
    ];

    if ("allFields" in payloadData && payloadData.allFields && payloadData.allFields == 'false') {
        let projectObj = {
            _id: 1,
            //assetType: 1,
            assetName: 1,
            assetId: 1,
            entityAsset: 1
        };

        aggregateArr.push({ $project: projectObj });
    }

    const assetDetails = await AssetInventory.aggregate(aggregateArr);
    
    return assetDetails;
}

const getAssetFullDetails = async (payloadData) => {
    const conditionObj = {
        _id: ObjectId(payloadData.assetObjectId)
    }

    const result = await Asset.aggregate(
        [
            {
                $match: conditionObj
            },
            {
                $addFields: {
                    'inputAssets': {
                        $filter: {
                            input: "$inputAssets",
                            as: "item",
                            cond: { $eq: ["$$item.inputAssetStatus", "New"] }
                        }
                    }
                }
            },
            {
                $unwind: {
                    "path": "$inputAssets",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                $lookup: {
                    from: 'uoms',
                    "let": { "assetUom": "$inputAssets.inputAssetUom","orgId": "$organizationId" },
                    as: "inputAssets.assetUom_details",
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
                    from: 'assets',
                    "let": { "inputAssetId": "$inputAssets.entity_asset" },
                    as: "inputAssets.inputAssets_details",
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$$inputAssetId', '$entityAsset'] }
                            }
                        },
                        {
                            $group: {
                                _id:"$entityAsset",
                                assetName:{$first:"$assetName"},
                                assetId:{$first:"$assetId"},
                                assetCategory:{$first:"$assetCategory"}
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
                        }
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
                    "let": { "transactionEntityBranch": "$transactionEntityBranch", "refEntityBranch": "$refEntityBranch", "organizationId": "$organizationId" },
                    as: "branch",
                    pipeline: [
                        {
                            $match: {
                                // $expr: { $or: [{ $eq: ['$$transactionEntityBranch', '$code'] }, { $eq: ['$$refEntityBranch', '$code'] }] },
                                  $expr: { $and: [{"$eq":["$$organizationId", "$organizationId"]},
                                  { $or: [{ $eq: ['$$transactionEntityBranch', '$code'] }, { $eq: ['$$refEntityBranch', '$code'] }] }
                                ] }
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
                    localField: "assetCategory",
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
                    "let": { "assetUom": "$assetUom","orgId": "$organizationId" },
                    as: "uom",
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
                $unwind:{
                    "path": "$uom",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                $group: { _id:{assetId:"$assetId",assetName:"$assetName",assetQuantity:"$assetQuantity",
                assetType:"$assetType",assetUom:"$assetUom",effectiveDate:"$effectiveDate",expiryDate:"$expiryDate",
                is_deleted:"$is_deleted",provenance:"$provenance",assetcategory:"$assetcategory",
                 fields:"$fields", geolocation:"$geolocation",entityAsset:"$entityAsset",
                            location: "$location", organizationId:"$organizationId", refEntity:"$refEntity",
                            refEntityBranch: "$refEntityBranch", refEntityType: "$refEntityType", status:"$status",
                            transactionId:"$transactionId",transactionEntity:"$transactionEntity",
                             transactionEntityBranch:"$transactionEntityBranch", uom:"$uom",
                             transactionEntityType: "$transactionEntityType",
                              transtypeCode: "$transtypeCode", "created_by": "$created_by",
                              "created_on":"$created_on", creator_role:"$creator_role", modified_by: "$modified_by",
                              modified_on: "$modified_on","modifier_role":"$modifier_role",
                              moduleCode: "$moduleCode", upload_file: "$upload_file", upload_certificate:"$upload_certificate", branch:"$branch",
                               "refbranch":"$refbranch", transtype:"$transtype",refOrder:"$refOrder",orderId:"$orderId",
                                 transactionEntityDetails: "$transactionEntityDetails",outside_docs: "$outside_docs",
                                 refEntityDetails: "$refEntityDetails",modules:"$modules",transactionid: "$transactionid",
                            },
                            inputAssets: {$addToSet:"$inputAssets"}
                }
            }
        ]
    );
    return result && result.length ? result[0] : null;
}

const updateData = async (payloadData) => {
    if (!payloadData) {
        return false;
    }
    let whereObj = {};
    if(payloadData.id){
        whereObj._id =  ObjectId(payloadData.id)
    }
    if(payloadData.outside_docs){
        return await Asset.findOneAndUpdate(whereObj, { $set: payloadData });
    }
}

const updateAssetFromProvenance = async (assetPayloadData) => {
    console.log("assetPayloadData:",assetPayloadData);
       let conditionObj = {
        // assetType:"Produce Asset"
       };
       let updateSetObj = {};
       if(assetPayloadData.transactionId) { 
           conditionObj.entityAsset =  assetPayloadData.transactionId
        }
        if(assetPayloadData.nftDetails) { 
            // console.log("assetPayloadData.nftDetails:",JSON.parse(assetPayloadData.nftDetails))
            updateSetObj.nftDetails =  JSON.parse(assetPayloadData.nftDetails)
         }
         if(assetPayloadData.nft_status) { 
            // console.log("assetPayloadData.nftDetails:",JSON.parse(assetPayloadData.nftDetails))
            updateSetObj.nft_status =  assetPayloadData.nft_status
         }
       const result = await Asset.updateMany(
        conditionObj,
        { 
            $set: updateSetObj 
        }
    );
    return result;
}

module.exports = {
    addAsset,
    consumedAssets,
    receiveEprAsset,
    findAllAsset,
    findMultipleAsset,
    findAssets,
    updateAsset,
    updateAssets,
    updateRefAsset,
    updateInventory,
    updateInventoryRecords,
    updateAssetStatus,
    updateAssetInventoryStatus,
    receiveAsset,
    updateAssetInventory,
    addMultipleAssets,
    assetQuantityOnAssetType,
    addAssetOnAssetType,
    getAssetDetails,
    getAssets,
    totalReceivedAssets,
    getEntityAssets,
    getAssetFullDetails,
    getAssetsList,
    updateData,
    updateAssetFromProvenance
    
}