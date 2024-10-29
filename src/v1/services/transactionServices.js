const TransType = require('../../../routes/v1/transactiontype/schema');
const transtypeModel = require('../../../routes/v1/transactiontype/model');
const Module = require('../../../routes/v1/module/schema');
const { batch } = require('../../../routes/v1/batch/model');
const OrgSchema = require('../../../routes/v1/organization/schema');
const { ObjectId } = require('../models/asset');

    const validateTransactionData = async (entityType, payloadData) => {
        if(payloadData.assets){
            payloadData = payloadData.assets[0]
        }
        const isTransaction = entityType == "transaction";
        const key = isTransaction ? "transactionEntityType" : "refEntityType";
        const isOrg = payloadData[key].toLowerCase() == "organization";
        const branchKey = isTransaction ? "transactionEntityBranch" : "refEntityBranch";
        const entityCodeKey = isTransaction ? "transactionEntity" : "refEntity";
        const orgMatchObj = {
            _id: ObjectId(payloadData.organizationId),
            isActive: true
        };
        if (isOrg) {
            orgMatchObj["code"] = payloadData[entityCodeKey];
        }
        const aggregateArr = [
            {
                $match: orgMatchObj
            },
            {
                $project: {
                    _id: 1,
                    isActive: 1,
                    status: 1,
                    name: 1,
                    code: 1,
                    address: 1,
                    location: 1,
                    website: 1,
                    fabricChannelId: 1,
                    fabricOrgId: 1
                }
            },
        ];

        if (isOrg) {
            aggregateArr.push(
                {
                    $lookup: {
                        from: "departments",
                        as: "branches",
                        let: { "orgId": "$_id" },
                        pipeline: [
                            {
                                $match: {
                                    $and: [
                                        { $expr: { $eq: ["$organizationId", "$$orgId"] } },
                                        { $expr: { $eq: ["$code", payloadData[branchKey]] } },
                                        { $expr: { $eq: ["$isActive", true] } },
                                        // { $expr: { $eq: ["$isDeleted", false] } },
                                    ]
                                }
                            },
                            {
                                $project: {
                                    organizationId: 1,
                                    name: 1,
                                    code: 1,
                                    transactionTypeCode: 1
                                }
                            }
                        ]
                    }
                },
                { $unwind: "$branches" },
            );
        }

        if (!isOrg) {
            aggregateArr.push(

                {
                    $lookup: {
                        from: "corporates",
                        as: "corporates",
                    //  let: { "corporateId": "$transtypes.corporateId" },
                        let: { "orgId": "$_id" },
                        pipeline: [
                            {
                                $match: {
                                    $and: [
                                    //  { $expr: { $eq: ["$_id", "$$corporateId"] } },
                                        { $expr: { $eq: ["$organizationId", "$$orgId"] } },
                                        { $expr: { $eq: ["$code", payloadData[entityCodeKey]] } },
                                        { $expr: { $eq: ["$isActive", true] } },
                                    ]
                                }
                            },
                            {
                                $project: {
                                    _id:1,
                                    code:1,
                                    status: 1,
                                    companyName: 1,
                                    entityType: 1,
                                    verifiertype: 1
                                }
                            }
                        ]
                    }
                },
                { $unwind: "$corporates" }
            )
        }

        const transtypeCondArr = [
            { $expr: { $eq: ["$organizationId", "$$orgId"] } },
            { $expr: { $eq: ["$transactionTypeCode", payloadData.transtypeCode] } },
            { $expr: { $eq: ["$is_deleted", false] } },
        ];
    // && !payloadData.refEntityBranch
        if(isTransaction && payloadData.corporateId && ( payloadData.corporateId != null && payloadData.corporateId != "111111111111111111111111")){
            transtypeCondArr.push( { $expr: { $eq: ["$corporateId", "$$corpId"] } })
        }

            aggregateArr.push(
                {
                    $lookup: {
                        from: "transtypes",
                        as: "transtypes",
                        let: { "orgId": "$_id", "corpId": "$corporates._id" },
                        pipeline: [
                            {
                                $match: {
                                    $and: transtypeCondArr
                                }
                            }, {
                                $project: {
                                    organizationId: 1,
                                    transactionTypeId: 1,
                                    moduleId: 1,
                                    transactionTypeCode: 1,
                                    transactionTypeName: 1,
                                    transactionAutoNumber: 1,
                                    transactionTypePrefix: 1,
                                    corporateId: 1,
                                    assetType: 1,
                                    provenance:1,
                                    assetWithoutReference : 1,
                                    epr: 1,
                                    eprReceive: 1,
                                    eprConsume: 1,
                                    eprPrint: 1,
                                    transRole: 1
                                }
                            }]
                    }
                },
                { $unwind: "$transtypes" }) 

        

        aggregateArr.push({
            $lookup: {
                from: "modules",
                as: "modules",
                let: { "orgId": "$_id", "moduleId": "$transtypes.moduleId" },
                pipeline: [
                    {
                        $match: {
                            $and: [
                                { $expr: { $eq: ["$organizationId", "$$orgId"] } },
                                { $expr: { $eq: ["$_id", "$$moduleId"] } },
                                { $expr: { $eq: ["$code", payloadData["moduleCode"]] } },
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
                $unwind: "$modules"
            }
        );
        const result = await OrgSchema.aggregate(aggregateArr);
        return result && result.length ? result[0] : null;
    }

    const getTransactionTypeData = async (entityType, payloadData) => {
        if(payloadData.assets){
            payloadData = payloadData.assets[0]
        }
        const isTransaction = entityType == "transaction";
        const key = isTransaction ? "transactionEntityType" : "refEntityType";
        const isOrg = payloadData[key].toLowerCase() == "organization";
        // const branchKey = isTransaction ? "transactionEntityBranch" : "refEntityBranch";
        // const entityCodeKey = isTransaction ? "transactionEntity" : "refEntity";
        const orgMatchObj = {
            _id: ObjectId(payloadData.organizationId),
            isActive: true
        };
        if (isOrg) {
            orgMatchObj["code"] = payloadData["transactionEntity"];
        }
        const aggregateArr = [
            {
                $match: orgMatchObj
            },
            {
                $project: {
                    _id: 1,
                    isActive: 1,
                    status: 1,
                    name: 1,
                    code: 1,
                }
            },
        ];

        if (isOrg) {
            aggregateArr.push(
                {
                    $lookup: {
                        from: "departments",
                        as: "branches",
                        let: { "orgId": "$_id" },
                        pipeline: [
                            {
                                $match: {
                                    $and: [
                                        { $expr: { $eq: ["$organizationId", "$$orgId"] } },
                                        { $expr: { $eq: ["$code", payloadData["transactionEntityBranch"]] } },
                                        { $expr: { $eq: ["$isActive", true] } },
                                        // { $expr: { $eq: ["$isDeleted", false] } },
                                    ]
                                }
                            },
                            {
                                $project: {
                                    organizationId: 1,
                                    name: 1,
                                    code: 1,
                                    transactionTypeCode: 1
                                }
                            }
                        ]
                    }
                },
                { $unwind: "$branches" },
            );
        }

        if (!isOrg) {
            aggregateArr.push(

                {
                    $lookup: {
                        from: "corporates",
                        as: "corporates",
                    //  let: { "corporateId": "$transtypes.corporateId" },
                        let: { "orgId": "$_id" },
                        pipeline: [
                            {
                                $match: {
                                    $and: [
                                    //  { $expr: { $eq: ["$_id", "$$corporateId"] } },
                                        { $expr: { $eq: ["$organizationId", "$$orgId"] } },
                                        { $expr: { $eq: ["$code", payloadData["transactionEntity"]] } },
                                        { $expr: { $eq: ["$isActive", true] } },
                                    ]
                                }
                            },
                            {
                                $project: {
                                    _id:1,
                                    code:1,
                                    status: 1,
                                    companyName: 1,
                                    entityType: 1,
                                    verifiertype: 1
                                }
                            }
                        ]
                    }
                },
                { $unwind: "$corporates" }
            )
        }

        const transtypeCondArr = [
            { $expr: { $eq: ["$organizationId", "$$orgId"] } },
            { $expr: { $eq: ["$transactionTypeCode", payloadData.transtypeCode] } },
            { $expr: { $eq: ["$is_deleted", false] } },
        ];
    // && !payloadData.refEntityBranch
        if(isTransaction && payloadData.corporateId && payloadData.corporateId != null ){
            transtypeCondArr.push( { $expr: { $eq: ["$corporateId", "$$corpId"] } })
        }

            aggregateArr.push(
                {
                    $lookup: {
                        from: "transtypes",
                        as: "transtypes",
                        let: { "orgId": "$_id", "corpId": "$corporates._id" },
                        pipeline: [
                            {
                                $match: {
                                    $and: transtypeCondArr
                                }
                            }, {
                                $project: {
                                    organizationId: 1,
                                    transactionTypeId: 1,
                                    moduleId: 1,
                                    transactionTypeCode: 1,
                                    transactionTypeName: 1,
                                    transactionAutoNumber: 1,
                                    transactionTypePrefix: 1,
                                    corporateId: 1,
                                    assetType: 1,
                                    provenance:1,
                                }
                            }]
                    }
                },
                { $unwind: "$transtypes" }) 

        

        // aggregateArr.push({
        //     $lookup: {
        //         from: "modules",
        //         as: "modules",
        //         let: { "orgId": "$_id", "moduleId": "$transtypes.moduleId" },
        //         pipeline: [
        //             {
        //                 $match: {
        //                     $and: [
        //                         { $expr: { $eq: ["$organizationId", "$$orgId"] } },
        //                         { $expr: { $eq: ["$_id", "$$moduleId"] } },
        //                         { $expr: { $eq: ["$code", payloadData["moduleCode"]] } },
        //                         { $expr: { $eq: ["$is_deleted", false] } },
        //                     ]
        //                 }
        //             },
        //             {
        //                 $project: {
        //                     organizationId: 1,
        //                     departmentId: 1,
        //                     code: 1,
        //                     name: 1
        //                 }
        //             }
        //         ]
        //     }
        // },
        //     {
        //         $unwind: "$modules"
        //     }
        // );
        const result = await OrgSchema.aggregate(aggregateArr);
        return result && result.length ? result[0] : null;
    }

    const getTransTypeData = async (payloadData) => {
        const transresult = await TransType.findOne(
            {   
                organizationId: payloadData.organizationId,
                moduleId: payloadData.moduleId,
                transactionTypeCode: payloadData.transactionTypeCode
            }
        );
        const result = await TransType.findOne(
            {   
                organizationId: payloadData.organizationId,
                // moduleId: transresult.refModule,
                transactionTypeCode: transresult.refTransType
            }
        );
        return result;
    };

    const creatorDetails = (user) => {
        let creatorData = {}
        creatorData.creator_id = user.userId;
        creatorData.modifier_id = user.userId;
        creatorData.created_by = user.email;
        creatorData.modified_by = user.email;
        creatorData.creator_role = user.role;
        creatorData.modifier_role = user.role;

        return creatorData;
    }

    const entityDetails = (entity) => {
        // console.log('entity--',entity)
        let entityData = {}
        entityData.transactionEntity = entity.transactionEntity;
        entityData.transactionEntityBranch = entity.transactionEntityBranch;
        entityData.transactionEntityType = entity.transactionEntityType;
        entityData.refEntity = entity.refEntity;
        entityData.refEntityBranch = entity.refEntityBranch;
        entityData.refEntityType = entity.refEntityType;

        return entityData;
    }

    const generateTransactionid = (user, transtype, orderID) => { // transactionDetail name change
        let transactionData = {} // transactionData rename
        const creatorData = creatorDetails(user);
        transactionData = creatorData;
        if(transtype.transtypes.assetType) { transactionData.assetType = transtype.transtypes.assetType; } 
        if(transtype.transtypes.provenance) { transactionData.provenance = transtype.transtypes.provenance; }

        if(!transtype.corporates)
        transactionData.transactionid = transtype.code+'.'+transtype.branches.code+'.'+orderID;
        else transactionData.transactionid = transtype.corporates.code+'.'+orderID;
        // transactionData.entityAsset = transactionData.transactionid;
    
        return transactionData;
    }

    const producedAssets = (payloadData, user, consumedAsset) => {
        const userData = creatorDetails(user);
        const assetArray = [];
        let consumeAssetData = {};
        payloadData.map(elem => {
            consumeAssetData.consumeInputAssetReferences = consumedAsset;
            let producedAssetsObj = Object.assign(Object.assign({},elem, userData), consumeAssetData);
            assetArray.push(producedAssetsObj);
        })
        return assetArray;
    }

    const getEPRAssetData = async (payloadData, user) => {
        let eprPayloadData = {};
        const creatorData = creatorDetails(user);
        eprPayloadData = creatorData;

        eprPayloadData.organizationId = payloadData.organizationId
        eprPayloadData.moduleCode = payloadData.moduleCode
        eprPayloadData.transtypeCode = payloadData.transtypeCode
        eprPayloadData.eprAssetId = payloadData.assetId
        eprPayloadData.eprTransactionid = payloadData.transactionid
        eprPayloadData.transactionEntity = payloadData.transactionEntity
        eprPayloadData.transactionEntityBranch = payloadData.transactionEntityBranch
        eprPayloadData.transactionEntityType = payloadData.transactionEntityType
        eprPayloadData.refEntity = payloadData.refEntity
        eprPayloadData.refEntityBranch = payloadData.refEntityBranch
        eprPayloadData.refEntityType = payloadData.refEntityType
        eprPayloadData.eprEntityAsset = payloadData.entityAsset
        eprPayloadData.eprRefOrder = payloadData.eprRefOrder
        eprPayloadData.eprOrderId = payloadData.orderId
        eprPayloadData.eprAssetCategory = payloadData.assetCategory
        eprPayloadData.eprAssetType = payloadData.assetType
        eprPayloadData.eprAssetName = payloadData.assetName
        eprPayloadData.eprAssetQuantity = payloadData.assetQuantity
        eprPayloadData.eprAssetUom = payloadData.assetUom
        eprPayloadData.inputEprAssets = payloadData.inputAssets

        return eprPayloadData;
    }

    const getEPROrderData = async (payloadData, user) => {   
        let eprPayloadData = {};
        let eprReferredObj = {};
        let eprOrderDetails = [];
        let orderEprItems = [];
    
        const transDetails = transactionDetails(payloadData, user);
        eprPayloadData = transDetails;
    
        eprPayloadData.eprTransactionid = payloadData.transactionid;
        eprPayloadData.eprEntityAsset = payloadData.entityAsset;
        eprPayloadData.eprRefOrder = payloadData.refOrder;
        eprPayloadData.eprOrderId = payloadData.orderId;
        const eprOrderPayload = payloadData.orderDetails[0].orderItems.map((item) => {  
            let eprObj = {};
            eprObj.epr_order_item = item.order_item;
            eprObj.epr_line_number = ('000' + item.line_number).substr(-3);
            eprObj.epr_order_quantity = item.order_quantity;
            eprObj.epr_order_uom = item.order_uom;
            eprObj.epr_ordered_assetId = item.ordered_assetId;
            eprObj.epr_ref_order = item.ref_order;
            eprObj.epr_ref_order_transactionid = item.ref_order_transactionid;
            eprObj.epr_entity_asset = item.entity_asset;
            eprObj.epr_accepted_quantity = item.accepted_quantity;
            eprObj.epr_rejected_quantity = item.rejected_quantity;
            eprObj.epr_rejection_note = item.rejection_note;
            eprObj.epr_line_level_fields = item.line_level_fields;
            eprObj.epr_quantity_data = item.quantity_data;
            eprObj.epr_asset_category = item.asset_category;
            orderEprItems.push(eprObj);
            eprReferredObj.orderEprItems = orderEprItems
            eprOrderDetails.push(eprReferredObj);
           
        })
        eprPayloadData.eprOrderDetails = eprOrderDetails;
        eprReferredObj.referredEprAsset = payloadData.orderDetails[0].referredAsset
        eprReferredObj.referredEprOrder = payloadData.orderDetails[0].referredOrder
        eprReferredObj.orderEprItems = orderEprItems
        eprOrderDetails.push(eprReferredObj);
        eprPayloadData.eprOrderDetails = eprOrderDetails;
        
        return eprPayloadData
    }
    
    const transactionDetails = (payloadData, user) => {
        let multipleObj = { }

        let creatorData = creatorDetails(user);
        multipleObj = creatorData;

        multipleObj.organizationId = payloadData.organizationId,
        multipleObj.moduleCode =  payloadData.moduleCode,
        multipleObj.transtypeCode = payloadData.transtypeCode,
        multipleObj.refEntity = payloadData.refEntity,
        multipleObj.refEntityType = payloadData.refEntityType, 
        multipleObj.refEntityBranch = payloadData.refEntityBranch,   
        multipleObj.transactionEntity = payloadData.transactionEntity,
        multipleObj.transactionEntityType =  payloadData.transactionEntityType,
        multipleObj.transactionEntityBranch =  payloadData.transactionEntityBranch,
        
        multipleObj.location = payloadData.location,
        multipleObj.geolocation =  payloadData.geolocation
        
        return multipleObj;
    }

    const recursiveData = async (transtypes, updatedAutoNumber, assetLength) => {
        let transObj = {}
        let assetIDArray = [];

        const findtransactionAutoNumber = await transtypeModel.findAutoNumber(transtypes._id);
        if(findtransactionAutoNumber.transactionAutoNumber == updatedAutoNumber ){
            const findAutoNumber = (findtransactionAutoNumber.transactionAutoNumber.replace(/\'/g, '').split(/(\d+)/).filter(Boolean)); 
            let findIncrementedNumber = parseInt(findAutoNumber[1]);

            assetIDArray = Array.from(Array(assetLength)).map(x=> findtransactionAutoNumber.transactionTypePrefix+ ( parseInt(findIncrementedNumber++) + parseInt(Math.floor(Math.random() * (9 - 2) + 2))) )

            let findUpdatedAutoNumber = findtransactionAutoNumber.transactionTypePrefix + ( parseInt(findIncrementedNumber++) + parseInt(Math.floor(Math.random() * (9 - 2) + 2)))
            transObj.transactionAutoNumber = findUpdatedAutoNumber;                 
            const updateTransTypeOne = await transtypeModel.updateTransactionAutoNumber(transtypes._id, transObj);
        }else{
            const autoNumber = (transtypes.transactionAutoNumber.replace(/\'/g, '').split(/(\d+)/).filter(Boolean)); 
            let incrementedNumber = parseInt(autoNumber[1]);

            assetIDArray = Array.from(Array(assetLength)).map(x=> transtypes.transactionTypePrefix+ ( parseInt(incrementedNumber++) + parseInt(Math.floor(Math.random() * (9 - 2) + 2))) )
        }
        console.log('assetIDArray---',assetIDArray)
        return assetIDArray;
    }

module.exports = {
    getTransactionTypeData,
    validateTransactionData,
    entityDetails,
    getTransTypeData,
    creatorDetails,
    generateTransactionid,
    producedAssets,
    getEPRAssetData,    
    transactionDetails,
    getEPROrderData,
    recursiveData
}