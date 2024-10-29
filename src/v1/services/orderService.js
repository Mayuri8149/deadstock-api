const { Order, ObjectId } = require('../models/order');
const { Asset, AssetInventory } = require('../models/asset');
const assetService = require('../services/assetService');
const constants = require("../lang/constant");


    const addOrder = async (payloadData, transtype) => {
        payloadData.created_on = payloadData.modified_on = new Date(Date.now());
        payloadData.is_deleted = false;
        payloadData.orderDetails[0].orderItems.forEach( async (item) => {
            item.line_number = ('000' + item.line_number).substr(-3)
            if(transtype.assetType == constants[3] && item.ordered_assetId == ""){              
                item.ordered_assetId = item.ref_order + '.' + item.line_number
                item.entity_asset = item.ref_order_transactionid + '.' + item.line_number
            }
        })
        const result = await Order.findOneAndUpdate(
            { orderId: payloadData.orderId },
            {
                $set: payloadData
            },
            { new: true, useFindAndModify: false, upsert: true }
        );
        return result;

    }

    const findOrder = async (payloadData) => {
        const result = await Order.findOne(
            {   orderId: payloadData.orderId,
                transactionid: payloadData.transactionid
            }
        );
    
        return result;
    }

    const update = async (payloadData) => {
        payloadData.modified_on = new Date(Date.now());
        let conditionObj = {};
        let updateSet = {};
        if(payloadData.transactionid) { conditionObj.transactionid =  payloadData.transactionid }
        if(payloadData.status) { updateSet.status =  payloadData.status }
        const result = await Order.findOneAndUpdate(conditionObj,
            {
                $set: updateSet
            },
        );
        return result;
    }

    const updateOrderRecord = async (payloadData) => {
        var conditionObj = { }
        var updateSet = { }
        conditionObj.orderId = payloadData.orderId
        conditionObj.transactionid = payloadData.transactionid
        if(payloadData.fields) { updateSet.fields = payloadData.fields }
        if(payloadData.geolocation) { updateSet.geolocation = payloadData.geolocation; 
            updateSet.location = payloadData.geolocation.location; }
        if(payloadData.location) { updateSet.location = payloadData.location }
        
        if (payloadData.orderItems && payloadData.status){
            payloadData.orderItems.map((elem) => {
                conditionObj["orderDetails.0.orderItems.order_item"] = elem.order_item,
                conditionObj["orderDetails.0.orderItems.line_number"] = elem.line_number,
                conditionObj["orderDetails.0.orderItems.order_quantity"] = elem.order_quantity,
                conditionObj["orderDetails.0.orderItems.asset_category"] = ObjectId(elem.asset_category)
                 // conditionObj["orderDetails.0.orderItems.order_uom"] = elem.order_uom, //doubt
                if (elem.ordered_assetId) { conditionObj["orderDetails.0.orderItems.ordered_assetId"] = elem.ordered_assetId; }
                if (elem.ref_order) { conditionObj["orderDetails.0.orderItems.ref_order"] = elem.ref_order; }
                if (elem.ref_order_transactionid) { conditionObj["orderDetails.0.orderItems.ref_order_transactionid"] = elem.ref_order_transactionid; }
                if (elem.accepted_quantity) { conditionObj["orderDetails.0.orderItems.accepted_quantity"] = elem.accepted_quantity; }
                if (elem.rejected_quantity) { conditionObj["orderDetails.0.orderItems.rejected_quantity"] = elem.rejected_quantity; }
                if (elem.rejection_note) { conditionObj["orderDetails.0.orderItems.rejection_note"] = elem.rejection_note; }
            })
            updateSet["orderDetails.0.orderItems.$.status"] =  payloadData.status 
        }else if(!payloadData.orderItems && payloadData.status){
            updateSet.status =  payloadData.status             
        }else if(payloadData.orderItems && !payloadData.status){
            payloadData.orderItems.map(async (elem) => {
                if (elem.order_item) { conditionObj["orderDetails.0.orderItems.order_item"] = elem.order_item }
                if (elem.line_number) { conditionObj["orderDetails.0.orderItems.line_number"] = elem.line_number }
                if (elem.asset_category) { conditionObj["orderDetails.0.orderItems.asset_category"] = ObjectId(elem.asset_category) }
                if (elem.ordered_assetId) { conditionObj["orderDetails.0.orderItems.ordered_assetId"] = elem.ordered_assetId; }
                if (elem.ref_order) { conditionObj["orderDetails.0.orderItems.ref_order"] = elem.ref_order; }
                if (elem.ref_order_transactionid) { conditionObj["orderDetails.0.orderItems.ref_order_transactionid"] = elem.ref_order_transactionid; }
                if (elem.entity_asset) { conditionObj["orderDetails.0.orderItems.entity_asset"] = elem.entity_asset; }
                if (elem.order_uom) { updateSet["orderDetails.0.orderItems.$.order_uom"] = elem.order_uom }
                if (elem.order_quantity) { updateSet["orderDetails.0.orderItems.$.order_quantity"] = elem.order_quantity }
                if (elem.accepted_quantity) { updateSet["orderDetails.0.orderItems.$.accepted_quantity"] = elem.accepted_quantity; }
                if (elem.rejected_quantity) { updateSet["orderDetails.0.orderItems.$.rejected_quantity"] = elem.rejected_quantity; }
                if (elem.rejection_note) { updateSet["orderDetails.0.orderItems.$.rejection_note"] = elem.rejection_note; }
                if (elem.line_level_fields) { updateSet["orderDetails.0.orderItems.$.line_level_fields"] = elem.line_level_fields; }
                if (elem.status) { updateSet["orderDetails.0.orderItems.$.status"] = elem.status; }
                const result = await Order.findOneAndUpdate(conditionObj,
                    {                
                        $set: updateSet
                    }
                );
            })
        }else if(!payloadData.orderItems && !payloadData.status){
            updateSet = payloadData
        }
        const result = await Order.findOneAndUpdate(conditionObj,
            {                
                $set: updateSet
            }
        );
        const statusresult = statusChange(payloadData);
        return result;
    }

    const statusChange = async (payloadData) => {
        const findResult = await findOrder(payloadData);
        var newStatusArray = [];
        const orderCancelled = await findResult.orderDetails[0].orderItems.map((elem) =>{
            if(elem.status == "New")
            newStatusArray.push(elem.status)
            return elem;
        });
        const statusValue = newStatusArray.every((qty) => {console.log('---qty.status',qty); return qty.length==0 ? true :false});
        if(statusValue){
            const updateres = await Order.findOneAndUpdate(
                {
                    orderId : payloadData.orderId,
                    transactionid : payloadData.transactionid
                },
                {                
                    $set: {
                        status : constants[6]
                    }
                }
            );
            return updateres;
        }
        return payloadData
    }

    const updateOrderStatus =  async (payloadData, order, assetWithoutReference) => {
        updateData = {};
        const orderpayloadData = payloadData.map((elem) => { 
        const orderObj = {
            "orderId" : elem.ref_order,
            "transactionid" : elem.ref_order_transactionid,
            "objectID" : elem.objectID,
            "ship_quantity" : elem.order_quantity
        }

            if(payloadData[0].accepted_quantity){
                updateData.transactionid = elem.ref_order_transactionid;
                updateData.status = "Closed";
                const result = update(updateData);
            }
            return orderObj;
        });

        if(!payloadData[0].accepted_quantity && !assetWithoutReference){
            orderpayloadData.forEach( async (item) => {           
                const orderresult = await Order.findOne(
                    {   transactionid:item.transactionid,
                        orderId: item.orderId                        
                    })
                    
                    orderresult.orderDetails[0].orderItems.map( (arr) => {
                        var quantityData = {};
                        quantityData.refStepOrder = order.orderId,
                        quantityData.refStepOrderTransactionid = order.transactionid
                        quantityData.refStepQuantity = item.ship_quantity
                        if(arr.quantity_data.length){
                            const indexValue = arr.quantity_data.length - 1;
                            const refRemainedQuantity = arr.quantity_data[indexValue].refRemainedQuantity;
                            quantityData.refRemainedQuantity = (refRemainedQuantity - item.ship_quantity).toFixed(2);                     
                        }else{
                            quantityData.refRemainedQuantity = (arr.order_quantity - item.ship_quantity).toFixed(2)                      
                        }
                            if(arr._id == item.objectID){
                                if(quantityData.refRemainedQuantity <= (0 || 0.00)){
                                    arr.status = constants[5]
                                }
                                arr.quantity_data.push(quantityData)
                            }
                    })
                    orderresult.save()
                    const result = await closeOrder(orderresult);             
            });
        }
    }

    const closeOrder = async (orderresult) => {
        var quantityArr = [];
        var nullquantityArr = [];
        const orderClose = await orderresult.orderDetails[0].orderItems.map((quantity) =>{
            nullquantityArr.push(quantity.quantity_data)
            if(quantity.quantity_data.length > 0)
            quantityArr.push(quantity.quantity_data[quantity.quantity_data.length - 1].refRemainedQuantity)
            return quantity;
        });
            const noQtyArrValue = nullquantityArr.some((qty) => {console.log('---qty',qty); return qty.length==0 ? true :false});
            
        if(noQtyArrValue){
                return orderresult;
        }else{
            orderClose.forEach( async (o) => {
                const qtyLessThanZero = quantityArr.every(quantity => quantity <= 0);
                const orderDatapayload = {}
                orderDatapayload.transactionid = orderresult.transactionid
                orderDatapayload.status = 'Closed'
                if(qtyLessThanZero){
                    const result = await update(orderDatapayload);
                }else{
                    return orderresult;
                }

            })
        }
    }

    const getOrders = async (payloadData, user) => {
        const conditionObj = {};
        const conditionObj1 = {};       
        if (payloadData.transactionTypeCode) {
            conditionObj.transtypeCode = payloadData.transactionTypeCode
        }
        if (payloadData.organizationId) {
            conditionObj.organizationId = ObjectId(payloadData.organizationId)
        }
        if ("statusFlag" in payloadData && payloadData.statusFlag) {
            conditionObj["status"] = { $ne:payloadData.statusFlag};
        }
        if (payloadData.transactionEntity && payloadData.entityType) {
            conditionObj[payloadData.entityType] = payloadData.transactionEntity;
        } else if(payloadData.transactionEntity && payloadData.isRefEntity=="true"){
            if (payloadData.branchCode) {
                conditionObj.transactionEntityBranch = payloadData.branchCode
            }
            if (payloadData.trxEntityBranchLocation) {
                conditionObj.refEntityBranch = payloadData.trxEntityBranchLocation
            }
            conditionObj["$or"] = [
                { "transactionEntity": payloadData.transactionEntity },
                { "refEntity": payloadData.transactionEntity }
            ]
            
            if(payloadData.transactionEntity && payloadData.isPartner=="true"){
                conditionObj["$and"] = [
                    { "transactionEntity": { $in : [payloadData.transactionEntity, user.reference.code ]}},
                    { "refEntity": { $in : [payloadData.transactionEntity, user.reference.code ]}},
                ]
            }

        }else if (payloadData.transactionEntity) {
            conditionObj.transactionEntity = payloadData.transactionEntity
        }
        if ("refOrder" in payloadData && payloadData.refOrder) {
            conditionObj["transactionid"] = { $regex: payloadData.refOrder, $options: "i" }
        }
        if ("assetName" in payloadData && payloadData.assetName) {
            conditionObj["assetName"] = { $regex: payloadData.assetName, $options: "i" }
        }
        if ("assetId" in payloadData && payloadData.assetId) {
            conditionObj["assetId"] = { $regex: payloadData.assetId, $options: "i" }
        }
        if ("orderId" in payloadData && payloadData.orderId) {
            conditionObj["orderId"] = { $regex: payloadData.orderId, $options: "i" }
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
        if ("status" in payloadData && payloadData.status) {
            conditionObj["customstatus"] = { $regex: payloadData.status, $options: "i" }
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
        if ("assetLocation" in payloadData && payloadData.assetLocation) {
            conditionObj["location"] = { $regex: payloadData.assetLocation, $options: "i" } 
        }
        if ("status" in payloadData && payloadData.status) {
            conditionObj["customstatus"] = { $regex: payloadData.status, $options: "i" } 
        }
        if ("searchKey" in payloadData && payloadData.searchKey) {
            conditionObj1['$and'] = [{
                $or: [
                    { 'orderId': { $regex: `${payloadData.searchKey}`, $options: "i" } },
                    { 'assetId': { $regex: `${payloadData.searchKey}`, $options: "i" } },
                    { 'assetName': { $regex: `${payloadData.searchKey}`, $options: "i" } },
                    { 'transtypeCode': { $regex: `${payloadData.searchKey}`, $options: "i" } },
                    { 'moduleCode': { $regex: `${payloadData.searchKey}`, $options: "i" } },
                    { 'assetcategory.assetCategory': { $regex: `${payloadData.searchKey}`, $options: "i" } },
                    { 'transtype.transactionTypeName': { $regex: `${payloadData.searchKey}`, $options: "i" } },
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
                "$addFields":{
                   "customstatus":{
                      "$switch":{
                         "branches":[
                            {
                               "case":{
                                  "$eq":[
                                     "$status",
                                     "New"
                                  ]
                               },
                               "then":"Open"
                            },
                            {
                               "case":{
                                  "$ne":[
                                     "$status",
                                     "New"
                                  ]
                               },
                               "then":"Closed"
                            }
                         ]
                      }
                   }
                }
             },
             {
                $match: conditionObj
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
                "$project":{
                   //"allEntityTypes":0,
                   "organizations_details":0,
                   //"corporates_details":0
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
                $project: {"allEntityTypes":0, "refcorporates_details":0,"corporates_details":0}
            },
              {
                $match: conditionObj1
            },
        ];
    
        if ("allFields" in payloadData && payloadData.allFields && payloadData.allFields == 'true') {
            aggregateArr.push(
                {
                    $match: {
                        $expr: { $eq: ['$status', 'New'] }
                    }
                },
                {$unwind: "$orderDetails"},
                {$unwind: "$orderDetails.orderItems"},
                {
                    $match: {
                        $expr: { $eq: ['$orderDetails.orderItems.status', 'New'] }
                    }
                },
                {
                    $lookup: {
                        from: 'assetcategories',
                        "let": { "assetCatId": "$orderDetails.orderItems.asset_category" },
                        as: "orderDetails.orderItems.assetcat_details",
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ['$$assetCatId', '$_id'] }
                                }
                            },
                            {
                                $group: {
                                    _id:"$_id",
                                    assetCategory:{$first:"$assetCategory"}
                                }
                            },
        
                        ]
                    }
                },
                {
                    $lookup: {
                        from: 'uoms',
                        "let": { "assetUom": "$orderDetails.orderItems.order_uom","orgId": "$organizationId" },
                        as: "orderDetails.orderItems.assetUom_details",
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
                    "$addFields":{
                       "orderDetails.orderItems.quantity_data":{
                          "$filter":{
                            "input":"$orderDetails.orderItems.quantity_data",
                            "as":"item",
                            "cond": { "$eq": ["$$item.refStepDate", { "$max": "$orderDetails.orderItems.quantity_data.refStepDate" }] }
                          }
                       },
                    }
                },
                {
                $group: { _id:{id:"$_id",orderId:"$orderId", fields:"$fields", geolocation:"$geolocation",
                            location: "$location", organizationId:"$organizationId", refEntity:"$refEntity",
                            refEntityBranch: "$refEntityBranch", refEntityType: "$refEntityType", status:"$status",nft_status: "$nft_status",
                            transactionId:"$transactionId",transactionEntity:"$transactionEntity",
                             transactionEntityBranch:"$transactionEntityBranch",  
                             transactionEntityType: "$transactionEntityType",
                              transtypeCode: "$transtypeCode", "created_by": "$created_by",
                              "created_on":"$created_on", creator_role:"$creator_role", modified_by: "$modified_by",
                              modified_on: "$modified_on","modifier_role":"$modifier_role",
                              moduleCode: "$moduleCode", upload_file: "$upload_file", upload_certificate: "$upload_certificate",branch:"$branch",
                               "refbranch":"$refbranch", transtype:"$transtype",
                                 transactionEntityDetails: "$transactionEntityDetails",
                                 quantityDetails: "$quantityDetails",
                                 refEntityDetails: "$refEntityDetails",outside_docs: "$outside_docs",
                                 allRefEntityTypes: "$allRefEntityTypes", reforganizations_details: "$reforganizations_details",
                                 module: "$module", department : "$department",
                                 modules:"$modules",transactionid: "$transactionid",customstatus: "$customstatus",trans_from_address: "$trans_from_address"
                        },
                        orderDetails: {$addToSet:"$orderDetails"}
                }

            },
            {$sort:{"_id.modified_on":-1}},
            )

            let projectObj = {
                _id: 1,
                status: 1,
                orderDetails: 1,
                orderId: 1
            };
    
            aggregateArr.push({ $project: projectObj});
        }
        let sortKey = "modified_on";
        let sortOrder = -1;
        if ("sortKey" in payloadData && "sortOrder" in payloadData && payloadData.sortKey && payloadData.sortOrder) {
            sortKey = payloadData.sortKey;
            if( payloadData.sortKey == 'assetName'){
                sortKey = "asset.assetName"
            }
            if( payloadData.sortKey == 'assetLocation'){
                sortKey = "location"
            }
            if( payloadData.sortKey == 'assetCategory'){
                sortKey = "assetcategory.assetCategory"
            }
            if( payloadData.sortKey == 'transactionTypeName'){
                sortKey = "transtype.transactionTypeName"
            }
            if( payloadData.sortKey == 'moduleName'){
                sortKey = "module.name"
            }
            sortOrder = payloadData.sortOrder.toLowerCase() == "desc" ? -1 : 1;
        }
        aggregateArr.push(
            {
                $sort: {
                    [sortKey]: sortOrder
                }
            }
        )
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
        var orderDetails = await Order.aggregate(aggregateArr);
        const responseObj = {
            'totalCount': orderDetails[0]['totalCount'] && orderDetails[0]['totalCount'].length ? orderDetails[0]['totalCount'][0]['count'] : 0,
            'result': orderDetails[0]['paginatedResults']
        };
        return responseObj;
    }

    const getPartnerOrders = async (payloadData) => {
        const conditionObj = {};
        const conditionObj1 = {}
    
       
        if (payloadData.refEntity) {
            conditionObj.refEntity = payloadData.refEntity;
        }
        // if (payloadData.transactionEntity) {
        //     conditionObj.transactionEntity = {"$ne":payloadData.transactionEntity}
        // }
        if ("assetName" in payloadData && payloadData.assetName) {
            conditionObj["assetName"] = { $regex: payloadData.assetName, $options: "i" }
        }
        if ("assetId" in payloadData && payloadData.assetId) {
            conditionObj["assetId"] = { $regex: payloadData.assetId, $options: "i" }
        }
        if ("orderId" in payloadData && payloadData.orderId) {
            conditionObj["orderId"] = { $regex: payloadData.orderId, $options: "i" }
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
        if ("status" in payloadData && payloadData.status) {
            conditionObj["customstatus"] = { $regex: payloadData.status, $options: "i" }
        }
        if ("refEntityName" in payloadData && payloadData.refEntityName) {
            conditionObj["$or"] = [
                { "refEntityDetails.companyName": { $regex: payloadData.refEntityName, $options: "i" } },
                { "refEntityDetails.name": { $regex: payloadData.refEntityName, $options: "i" } },
               ]
        }
        if ("branchLocation" in payloadData && payloadData.branchLocation) {
            conditionObj1["$or"] = [
                { "department.branch_location": { $regex: payloadData.branchLocation, $options: "i" } },
                { "department.name": { $regex: payloadData.branchLocation, $options: "i" } },
                { "transactionEntityDetails.location": { $regex: payloadData.branchLocation, $options: "i" } },
                // { "refEntityDetails.location": { $regex: payloadData.branchLocation, $options: "i" } }    
            ]
        }

        if ("searchKey" in payloadData && payloadData.searchKey) {
            conditionObj1['$and'] = [{
                $or: [
                    { 'orderId': { $regex: `${payloadData.searchKey}`, $options: "i" } },
                    { 'assetId': { $regex: `${payloadData.searchKey}`, $options: "i" } },
                    { 'assetName': { $regex: `${payloadData.searchKey}`, $options: "i" } },
                    { 'transtypeCode': { $regex: `${payloadData.searchKey}`, $options: "i" } },
                    { 'moduleCode': { $regex: `${payloadData.searchKey}`, $options: "i" } },
                    { 'transtype.transactionTypeName': { $regex: `${payloadData.searchKey}`, $options: "i" } },
                    { 'module.name': { $regex: `${payloadData.searchKey}`, $options: "i" } },
                    { 'customstatus' :  { $regex: payloadData.searchKey, $options: "i" } },
                    { "department.branch_location": { $regex: payloadData.searchKey, $options: "i" } },
                    { "department.name": { $regex: payloadData.searchKey, $options: "i" } },
                    { "transactionEntityDetails.location": { $regex: payloadData.searchKey, $options: "i" } },
                    { "refEntityDetails.companyName": { $regex: payloadData.searchKey, $options: "i" } },
                    { "refEntityDetails.name": { $regex: payloadData.searchKey, $options: "i" } },
                ]
            }]
        }
 
        const aggregateArr = [
            {
                $addFields: {
                    "customstatus": {
                        "$switch": {
                            "branches": [
                                { "case": { "$eq": ["$status", "New"] }, "then": "Open" },
                                { "case": { "$ne": ["$status", "New"] }, "then": "Closed" }
                            ]
                        }
                    }
                }
            },
            {
                $match: conditionObj
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
                      "refEntityBranch":"$refEntityBranch",
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
                                  {
                                    "$eq":[
                                        "$$organizationId",
                                        "$organizationId"
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
                "$unwind":{
                   "path":"$department",
                   "preserveNullAndEmptyArrays":true
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
                "$project":{
                   //"allEntityTypes":0,
                   "organizations_details":0,
                   //"corporates_details":0
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
                $project: {"allEntityTypes":0, "refcorporates_details":0,"corporates_details":0}
            },
        {
                $match: conditionObj1
            }
        ];
    
        if ("allFields" in payloadData && payloadData.allFields && payloadData.allFields == 'false') {
            let projectObj = {
                _id: 1,
                status: 1,
                orderDetails: 1,
                orderId: 1
            };
    
            aggregateArr.push({ $project: projectObj });
        }
    
        let sortKey = "orderId";
        let sortOrder = -1;
        if ("sortKey" in payloadData && "sortOrder" in payloadData && payloadData.sortKey && payloadData.sortOrder) {
            sortKey = payloadData.sortKey;
            if( payloadData.sortKey == 'moduleName'){
                sortKey = "module.name"
            }
            if( payloadData.sortKey == 'transactionTypeName'){
                sortKey = "transtype.transactionTypeName"
            }
            sortOrder = payloadData.sortOrder.toLowerCase() == "desc" ? -1 : 1;
        }
        aggregateArr.push({
            $unwind: {
                "path": "$orderDetails",
                "preserveNullAndEmptyArrays": true
            }
        },
            {
                $sort: {
                    [sortKey]: sortOrder
                }
            }
        )
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
        var orderDetails = await Order.aggregate(aggregateArr);
        const responseObj = {
            'totalCount': orderDetails[0]['totalCount'] && orderDetails[0]['totalCount'].length ? orderDetails[0]['totalCount'][0]['count'] : 0,
            'result': orderDetails[0]['paginatedResults']
        };
        return responseObj;
    }

    const getSumAssets = async (payloadData) => {
    
        const result = await assetService.getAssets(payloadData);
        return result;
    }
    
    const getOrderFullDetails = async (payloadData) => {
        const conditionObj = {
            _id: ObjectId(payloadData.orderObjectId)
        }
        const result = await Order.aggregate(
            [
                {
                    $match: conditionObj
                },
                {
                    $unwind: {
                        "path": "$orderDetails",
                        "preserveNullAndEmptyArrays": true
                    }
                },
                {
                    $addFields: {
                        'orderDetails.orderItems': {
                            $filter: {
                                input: "$orderDetails.orderItems",
                                as: "item",
                                cond: { $eq: ["$$item.status", "New"] }
                            }
                        }
                    }
                },
                {
                    $unwind: {
                        "path": "$orderDetails.orderItems",
                        "preserveNullAndEmptyArrays": true
                    }
                },
                {
                    $lookup: {
                        from: 'assetcategories',
                        "let": { "assetCatId": "$orderDetails.orderItems.asset_category" },
                        as: "orderDetails.orderItems.assetcat_details",
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ['$$assetCatId', '$_id'] }
                                }
                            },
    
                        ]
                    }
                },
                {
                    $lookup: {
                        from: 'uoms',
                        "let": { "assetUom": "$orderDetails.orderItems.order_uom","orgId": "$organizationId" },
                        as: "orderDetails.orderItems.assetUom_details",
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
                        "let": { "transactionEntityBranch": "$transactionEntityBranch","organizationId": "$organizationId"  },
                        as: "branch",
                        pipeline: [
                            {
                                $match: {
                                    $and: [
                                    {$expr: { $eq: ['$$transactionEntityBranch', '$code']  }},
                                    {$expr: { $eq: ["$organizationId", "$$organizationId"] }}
                                    ]
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
                            },
    
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
                        'from': "assets",
                        "as": "assets",
                        "localField": "transactionid",
                        "foreignField": "orderId"
                    }
                },
                {
                    $unwind: {
                        "path": "$assets",
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
                    $group: { _id:{orderId:"$orderId", fields:"$fields", geolocation:"$geolocation",
                                location: "$location", organizationId:"$organizationId", refEntity:"$refEntity",
                                refEntityBranch: "$refEntityBranch", refEntityType: "$refEntityType", status:"$status",
                                transactionId:"$transactionId",transactionEntity:"$transactionEntity",
                                    transactionEntityBranch:"$transactionEntityBranch",  
                                    transactionEntityType: "$transactionEntityType",
                                    transtypeCode: "$transtypeCode", "created_by": "$created_by",
                                    "created_on":"$created_on", creator_role:"$creator_role", modified_by: "$modified_by",
                                    modified_on: "$modified_on","modifier_role":"$modifier_role",
                                    moduleCode: "$moduleCode", upload_file: "$upload_file", upload_certificate: "$upload_certificate",branch:"$branch",
                                    "refbranch":"$refbranch", transtype:"$transtype",outside_docs: "$outside_docs",
                                        transactionEntityDetails: "$transactionEntityDetails",
                                        refEntityDetails: "$refEntityDetails",modules:"$modules",transactionid: "$transactionid",
                                },
                                orderDetails: {$addToSet:"$orderDetails.orderItems"}
                    }
                }
            ]
        );
        return result && result.length ? result[0] : null;
    }

    const getTraceabilityDetails = async (payloadData) => {
        const aggregateArr = [
            {
                $match:{
                    is_deleted:false,
                    organizationId:ObjectId(payloadData.organizationId),
                    transtypeCode:{$in:payloadData.transactionCode}
                   
                }
            },
            { '$unwind': { path: "$orderDetails", preserveNullAndEmptyArrays: true } },
             { '$unwind': { path: "$orderDetails.orderItems", preserveNullAndEmptyArrays: true } },
             {
                 $match:{ "orderDetails.orderItems.entity_asset":{$in:payloadData.inputAssetArr}}},
             {
                 $addFields:{
                    "orderDetails.orderItems.trace.assetId" :"$orderDetails.orderItems.ordered_assetId",
                    "orderDetails.orderItems.trace.entityAsset" :"$orderDetails.orderItems.entity_asset",
                    "orderDetails.orderItems.trace.assetName" :"$orderDetails.orderItems.order_item",
                    "orderDetails.orderItems.trace.extrainfo_fields" :"$orderDetails.orderItems.line_level_fields",
                    "orderDetails.orderItems.trace.quantity" :"$orderDetails.orderItems.order_quantity",
                    "orderDetails.orderItems.trace.uom" :"$orderDetails.orderItems.order_uom",
                    "orderDetails.orderItems.trace.transtypeCode" :"$transtypeCode",
                    "orderDetails.orderItems.trace.transactionEntity" :"$transactionEntity",
                    "orderDetails.orderItems.trace.transactionEntityType" :"$transactionEntityType",
                    "orderDetails.orderItems.trace.transactionEntityBranch" :"$transactionEntityBranch",
                    "orderDetails.orderItems.trace.moduleCode" :"$moduleCode",
                    "orderDetails.orderItems.trace.refEntity" :"$refEntity",
                    "orderDetails.orderItems.trace.refEntityType" :"$refEntityType",
                    "orderDetails.orderItems.trace.refEntityBranch" :"$refEntityBranch",
                    "orderDetails.orderItems.trace.organizationId" :"$organizationId",
                    "orderDetails.orderItems.trace.status" :"$status",
                    "orderDetails.orderItems.trace.upload_cert" :"$upload_certificate",
                    "orderDetails.orderItems.trace.created_on" :"$created_on",
                    "orderDetails.orderItems.trace.assetCategory" :"$asset_category",
                    "orderDetails.orderItems.trace.assetType" :"$assetType",
                   // "orderDetails.orderItems.trace.mongo_id" :"$_id",
             }},
            {
                $group:{
                    _id:1,
                    orderArr:{$push:"$orderDetails.orderItems.trace"}
                }
            },
           
            {
              $lookup:{
                  from:"assets",
                  "let":{organizationId:"$organizationId"},
                  "as":"assetArr",
                  "pipeline":[
                      {
                          $match:{
                              "$expr": {
                                            "$and": [{ "$eq": ["$organizationId", ObjectId(payloadData.organizationId)] },
                                            { "$in": ["$entityAsset", payloadData.inputAssetArr] },
                                            { "$in": ["$transtypeCode", payloadData.transactionCode] },
                                            //:{$in:["1002","1003","1005","1006", "1007","1008", "1009"]}
                                           // {"entityAsset":{$in:["I7993.B001.FG1204","7842.RM1303"]}}
                                           
                                            ]
                                        }
                          }
                      },
                      {
                          $project: {
                             _id:0,
                              //"mongo_id" :"$_id",
                                "assetId" :1,
                                "entityAsset" :1,
                                "assetName" :1,
                                "extrainfo_fields" :"$fields",
                                "quantity" :"$assetQuantity",
                                "uom" :"$assetUom",
                                // "transtypeCode" :"$transtypeCode",
                                // "transactionEntity" :"$transactionEntity",
                                // "transactionEntityType" :"$transactionEntityType",
                                // "refEntity" :"$refEntity",
                                // "refEntityType" :"$refEntityType",
                                // "moduleCode" :"$moduleCode",
                                "assetCategory" :"$assetCategory",
                                "transtypeCode" :"$transtypeCode",
                                "transactionEntity" :"$transactionEntity",
                                "transactionEntityType" :"$transactionEntityType",
                                "transactionEntityBranch" :"$transactionEntityBranch",
                                "moduleCode" :"$moduleCode",
                                "refEntity" :"$refEntity",
                                "refEntityType" :"$refEntityType",
                                "refEntityBranch" :"$refEntityBranch",
                                "organizationId" :"$organizationId",
                                "status" :"$status",
                                "effectiveDate" :"$effectiveDate",
                                "expiryDate" :"$expiryDate",
                                "location" :"$location",
                                "geolocation" :"$geolocation",
                                "inputAssets":"$inputAssets",
                                "upload_cert":"$upload_certificate",
                                "created_on" :"$created_on",
                                "assetType":"$assetType"
                          }
                      }
                  ]
              }  
            },
            {
              "$addFields":{
                 "allTraceData":{
                    "$concatArrays":[
                      "$orderArr",
                      "$assetArr"
                    ]
                 },
                 
              }
            },
            {$project:{"allTraceData":1}},
            { $unwind: "$allTraceData" },
            {
                $lookup:{
                    from:"transactiontypes",
                    "let":{organizationId:"$allTraceData.organizationId", transtypeCode:"$allTraceData.transtypeCode"},
                    "as":"allTraceData.transtype",
                    "pipeline":[
                        {
                            $match:{
                                "$expr": {
                                              "$and": [{ "$eq": ["$organizationId",  ObjectId(payloadData.organizationId)] },
                                              { "$eq": ["$transactionTypeCode", "$$transtypeCode" ] } //$$transtypeCode"
                                              ]
                                }
                            }}
                            ]
                }
            },
            {
                "$lookup":{
                   "from":"organizations",
                   "let":{organizationId:"$allTraceData.organizationId", transactionEntity:"$allTraceData.transactionEntity"},
                   "as":"allTraceData.organizations_details",
                   "pipeline":[
                      {
                         "$match":{
                            "$expr": {
                                "$and": 
                                [
                                    //{ "$eq": ["$$_id",  ObjectId(payloadData.organizationId)] },
                                    { "$eq": ["$code", "$$transactionEntity" ] } //$$transtypeCode"
                                ]
                }
                         }
                      }
                   ]
                }
             },
            {
                $lookup:{
                    from:"departments",
                    "let":{organizationId:"$allTraceData.organizationId", transactionEntityBranch:"$allTraceData.transactionEntityBranch"},
                    "as":"allTraceData.branchDetails",
                    "pipeline":[
                        {
                            $match:{
                                "$expr": {
                                                "$and": [{ "$eq": ["$$organizationId",  ObjectId(payloadData.organizationId)] },
                                                    { "$eq": ["$code", "$$transactionEntityBranch" ] } //$$transtypeCode"
                                                ]
                                }
                            }
                        }
                            ]
                }
                
            },
                {
                $lookup:{
                    from:"corporates",
                    "let":{organizationId:"$allTraceData.organizationId",
                            transactionEntityType:"$allTraceData.transactionEntityType",
                            transactionEntity:"$allTraceData.transactionEntity"},
                    "as":"allTraceData.corporateDetails",
                    "pipeline":[
                        {
                            $match:{
                                "$expr": {
                                                "$and": [{ "$eq": ["$organizationId",  ObjectId(payloadData.organizationId)] },
                                                        { "$eq": ["$$transactionEntity", "$code" ] } ,
                                                        { "$eq": ["$$transactionEntityType", "Partner" ] }
                                                ]
                                }
                            }}
                            ]
                }
                
            },
            { $replaceRoot: { newRoot: "$allTraceData" } }
        
            //{'$unwind': { path: "$allTraceData", preserveNullAndEmptyArrays: true }}
        ];
        const result = await Order.aggregate(aggregateArr);
        return result && result.length ? result : null;
    }

    const getTraceabilityDetailsAsset = async (payloadData) => {
        console.log("payloadData",payloadData)
        const aggregateArr = [
{
    $match:{
            is_deleted:false,
            organizationId:ObjectId(payloadData.organizationId),
            transtypeCode:{$in: payloadData.transactionCode} ,
           entityAsset:{ "$in":  payloadData.inputAssetArr },
        }
    },
    {
        $project: {
          _id:0,
            "orderId" :null,
            "assetId" :1,
            "entityAsset" :1,
            "assetName" :1,
            "extrainfo_fields" :"$fields",
            "quantity" :"$assetQuantity",
            "uom" :"$assetUom",
            "transtypeCode" :"$transtypeCode",
            "transactionEntity" :"$transactionEntity",
            "transactionEntityType" :"$transactionEntityType",
            "transactionEntityBranch" :"$transactionEntityBranch",
            "moduleCode" :"$moduleCode",
            "refEntity" :"$refEntity",
            "refEntityType" :"$refEntityType",
            "refEntityBranch" :"$refEntityBranch",
            "organizationId" :"$organizationId",
            "status" :"$status",
            "effectiveDate" :"$effectiveDate",
            "expiryDate" :"$expiryDate",
            "location" :"$location",
            "geolocation" :"$geolocation",
            "inputAssets":"$inputAssets",
            "upload_cert":"$upload_certificate",
            "assetCategory" :"$assetCategory",
            "created_on" :"$created_on",
            "assetType":"$assetType"
      }
    },
    {
        $group:{
            _id:"$entityAsset",
            assetArr:{$push:"$$ROOT"}
        }
    },
                     
    {
              $lookup:{
                  from:"orders",
                  "let":{organizationId:"$organizationId"},
                  "as":"orderArr",
                  "pipeline":[
                      {
                          $match:{
                              "$expr": {
                                            "$and": [{ "$eq": ["$organizationId", ObjectId(payloadData.organizationId)] },
                                            { "$in": ["$entityAsset",  payloadData.inputAssetArr] },
                                            { "$in": ["$transtypeCode", payloadData.transactionCode
                                                ] },
                                            ]
                                    }
                          },
                      },
                         
                {'$unwind': { path: "$orderDetails", preserveNullAndEmptyArrays: true } },
             {'$unwind': { path: "$orderDetails.orderItems", preserveNullAndEmptyArrays: true } },
             {$match:{ "orderDetails.orderItems.entity_asset":{$in: payloadData.inputAssetArr}}},
             {
                 $addFields:{
                    "orderDetails.orderItems.trace.orderId" :"$orderId",
                    "orderDetails.orderItems.trace.assetId" :"$orderDetails.orderItems.ordered_assetId",
                    "orderDetails.orderItems.trace.entityAsset" :"$orderDetails.orderItems.entity_asset",
                    "orderDetails.orderItems.trace.assetName" :"$orderDetails.orderItems.order_item",
                    "orderDetails.orderItems.trace.extrainfo_fields" :"$orderDetails.orderItems.line_level_fields",
                    "orderDetails.orderItems.trace.quantity" :"$orderDetails.orderItems.order_quantity",
                    "orderDetails.orderItems.trace.uom" :"$orderDetails.orderItems.order_uom",
                    "orderDetails.orderItems.trace.transtypeCode" :"$transtypeCode",
                    "orderDetails.orderItems.trace.transactionEntity" :"$transactionEntity",
                    "orderDetails.orderItems.trace.transactionEntityType" :"$transactionEntityType",
                    "orderDetails.orderItems.trace.transactionEntityBranch" :"$transactionEntityBranch",
                    "orderDetails.orderItems.trace.moduleCode" :"$moduleCode",
                    "orderDetails.orderItems.trace.refEntity" :"$refEntity",
                    "orderDetails.orderItems.trace.refEntityType" :"$refEntityType",
                    "orderDetails.orderItems.trace.refEntityBranch" :"$refEntityBranch",
                    "orderDetails.orderItems.trace.organizationId" :"$organizationId",
                    "orderDetails.orderItems.trace.status" :"$status",
                    "orderDetails.orderItems.trace.upload_cert" :"$upload_certificate",
                    "orderDetails.orderItems.trace.created_on" :"$created_on",
                    "orderDetails.orderItems.trace.assetCategory" :"$asset_category",
                    "orderDetails.orderItems.trace.assetType" :"$assetType",
                    //"orderDetails.orderItems.trace._id" :"$_id",
             }},
            {
                $group:{
                    _id:"$orderDetails.orderItems.trace.entityAsset",
                    orderArr:{$push:"$orderDetails.orderItems.trace"}
                }
            },
           
            ]
          }  
        },
       
        {
          "$addFields":{
                 "allTraceData":{
                    "$concatArrays":[
                      "$orderArr",
                      "$assetArr"
                    ]
                 },
                 
              }
        },
        {$project:{"allTraceData":1}},
        { $unwind: "$allTraceData" },
         {
          $lookup:{
              from:"transactiontypes",
              "let":{organizationId:"$allTraceData.organizationId", transtypeCode:"$allTraceData.transtypeCode"},
              "as":"allTraceData.transtype",
              "pipeline":[
                  {
                      $match:{
                          "$expr": {
                                        "$and": [{ "$eq": ["$organizationId", ObjectId(payloadData.organizationId)] },
                                        { "$eq": ["$transactionTypeCode", "$$transtypeCode" ] } //$$transtypeCode"
                                        ]
                          }
                      }}
                      ]
          }},
          {
              $lookup:{
                  from:"departments",
                  "let":{organizationId:"$allTraceData.organizationId", transactionEntityBranch:"$allTraceData.transactionEntityBranch"},
                  "as":"allTraceData.branchDetails",
                  "pipeline":[
                      {
                          $match:{
                              "$expr": {
                                            "$and": [{ "$eq": ["$$organizationId", ObjectId(payloadData.organizationId)] },
                                                { "$eq": ["$code", "$$transactionEntityBranch" ] } //$$transtypeCode"
                                            ]
                              }
                          }}
                          ]
              }
             
          },
          {
            "$lookup":{
               "from":"organizations",
               "let":{organizationId:"$allTraceData.organizationId", transactionEntity:"$allTraceData.transactionEntity"},
               "as":"allTraceData.organizations_details",
               "pipeline":[
                  {
                     "$match":{
                        "$expr": {
                            "$and": 
                            [
                                //{ "$eq": ["$$_id",  ObjectId(payloadData.organizationId)] },
                                { "$eq": ["$code", "$$transactionEntity" ] } //$$transtypeCode"
                            ]
            }
                     }
                  }
               ]
            }
         },
             {
              $lookup:{
                  from:"corporates",
                  "let":{organizationId:"$allTraceData.organizationId",
                        transactionEntityType:"$allTraceData.transactionEntityType",
                        transactionEntity:"$allTraceData.transactionEntity"},
                  "as":"allTraceData.corporateDetails",
                  "pipeline":[
                      {
                          $match:{
                              "$expr": {
                                            "$and": [{ "$eq": ["$organizationId", ObjectId(payloadData.organizationId)] },
                                                    { "$eq": ["$$transactionEntity", "$code" ] } ,
                                                    { "$eq": ["$$transactionEntityType", "Partner" ] }
                                            ]
                              }
                          }}
                          ]
              }
             
          },
          { $replaceRoot: { newRoot: "$allTraceData" } }
           
           
    ]
        const result = await Asset.aggregate(aggregateArr);
        return result && result.length ? result : null;
    }

    const getTraceabilityDetailsOrder = async (payloadData) => {
        console.log("payloadData",payloadData)
        const aggregateArr = [
            {
                $match:{
                    is_deleted:false,
                    organizationId:ObjectId(payloadData.organizationId),
                    transtypeCode:{$in:payloadData.transactionCode},
                    orderId:payloadData.orderId,
                }
            },
            { '$unwind': { path: "$orderDetails", preserveNullAndEmptyArrays: true } },
             { '$unwind': { path: "$orderDetails.orderItems", preserveNullAndEmptyArrays: true } },
            //  {
            //      $match:{ "orderDetails.orderItems.entity_asset":{$in:payloadData.inputAssetArr}}},
             {
                 $addFields:{
                    "orderDetails.orderItems.trace.assetId" :"$orderDetails.orderItems.ordered_assetId",
                    "orderDetails.orderItems.trace.entityAsset" :"$orderDetails.orderItems.entity_asset",
                    "orderDetails.orderItems.trace.assetName" :"$orderDetails.orderItems.order_item",
                    "orderDetails.orderItems.trace.extrainfo_fields" :"$orderDetails.orderItems.line_level_fields",
                    "orderDetails.orderItems.trace.quantity" :"$orderDetails.orderItems.order_quantity",
                    "orderDetails.orderItems.trace.uom" :"$orderDetails.orderItems.order_uom",
                    "orderDetails.orderItems.trace.transtypeCode" :"$transtypeCode",
                    "orderDetails.orderItems.trace.transactionEntity" :"$transactionEntity",
                    "orderDetails.orderItems.trace.transactionEntityType" :"$transactionEntityType",
                    "orderDetails.orderItems.trace.transactionEntityBranch" :"$transactionEntityBranch",
                    "orderDetails.orderItems.trace.moduleCode" :"$moduleCode",
                    "orderDetails.orderItems.trace.refEntity" :"$refEntity",
                    "orderDetails.orderItems.trace.refEntityType" :"$refEntityType",
                    "orderDetails.orderItems.trace.refEntityBranch" :"$refEntityBranch",
                    "orderDetails.orderItems.trace.organizationId" :"$organizationId",
                    "orderDetails.orderItems.trace.status" :"$status",
                    "orderDetails.orderItems.trace.upload_cert" :"$upload_certificate",
                    "orderDetails.orderItems.trace.created_on" :"$created_on",
                    "orderDetails.orderItems.trace.assetCategory" :"$asset_category",
                    "orderDetails.orderItems.trace.assetType" :"$assetType",
                    "orderDetails.orderItems.trace.location" :"$location",
                   // "orderDetails.orderItems.trace.mongo_id" :"$_id",
             }},
            {
                $group:{
                    _id:1,
                    orderArr:{$push:"$orderDetails.orderItems.trace"}
                }
            },
           
            {
              $lookup:{
                  from:"assets",
                  "let":{organizationId:"$organizationId"},
                  "as":"assetArr",
                  "pipeline":[
                      {
                          $match:{
                              "$expr": {
                                            "$and": [
                                                { "$eq": ["$organizationId", ObjectId(payloadData.organizationId)] },
                                           // { "$in": ["$entityAsset", payloadData.inputAssetArr] },
                                            { "$in": ["$transtypeCode", payloadData.transactionCode] },
                                            { "$eq": ["$refOrder","7842.AWR1SHO2"] },
                                           // { refOrder:{ $regex: payloadData.orderId, $options: "i" }}
                                            //:{$in:["1002","1003","1005","1006", "1007","1008", "1009"]}
                                           // {"entityAsset":{$in:["I7993.B001.FG1204","7842.RM1303"]}}
                                           
                                            ]
                                        }
                          }
                      },
                      {
                          $project: {
                             _id:0,
                              //"mongo_id" :"$_id",
                                "assetId" :1,
                                "entityAsset" :1,
                                "assetName" :1,
                                "extrainfo_fields" :"$fields",
                                "quantity" :"$assetQuantity",
                                "uom" :"$assetUom",
                                // "transtypeCode" :"$transtypeCode",
                                // "transactionEntity" :"$transactionEntity",
                                // "transactionEntityType" :"$transactionEntityType",
                                // "refEntity" :"$refEntity",
                                // "refEntityType" :"$refEntityType",
                                // "moduleCode" :"$moduleCode",
                                "assetCategory" :"$assetCategory",
                                "transtypeCode" :"$transtypeCode",
                                "transactionEntity" :"$transactionEntity",
                                "transactionEntityType" :"$transactionEntityType",
                                "transactionEntityBranch" :"$transactionEntityBranch",
                                "moduleCode" :"$moduleCode",
                                "refEntity" :"$refEntity",
                                "refEntityType" :"$refEntityType",
                                "refEntityBranch" :"$refEntityBranch",
                                "organizationId" :"$organizationId",
                                "status" :"$status",
                                "effectiveDate" :"$effectiveDate",
                                "expiryDate" :"$expiryDate",
                                "location" :"$location",
                                "geolocation" :"$geolocation",
                                "inputAssets":"$inputAssets",
                                "upload_cert":"$upload_certificate",
                                "created_on" :"$created_on",
                                "assetType":"$assetType"
                          }
                      }
                  ]
              }  
            },
            {
              "$addFields":{
                 "allTraceData":{
                    "$concatArrays":[
                      "$orderArr",
                      "$assetArr"
                    ]
                 },
                 
              }
            },
            {$project:{"allTraceData":1}},
            { $unwind: "$allTraceData" },
            {
                $lookup:{
                    from:"transactiontypes",
                    "let":{organizationId:"$allTraceData.organizationId", transtypeCode:"$allTraceData.transtypeCode"},
                    "as":"allTraceData.transtype",
                    "pipeline":[
                        {
                            $match:{
                                "$expr": {
                                              "$and": [{ "$eq": ["$organizationId",  ObjectId(payloadData.organizationId)] },
                                              { "$eq": ["$transactionTypeCode", "$$transtypeCode" ] } //$$transtypeCode"
                                              ]
                                }
                            }}
                            ]
                }
            },
            {
                "$lookup":{
                   "from":"organizations",
                   "let":{organizationId:"$allTraceData.organizationId", transactionEntity:"$allTraceData.transactionEntity"},
                   "as":"allTraceData.organizations_details",
                   "pipeline":[
                      {
                         "$match":{
                            "$expr": {
                                "$and": 
                                [
                                    //{ "$eq": ["$$_id",  ObjectId(payloadData.organizationId)] },
                                    { "$eq": ["$code", "$$transactionEntity" ] } //$$transtypeCode"
                                ]
                }
                         }
                      }
                   ]
                }
             },
            {
                $lookup:{
                    from:"departments",
                    "let":{organizationId:"$allTraceData.organizationId", transactionEntityBranch:"$allTraceData.transactionEntityBranch"},
                    "as":"allTraceData.branchDetails",
                    "pipeline":[
                        {
                            $match:{
                                "$expr": {
                                                "$and": [{ "$eq": ["$$organizationId",  ObjectId(payloadData.organizationId)] },
                                                    { "$eq": ["$code", "$$transactionEntityBranch" ] } //$$transtypeCode"
                                                ]
                                }
                            }
                        }
                            ]
                }
                
            },
                {
                $lookup:{
                    from:"corporates",
                    "let":{organizationId:"$allTraceData.organizationId",
                            transactionEntityType:"$allTraceData.transactionEntityType",
                            transactionEntity:"$allTraceData.transactionEntity"},
                    "as":"allTraceData.corporateDetails",
                    "pipeline":[
                        {
                            $match:{
                                "$expr": {
                                                "$and": [{ "$eq": ["$organizationId",  ObjectId(payloadData.organizationId)] },
                                                        { "$eq": ["$$transactionEntity", "$code" ] } ,
                                                        { "$eq": ["$$transactionEntityType", "Partner" ] }
                                                ]
                                }
                            }}
                            ]
                }
                
            },
            { $replaceRoot: { newRoot: "$allTraceData" } }
        
            //{'$unwind': { path: "$allTraceData", preserveNullAndEmptyArrays: true }}
        ];
        const result = await Order.aggregate(aggregateArr);
        return result && result.length ? result : null;
    }

    const updateOrderData = async (payloadData) => {
        if (!payloadData) {
            return false;
        }
        let whereObj = {};
        if(payloadData.id){
            whereObj._id =  ObjectId(payloadData.id)
        }
        if(payloadData.outside_docs){
            return await Order.findOneAndUpdate(whereObj, { $set: payloadData });
        }
    }

    const checkRevokeOrder =  async (payloadData) => {
        let quantityArr = [];
        const orderArray = payloadData.map((elem) => {
            if(elem.quantity_data){
                quantityArr.push(elem.quantity_data)
            }
            return quantityArr;
        })
        return quantityArr;
    }

    const checkReferenceOrderExist =  async (payloadData, result) => {        
        let andObj = [ ]
        if (payloadData.orderItems){
            payloadData.orderItems.map((orderitem) => {
                andObj.push({
                    "$expr":{
                        "$eq":[
                            "$orderDetails.orderItems.order_item",
                            orderitem.order_item
                        ]
                    }
                });
            
                andObj.push({
                    "$expr":{
                        "$eq":[
                            "$orderDetails.orderItems.line_number",
                            orderitem.line_number
                        ]
                    }
                });
                if(orderitem.accepted_quantity) {
                    andObj.push({
                        "$expr":{
                            "$eq":[
                                "$orderDetails.orderItems.accepted_quantity",
                                orderitem.accepted_quantity
                            ]
                        }
                    });

                    andObj.push({
                        "$expr":{
                            "$eq":[
                                "$orderId",
                                payloadData.orderId
                            ]
                        },
                    });

                    andObj.push({
                        "$expr":{
                            "$eq":[
                                "$transactionid",
                                payloadData.transactionid
                            ]
                        }
                    });
                }else{
                    andObj.push({
                        "$expr":{
                            "$eq":[
                                "$orderDetails.orderItems.ref_order",
                                payloadData.orderId
                            ]
                        },
                    });

                    andObj.push({
                        "$expr":{
                            "$eq":[
                                "$orderDetails.orderItems.ref_order_transactionid",
                                payloadData.transactionid
                            ]
                        }
                    });
                }
            }) 
        }else{
            andObj.push({
                "$expr":{
                    "$eq":[
                        "$orderDetails.orderItems.ref_order",
                        result.orderId
                    ]
                },
            });

            andObj.push({
                "$expr":{
                    "$eq":[
                        "$orderDetails.orderItems.ref_order_transactionid",
                        result.transactionid
                    ]
                }
            });
        }
        const aggregateArr = [
            {$unwind: "$orderDetails"},
            {$unwind: "$orderDetails.orderItems"},
            {
                $match : {
                    "$or" : [{               
                        $and: andObj,                        
                    }],
                }
            },
            {
                $project :{
                    "orderId": 1 
                }
            }
        ]
        const orderresult = await Order.aggregate(aggregateArr);
        return orderresult ;
    }

    const cancelOrder = async (payloadData, result) => {
        const orderResult = await checkReferenceOrderExist(payloadData, result);
        if(!orderResult.length && !result.orderDetails[0].orderItems[0].accepted_quantity){
            if(payloadData.orderItems){
                let assetArr = [];
                let assetInvArr = [];
                let findAssetArr = [];
                payloadData.orderItems.map( (orderitem) => {
                    const orderObj =  { "transactionEntity" : payloadData.entity, "transactionEntityBranch" : payloadData.entityBranch, "entityAsset" : orderitem.entity_asset, "assetId" : orderitem.ordered_assetId, "assetQuantity": -orderitem.order_quantity, "assetType" : constants[2], "orderId" : payloadData.transactionid, "status" : constants[4]  }
                    const findorderObj =  { "transactionEntity" : payloadData.entity, "transactionEntityBranch" : payloadData.entityBranch, "entityAsset" : orderitem.entity_asset, "assetId" : orderitem.ordered_assetId, "assetQuantity": orderitem.order_quantity, "assetType" : constants[3], "orderId" : payloadData.transactionid  }
                    const assetInvObj =  { "entity" : payloadData.entity, "entityBranch" : payloadData.entityBranch, "entityAsset" : orderitem.entity_asset,"assetId" : orderitem.ordered_assetId, "assetQuantity": orderitem.order_quantity,  "assetType" : constants[2]}
                    assetArr.push(orderObj)
                    findAssetArr.push(findorderObj)
                    assetInvArr.push(assetInvObj)
                })
                const updateResult = await updateOrderRecord(payloadData);
                if(assetArr[0].entityAsset){
                    const updateAsset = await assetService.updateAssets(assetArr, assetInvArr);
                }
                return true;
            }else{
                let assetArr = [];
                let assetInvArr = [];
                let findAssetArr = [];
                result.orderDetails[0].orderItems.map( (orderitem) => {
                    const orderObj =  { "transactionEntity" : payloadData.entity, "transactionEntityBranch" : payloadData.entityBranch, "entityAsset" : orderitem.entity_asset, "assetId" : orderitem.ordered_assetId, "assetQuantity": -orderitem.order_quantity, "assetType" : constants[2], "orderId" : payloadData.transactionid , "status" : constants[4] }
                    const findorderObj =  { "transactionEntity" : payloadData.entity, "transactionEntityBranch" : payloadData.entityBranch, "entityAsset" : orderitem.entity_asset, "assetId" : orderitem.ordered_assetId, "assetQuantity": orderitem.order_quantity, "assetType" : constants[3], "orderId" : payloadData.transactionid  }
                    const assetInvObj =  { "entity" : payloadData.entity, "entityBranch" : payloadData.entityBranch, "entityAsset" : orderitem.entity_asset,"assetId" : orderitem.ordered_assetId, "assetQuantity": orderitem.order_quantity,  "assetType" : constants[2]}
                    assetArr.push(orderObj)
                    findAssetArr.push(findorderObj)
                    assetInvArr.push(assetInvObj)
                })
                const updateResult = await updateOrderRecord(payloadData);
                if(assetArr[0].entityAsset){
                    const updateAsset = await assetService.updateAssets(assetArr, assetInvArr);
                }
                return true;
            }           

        }else{
            return false
        }         
    }

    const updateOrder = async (payloadData, result) => {
        const orderResult = await checkReferenceOrderExist(payloadData, result);
        if(!orderResult.length && !result.orderDetails[0].orderItems[0].accepted_quantity){
            let assetArr = [];
            let assetInvArr = [];
                payloadData.orderItems.map( (orderitem) => {
                    const orderObj =  { "assetName": orderitem.order_item, "assetCategory": ObjectId(orderitem.asset_category), "refOrder": orderitem.ref_order_transactionid, "transactionEntity" : payloadData.entity, "transactionEntityBranch" : payloadData.entityBranch, "entityAsset" : orderitem.entity_asset, "assetId" : orderitem.ordered_assetId, "orderId" : payloadData.transactionid  }

                    if(orderitem.order_quantity){
                        orderObj.assetQuantity = - orderitem.order_quantity
                    }
                    const assetInvObj =  { "entity" : payloadData.entity, "entityBranch" : payloadData.entityBranch, "entityAsset" : orderitem.entity_asset,"assetId" : orderitem.ordered_assetId, "assetQuantity": orderitem.order_quantity}
                    assetArr.push(orderObj)
                    assetInvArr.push(assetInvObj)
                })
                const updateResult = await updateOrderRecord(payloadData);
                if(result.orderDetails[0].referredAsset){
                    const updateAsset = await assetService.updateAssets(assetArr, assetInvArr);
                }
            return true;
        }else{
            return false
        }
    }

    const updateOrderFromProvenance = async (assetPayloadData) => {
        let conditionObj = {};
        if(assetPayloadData.transactionId) { 
            conditionObj.transactionid =  assetPayloadData.transactionId
         }
        const result = await Order.findOneAndUpdate(
         conditionObj,
         {
             $set: {nft_status : assetPayloadData.nft_status} 
         },
         { 
            //  new: true, 
             useFindAndModify: false, 
             upsert: true 
         }
     );
     return result;
 }

 const updateOrderRecordNFT = async (payloadData) => { 
     console.log("payloadData in 2135:",payloadData);
    var conditionObj = { }
    var updateSet = { }
    conditionObj.transactionid = payloadData.transactionId        
    conditionObj["orderDetails.0.orderItems.line_number"] = { $regex: payloadData.lineno, $options: "i" }
    console.log("conditionObj:",conditionObj);
    updateSet["orderDetails.0.orderItems.$.nft_status"] =  payloadData.nft_status 
   
    const result = await Order.updateMany(conditionObj,
        {                
            $set: updateSet
        }     
    );
    return result;
}

const updateOrderRecordTransferAddress = async (payloadData) => { 
    console.log("payloadData in 2135:",payloadData);
//    var conditionObj = { }
//    var updateSet = { }
   const transferAddObj = { }
   const updateSet1 = { }
//    conditionObj.transactionid = payloadData.transactionId      
   updateSet1.trans_from_address = payloadData.TransFrom_Address 
   transferAddObj.transactionid = payloadData.transactionId         
//    conditionObj["orderDetails.0.orderItems.line_number"] = { $regex: payloadData.lineno, $options: "i" }
//    console.log("conditionObj:",conditionObj);
//    updateSet["orderDetails.0.orderItems.$.nft_status"] =  payloadData.nft_status 
  
   const result1 = await Order.findOneAndUpdate(transferAddObj,
       {                
           $set: updateSet1
       }     
   );
    return result1;
  
}


module.exports = {
    addOrder,
    findOrder,
    update,
    updateOrderStatus,
    getOrders,
    getSumAssets,
    getOrderFullDetails,
    getPartnerOrders,
    getTraceabilityDetails,
    updateOrderData,
    checkRevokeOrder,
    updateOrderRecord,
    checkReferenceOrderExist,
    cancelOrder,
    updateOrder,
    statusChange,
    updateOrderFromProvenance,
    updateOrderRecordNFT,
    updateOrderRecordTransferAddress,
    getTraceabilityDetailsAsset,
    getTraceabilityDetailsOrder
}
