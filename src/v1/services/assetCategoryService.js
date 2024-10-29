const { AssetCategory,ObjectId } = require('../models/assetCategory');

const addAsset = async (payloadData) => {

    return await AssetCategory.insertMany(payloadData);

}

const getAssets = async (payloadData) => {
  const conditionObj = {}

  if(payloadData.organizationId){
      conditionObj.organizationId = ObjectId(payloadData.organizationId)
  }
 
  if ("assetCategory" in payloadData && payloadData.assetCategory) {
      conditionObj["assetCategory"] = { $regex: payloadData.assetCategory, $options: "i" } 
  }
  if ("assetCategoryDescription" in payloadData && payloadData.assetCategoryDescription) {
      conditionObj["assetCategoryDescription"] = { $regex: payloadData.assetCategoryDescription, $options: "i" } 
  }
  if ("assetName" in payloadData && payloadData.assetName) {
    conditionObj["assetList.assetName"] = { $regex: payloadData.assetName, $options: "i" } 
}
if ("assetDescription" in payloadData && payloadData.assetDescription) {
    conditionObj["assetList.assetDescription"] = { $regex: payloadData.assetDescription, $options: "i" } 
}
if ("searchKey" in payloadData && payloadData.searchKey) {
    conditionObj['$and'] = [{
        $or: [
            { 'assetCategory': { $regex: `${payloadData.searchKey}`, $options: "i" } },
            { 'assetCategoryDescription': { $regex: `${payloadData.searchKey}`, $options: "i" } },
            { 'additionalDescription': { $regex: `${payloadData.searchKey}`, $options: "i" } },
            { 'assetList.assetName': { $regex: `${payloadData.searchKey}`, $options: "i" } },
            { 'assetList.assetDescription': { $regex: `${payloadData.searchKey}`, $options: "i" } }                  
        ]
    }]
}
const aggregateArr = [
    
    {
        $match: conditionObj
    }
  ];
  if (payloadData.flag == "assetList") {
    aggregateArr.unshift({
        $unwind: "$assetList"
    })
    }
if ("provenanceTemplatePath" in payloadData && payloadData.provenanceTemplatePath && payloadData.provenanceTemplatePath == 'false') {
    const conditionObj2={}
    if(payloadData.provenanceTemplatePath){
        conditionObj2.provenanceTemplatePath = { $ne: undefined };
    }
    aggregateArr.push( {
        $match: conditionObj2
    });
}
  
  let sortKey = "modified_on";
  let sortOrder = -1;
  if("sortKey" in payloadData && "sortOrder" in payloadData && payloadData.sortKey && payloadData.sortOrder){
      sortKey = payloadData.sortKey;
      if( payloadData.sortKey == 'assetName'){
            sortKey = "assetList.assetName"
        }
        if( payloadData.sortKey == 'assetDescription'){
            sortKey = "assetList.assetDescription"
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
  var assetDetails = await AssetCategory.aggregate(aggregateArr);
  const responseObj = {
      'totalCount': assetDetails[0]['totalCount'] && assetDetails[0]['totalCount'].length ? assetDetails[0]['totalCount'][0]['count'] : 0,
      'result': assetDetails[0]['paginatedResults']
  };
  return responseObj;
}

const updateAssetCategory = async (assetCategoryDetails) => {

    if (!assetCategoryDetails) {
        return false;
    }
    let whereObj = {};
    if(assetCategoryDetails.id){
        whereObj._id =  ObjectId(assetCategoryDetails.id)
    }

    if(assetCategoryDetails.assetListId){
        return await AssetCategory.updateOne(whereObj ,{$set:{"assetList.$[element].assetName":assetCategoryDetails.assetName,"assetList.$[element].assetDescription":assetCategoryDetails.assetDescription}}, { arrayFilters: [{ "element._id": { $eq: ObjectId(assetCategoryDetails.assetListId) } }] })
    }else{   
        return await AssetCategory.updateMany(whereObj, { $set: assetCategoryDetails });
    }
}

const getAssetFullDetails = async (payloadData) => {
    const conditionObj = {
        _id: ObjectId(payloadData.assetObjectId)
    }
    const aggregateArr = [
        {
            $match: conditionObj
        }
    ];

    if(payloadData.assetListId){
        aggregateArr.push(
            {
                $addFields: {
                    "assetList": {
                        $filter: {
                            input: "$assetList",
                            as: "item",
                            cond: { $eq: ["$$item._id", ObjectId(payloadData.assetListId)] }
                        }
                    }
                }
            }
        )
    }
  
    const result = await AssetCategory.aggregate(aggregateArr);
    return result && result.length ? result[0] : null;
}


const deleteAssetCategory = async (assetcategoryId,assetListId) => {

    if (!assetcategoryId) {
        return false;
    }
    let whereObj = {
        _id: ObjectId(assetcategoryId)
    };
    if(assetListId){
        return await AssetCategory.updateOne(whereObj,{$pull:{assetList:{_id:ObjectId(assetListId)} }})
    }else{    
        return await AssetCategory.deleteMany(whereObj);
    }
}

    const getAssetCategoryDetails = async (payloadData) =>{
        const conditionObj = { };
        conditionObj["_id"] = ObjectId(payloadData.assetCategory);
    
        const aggregateArr = [
            {
                $match: conditionObj
            }
        ];    
        let projectObj = {
            assetCategory:1,
            provenanceTemplatePath:1
        };
        aggregateArr.push({ $project: projectObj });
        var result = await AssetCategory.aggregate(aggregateArr);
        return result;
    }

    const getAssetDuplicateDetails = async (payloadData) => {
        var conditionObj ={}
    
        if ("assetCategory" in payloadData && payloadData.assetCategory) {
            conditionObj["assetCategory"] = { $regex: '^'+payloadData.assetCategory+'$', $options: "i" }
        }
        if (payloadData.organizationId) {
            conditionObj["organizationId"] = ObjectId(payloadData.organizationId)
        }
    
        const aggregateArr =
            [
                {
                    $match: conditionObj
                }
            ]
        
        const result = await AssetCategory.aggregate(aggregateArr);
    
        return result && result.length ? result[0] : null;
    }
    
    const getAssetNameDuplicateDetails = async (payloadData) => {
    var conditionObj ={}

    if (payloadData && payloadData.id) {
        conditionObj["_id"] = ObjectId(payloadData.id)
    }
    if (payloadData && payloadData.organizationId) {
        conditionObj["organizationId"] = ObjectId(payloadData.organizationId)
    }

    if(payloadData.assetFlag=="assetFlag"){

        if (payloadData.assetDescription) {
            conditionObj["assetList.assetDescription"] = { $regex: '^'+payloadData.assetDescription+'$', $options: "i" } 
        }

        if (payloadData.assetName) {
            conditionObj["assetList.assetName"] = { $regex: '^'+payloadData.assetName+'$', $options: "i" } 
        }
    }else{
        if (payloadData.assetName) {
            conditionObj["assetList.assetName"] = { $regex: '^'+payloadData.assetName+'$', $options: "i" } 
        }
    }

    const aggregateArr =
        [  
            {
                $match: conditionObj
            }
        ];

        aggregateArr.unshift(
        {
            $unwind: "$assetList"
        }   
    )
    const result = await AssetCategory.aggregate(aggregateArr);

    return result && result.length ? result : null;
    }

module.exports = {
    addAsset,
    getAssets,
    updateAssetCategory,
    getAssetFullDetails,
    deleteAssetCategory,
    getAssetCategoryDetails,
    getAssetDuplicateDetails,
    getAssetNameDuplicateDetails
}