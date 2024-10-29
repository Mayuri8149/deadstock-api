const { Order, EprOrder, ObjectId } = require('../models/order');
const assetService = require('../services/assetService');
const orderService = require('../services/orderService');

    const addEprOrder = async (payloadData) => {
        console.log('payloadData---',payloadData)
        payloadData.created_on = payloadData.modified_on = new Date(Date.now());
        payloadData.is_deleted = false;
        payloadData.eprOrderDetails[0].orderEprItems.forEach( async (item) => {  
            item.epr_line_number = ('000' + item.epr_line_number).substr(-3)
        })
        const result = await EprOrder.findOneAndUpdate(
            { eprOrderId: payloadData.eprOrderId },
            {
                $set: payloadData
            },
            { new: true, useFindAndModify: false, upsert: true }
        );
        return result;
    }
    
    const updateEprOrder = async (payloadData) => {
        payloadData.modified_on = new Date(Date.now());
        const result = await EprOrder.findOneAndUpdate(
            { eprTransactionid: payloadData.eprTransactionid },
            {
                $set: payloadData
            },
            //  { new: true, useFindAndModify: false, upsert: true }
        );

        return result;
    }

    const updateEprOrderStatus =  async (payloadData, order) => {
        console.log('22--updateEprOrderStatus---',updateEprOrderStatus)
        updateData = {};
        const orderpayloadData = payloadData.map((m) => { 
        const orderObj = {
            "eprOrderId" : m.epr_ref_order,
            "eprTransactionid" : m.epr_ref_order_transactionid,
            "objectID" : m.objectID,
            "ship_quantity" : m.epr_order_quantity
        }

            if(payloadData[0].epr_accepted_quantity){
                updateData.eprTransactionid = m.epr_ref_order_transactionid;
                updateData.status = "Closed";
                const result = updateEprOrder(updateData);
                if(!result){
                    updateData.transactionid = m.epr_ref_order_transactionid;
                    const closePhysicalOrder = orderService.update(updateData);
                }
            }
            return orderObj;
        });

        if(!payloadData[0].epr_accepted_quantity){
            orderpayloadData.forEach( async (item) => {           
                const orderresult = await EprOrder.findOne(
                    {   eprTransactionid:item.eprTransactionid,
                        eprOrderId: item.eprOrderId                        
                    })
                    
                    orderresult.eprOrderDetails[0].orderEprItems.forEach( async (arr) => {
                        var quantityData = {};
                        quantityData.eprRefStepOrder = order.eprOrderId,
                        quantityData.eprRefStepOrderTransactionid = order.eprTransactionid
                        quantityData.eprRefStepQuantity = item.ship_quantity
                        if(arr.epr_quantity_data.length){
                            const indexValue = arr.epr_quantity_data.length - 1;
                            const eprRefRemainedQuantity = arr.epr_quantity_data[indexValue].eprRefRemainedQuantity;
                            quantityData.eprRefRemainedQuantity = (eprRefRemainedQuantity - item.ship_quantity).toFixed(2);                     
                        }else{
                            quantityData.eprRefRemainedQuantity = (arr.epr_order_quantity - item.ship_quantity).toFixed(2)                   
                        }           
                            if(arr._id == item.objectID)
                            arr.epr_quantity_data.push(
                                quantityData
                            )
                    })
                    orderresult.save()
                    const result = await closeEprOrder(orderresult);             
            });
        }
    }

    const closeEprOrder = async (orderresult) => {
        console.log('81---orderEprItems---',orderresult.eprOrderDetails[0].orderEprItems)
        var quantityArr = [];
        var nullquantityArr = [];
        const orderClose = await orderresult.eprOrderDetails[0].orderEprItems.map((quantity) =>{
            console.log('82----',quantity)
            nullquantityArr.push(quantity.epr_quantity_data)
            if(quantity.epr_quantity_data.length > 0)
            quantityArr.push(quantity.epr_quantity_data[quantity.epr_quantity_data.length - 1].eprRefRemainedQuantity)
            return quantity;
        });
        console.log('orderClose---',orderClose)
            const noQtyArrValue = nullquantityArr.some((qty) => {console.log('---qty',qty); return qty.length==0 ? true :false});
            console.log('---87---noQtyArrValue',noQtyArrValue)

        if(noQtyArrValue){
                return orderresult;
        }else{
            orderClose.forEach( async (o) => {
                console.log('quantityArr---',quantityArr)
                const qtyLessThanZero = quantityArr.every(quantity => quantity <= 0);
                console.log('qtyLessThanZero---',qtyLessThanZero)
                const orderDatapayload = {}
                orderDatapayload.eprTransactionid = orderresult.eprTransactionid
                orderDatapayload.status = 'Closed'
                if(qtyLessThanZero){
                    console.log(orderDatapayload.eprTransactionid,'----Order closed')
                    const result = await updateEprOrder(orderDatapayload);
                }else{
                    console.log('102--In qtyLessThanZero else condition')
                    return orderresult;
                }

            })
        }
    }

    const getEprOrders = async (payloadData) => {
        const conditionObj = {};
        const conditionObj1 = {}
    
        if (payloadData.organizationId) {
            conditionObj.organizationId = ObjectId(payloadData.organizationId)
        }
        if (payloadData.transactionTypeCode) {
            conditionObj.transtypeCode = payloadData.transactionTypeCode
        }
        if ("statusFlag" in payloadData && payloadData.statusFlag) {
            conditionObj["status"] = { $ne:payloadData.statusFlag};
        }
        if (payloadData.transactionEntity && payloadData.entityType) {
            conditionObj[payloadData.entityType] = payloadData.transactionEntity;
    
        }else if(payloadData.transactionEntity && payloadData.isRefEntity=="true"){
            if (payloadData.branchCode) {
                conditionObj.transactionEntityBranch = payloadData.branchCode
            }
            conditionObj["$or"] = [
                { "transactionEntity": payloadData.transactionEntity },
                { "refEntity": payloadData.transactionEntity }
            ]
        } else if (payloadData.transactionEntity) {
            conditionObj.transactionEntity = payloadData.transactionEntity
        }

        
         if ("eprAssetName" in payloadData && payloadData.eprAssetName) {
               conditionObj["eprAssetName"] = { $regex: payloadData.eprAssetName, $options: "i" }
         }
         if ("eprAssetId" in payloadData && payloadData.eprAssetId) {
               conditionObj["eprAssetId"] = { $regex: payloadData.eprAssetId, $options: "i" }
         }
         if ("eprOrderId" in payloadData && payloadData.eprOrderId) {
               conditionObj["eprOrderId"] = { $regex: payloadData.eprOrderId, $options: "i" }
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
                  { "refEntityDetails.location": { $regex: payloadData.branchLocation, $options: "i" } }    
               ]
         }
         if ("assetLocation" in payloadData && payloadData.assetLocation) {
               conditionObj["location"] = { $regex: payloadData.assetLocation, $options: "i" } 
         }
         if ("status" in payloadData && payloadData.status) {
               conditionObj["customstatus"] = { $regex: payloadData.status, $options: "i" } 
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
                  {$match : conditionObj
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

                

               ]

        if ("allFields" in payloadData && payloadData.allFields && payloadData.allFields == 'true') {
            aggregateArr.push(

            {$unwind: "$eprOrderDetails"},
                    {$unwind: "$eprOrderDetails.orderEprItems"},
                    {
                        $lookup: {
                            from: 'assetcategories',
                            "let": { "assetCatId": "$eprOrderDetails.orderEprItems.epr_asset_category" },
                            as: "eprOrderDetails.orderEprItems.assetcat_details",
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
                            "let": { "assetUom": "$eprOrderDetails.orderEprItems.epr_order_uom","orgId": "$organizationId" },
                            as: "eprOrderDetails.orderEprItems.assetUom_details",
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
                        $group: { _id:{ id:"_id",eprOrderId:"$eprOrderId", fields:"$fields", geolocation:"$geolocation",
                                    location: "$location", organizationId:"$organizationId", refEntity:"$refEntity",
                                    refEntityBranch: "$refEntityBranch", refEntityType: "$refEntityType", status:"$status",
                                    eprTransactionid:"$eprTransactionid",transactionEntity:"$transactionEntity",
                                     transactionEntityBranch:"$transactionEntityBranch",  
                                     transactionEntityType: "$transactionEntityType",
                                      transtypeCode: "$transtypeCode", "created_by": "$created_by",
                                      "created_on":"$created_on", creator_role:"$creator_role", modified_by: "$modified_by",
                                      modified_on: "$modified_on","modifier_role":"$modifier_role",
                                      moduleCode: "$moduleCode", upload_file: "$upload_file", upload_certificate: "$upload_certificate",branch:"$branch",
                                       "refbranch":"$refbranch", transtype:"$transtype",
                                         transactionEntityDetails: "$transactionEntityDetails",
                                         refEntityDetails: "$refEntityDetails",
                                         allRefEntityTypes: "$allRefEntityTypes", reforganizations_details: "$reforganizations_details",
                                         module: "$module", department : "$department",outside_docs: "$outside_docs",
                                         modules:"$modules",transactionid: "$transactionid",
                                    },
                                    eprOrderDetails: {$addToSet:"$eprOrderDetails"}
                        }
                    },        
                    {$sort:{"_id.modified_on":-1}},
                    )                
            let projectObj = {
                _id: 1,
                status: 1,
                eprOrderDetails: 1,
                eprOrderId: 1
            };

            aggregateArr.push({ $project: projectObj });
        }       
        let sortKey = "modified_on";
        let sortOrder = -1;
        if ("sortKey" in payloadData && "sortOrder" in payloadData && payloadData.sortKey && payloadData.sortOrder) {
            sortKey = payloadData.sortKey;
            if( payloadData.sortKey == 'eprAssetName'){
                sortKey = "asset.eprAssetName"
            }
            if( payloadData.sortKey == 'assetLocation'){
                sortKey = "asset.location"
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
            })

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
        var orderDetails = await EprOrder.aggregate(aggregateArr);
        const responseObj = {
            'totalCount': orderDetails[0]['totalCount'] && orderDetails[0]['totalCount'].length ? orderDetails[0]['totalCount'][0]['count'] : 0,
            'result': orderDetails[0]['paginatedResults']
        };
        return responseObj;
    }


    const getEprOrdersLine = async (payloadData) => {
       //orderID
      const conditionObj = {};
      const conditionObj1 = {}
  
      if (payloadData.orderID) {
          conditionObj._id = payloadData.orderID
      }
            
      const result = await EprOrder.aggregate([
           {
              $match: conditionObj
          },
          {$unwind: "$eprOrderDetails"},
          {$unwind: "$eprOrderDetails.orderEprItems"},
          {
                $lookup: {
                   from: 'assetcategories',
                   "let": { "assetCatId": "$eprOrderDetails.orderEprItems.epr_asset_category" },
                   as: "eprOrderDetails.orderEprItems.assetcat_details",
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
             $group:{
                 _id: "$_id",
                 assetData:{$addToSet:"$$ROOT"}
             }
         },
         {$unwind:"$assetData"},
         { $replaceRoot: { newRoot: "$assetData" } }
         
       //    {
       //       $group: { _id:{orderId:"$orderId", fields:"$fields", geolocation:"$geolocation",
       //                   location: "$location", organizationId:"$organizationId", refEntity:"$refEntity",
       //                   refEntityBranch: "$refEntityBranch", refEntityType: "$refEntityType", status:"$status",
       //                   transactionId:"$transactionId",transactionEntity:"$transactionEntity",
       //                    transactionEntityBranch:"$transactionEntityBranch",  
       //                    transactionEntityType: "$transactionEntityType",
       //                     transtypeCode: "$transtypeCode", "created_by": "$created_by",
       //                     "created_on":"$created_on", creator_role:"$creator_role", modified_by: "$modified_by",
       //                     modified_on: "$modified_on","modifier_role":"$modifier_role",
  
       //                   },
       //                   orderDetails: {$addToSet:"$eprOrderDetails.orderEprItems"}
       //       }
       //   }
      ])
      console.log('result---',(result))
      return result && result.length ? result : null;
  }

  const geteprOrderFullDetails = async (payloadData) => {
   const conditionObj = {
       _id: ObjectId(payloadData.eprOrderObjectId)
   }
   const result = await EprOrder.aggregate(
       [
           {
               $match: conditionObj
           },
           
                   {$unwind: "$eprOrderDetails"},
                   {$unwind: "$eprOrderDetails.orderEprItems"},
                   {
                       $lookup: {
                           from: 'assetcategories',
                           "let": { "assetCatId": "$eprOrderDetails.orderEprItems.epr_asset_category" },
                           as: "eprOrderDetails.orderEprItems.assetcat_details",
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
                        "let": { "assetUom": "$eprOrderDetails.orderEprItems.epr_order_uom","orgId": "$organizationId" },
                        as: "eprOrderDetails.orderEprItems.assetUom_details",
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
                           from: 'departments',
                           "let": { "refEntityBranch": "$refEntityBranch" },
                           as: "refbranch",
                           pipeline: [
                               {
                                   $match: {
                                       $expr: { $or: [{ $eq: ['$$refEntityBranch', '$code'] }] }
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
                           'from': "eprAssets",
                           "as": "assets",
                           "localField": "eprTransactionid",
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
                       $group: { _id:{eprOrderId:"$eprOrderId", fields:"$fields", geolocation:"$geolocation",
                                   location: "$location", organizationId:"$organizationId", refEntity:"$refEntity",
                                   refEntityBranch: "$refEntityBranch", refEntityType: "$refEntityType", status:"$status",
                                   eprTransactionid:"$eprTransactionid",transactionEntity:"$transactionEntity",
                                    transactionEntityBranch:"$transactionEntityBranch",  
                                    transactionEntityType: "$transactionEntityType",
                                     transtypeCode: "$transtypeCode", "created_by": "$created_by",
                                     "created_on":"$created_on", creator_role:"$creator_role", modified_by: "$modified_by",
                                     modified_on: "$modified_on","modifier_role":"$modifier_role",
                                     moduleCode: "$moduleCode", upload_file: "$upload_file", upload_certificate: "$upload_certificate",branch:"$branch",
                                      "refbranch":"$refbranch", transtype:"$transtype",
                                        transactionEntityDetails: "$transactionEntityDetails",outside_docs: "$outside_docs",
                                        refEntityDetails: "$refEntityDetails",modules:"$modules",transactionid: "$transactionid",
                                   },
                                   eprOrderDetails: {$addToSet:"$eprOrderDetails.orderEprItems"}
                       }
                   }
                  
                  
      
               ]
           );
   return result && result.length ? result[0] : null;
}

const getEprOrdersByStatus = async (payloadData) => {
    const conditionObj = {};
    const conditionObj1 = {}

    if (payloadData.organizationId) {
        conditionObj.organizationId = ObjectId(payloadData.organizationId)
    }

    if ("eprRefOrder" in payloadData && payloadData.eprRefOrder) {
        conditionObj["transactionid"] = { $regex: payloadData.eprRefOrder, $options: "i" }
    }
    if ("eprOrderId" in payloadData && payloadData.eprOrderId) {
        conditionObj["eprOrderId"] = { $regex: payloadData.eprOrderId, $options: "i" }
    }
    if ("refEntity" in payloadData && payloadData.refEntity) {
        conditionObj["refEntity"] = { $regex: payloadData.refEntity, $options: "i" }
    }
    if ("epr" in payloadData && payloadData.epr=='true') {
        conditionObj1["transtype.epr"] = true;
    }
    if ("transRole" in payloadData && payloadData.transRole=='Digital') {
        conditionObj1["transtype.transRole"] = "Digital";
    }
    if ("eprReceive" in payloadData && payloadData.eprReceive=='false') {
       // conditionObj1["transtype.eprReceive"] = false
        conditionObj1["$or"] = [
            { "transtype.eprReceive": false },
            { "transtype.eprReceive": null }
        ]
    }
    if ("eprConsume" in payloadData && payloadData.eprConsume=='false') {
        //conditionObj1["transtype.eprConsume"] = false
        conditionObj1["$or"] = [
            { "transtype.eprConsume": false },
            { "transtype.eprConsume": null }
        ]
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
              {$match : conditionObj
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
                       "refEntityBranch":"$refEntityBranch"
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
            },

            

           ]

    if ("allFields" in payloadData && payloadData.allFields && payloadData.allFields == 'true') {
        aggregateArr.push(

        {$unwind: "$eprOrderDetails"},
                {$unwind: "$eprOrderDetails.orderEprItems"},
                {
                    $lookup: {
                        from: 'assetcategories',
                        "let": { "assetCatId": "$eprOrderDetails.orderEprItems.epr_asset_category" },
                        as: "eprOrderDetails.orderEprItems.assetcat_details",
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
                    $group: { _id:{ id:"_id",eprOrderId:"$eprOrderId", fields:"$fields", geolocation:"$geolocation",
                                location: "$location", organizationId:"$organizationId", refEntity:"$refEntity",
                                refEntityBranch: "$refEntityBranch", refEntityType: "$refEntityType", status:"$status",
                                eprTransactionid:"$eprTransactionid",transactionEntity:"$transactionEntity",
                                 transactionEntityBranch:"$transactionEntityBranch",  
                                 transactionEntityType: "$transactionEntityType",
                                  transtypeCode: "$transtypeCode", "created_by": "$created_by",
                                  "created_on":"$created_on", creator_role:"$creator_role", modified_by: "$modified_by",
                                  modified_on: "$modified_on","modifier_role":"$modifier_role",
                                  moduleCode: "$moduleCode", upload_file: "$upload_file", upload_certificate: "$upload_certificate",branch:"$branch",
                                   "refbranch":"$refbranch", transtype:"$transtype",
                                     transactionEntityDetails: "$transactionEntityDetails",
                                     refEntityDetails: "$refEntityDetails",
                                     allRefEntityTypes: "$allRefEntityTypes", reforganizations_details: "$reforganizations_details",
                                     module: "$module", department : "$department",
                                     modules:"$modules",transactionid: "$transactionid",
                                },
                                eprOrderDetails: {$addToSet:"$eprOrderDetails"}
                    }
                },        
                {$sort:{"_id.modified_on":-1}},
                )                
        let projectObj = {
            _id: 1,
            status: 1,
            eprOrderDetails: 1,
            eprOrderId: 1
        };

        aggregateArr.push({ $project: projectObj });
    }       
    let sortKey = "modified_on";
    let sortOrder = -1;
    if ("sortKey" in payloadData && "sortOrder" in payloadData && payloadData.sortKey && payloadData.sortOrder) {
        sortKey = payloadData.sortKey;
        sortOrder = payloadData.sortOrder.toLowerCase() == "desc" ? -1 : 1;
    }

    aggregateArr.push(
        {
            $sort: {
                [sortKey]: sortOrder
            }
        })

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
    var orderDetails = await EprOrder.aggregate(aggregateArr);
    const responseObj = {
        'totalCount': orderDetails[0]['totalCount'] && orderDetails[0]['totalCount'].length ? orderDetails[0]['totalCount'][0]['count'] : 0,
        'result': orderDetails[0]['paginatedResults']
    };
    return responseObj;
}
const updateEprOrderData = async (payloadData) => {
    if (!payloadData) {
        return false;
    }
    let whereObj = {};
    if(payloadData.id){
        whereObj._id =  ObjectId(payloadData.id)
    }
    if(payloadData.outside_docs){
        return await EprOrder.findOneAndUpdate(whereObj, { $set: payloadData });
    }
}

module.exports = {
    addEprOrder,
    getEprOrders,
    getEprOrdersLine,
    updateEprOrder,
    updateEprOrderStatus,
    closeEprOrder,
    geteprOrderFullDetails,
    getEprOrdersByStatus,
    updateEprOrderData
}