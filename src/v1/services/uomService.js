const { UOM,ObjectId } = require('../models/uom');

const AddUOM = async (payloadData) => {

    return await UOM.insertMany(payloadData);

}

const getUOM = async (payloadData) => {
  const conditionObj = {}

  if(payloadData.organizationId){
      conditionObj.organizationId = ObjectId(payloadData.organizationId)
  }

  if ("uom" in payloadData && payloadData.uom) {
      conditionObj["uom"] = { $regex: payloadData.uom, $options: "i" } 
  }
  if ("searchKey" in payloadData && payloadData.searchKey) {
    conditionObj['$and'] = [{
        $or: [
            { 'uom': { $regex: `${payloadData.searchKey}`, $options: "i" } }                
        ]
    }]
}
  const aggregateArr = [
      {
          $match: conditionObj
      }
  ];

  
  let sortKey = "uom";
  let sortOrder = -1;
  if("sortKey" in payloadData && "sortOrder" in payloadData && payloadData.sortKey && payloadData.sortOrder){
      sortKey = payloadData.sortKey;
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
  var uomDetails = await UOM.aggregate(aggregateArr);
  const responseObj = {
      'totalCount': uomDetails[0]['totalCount'] && uomDetails[0]['totalCount'].length ? uomDetails[0]['totalCount'][0]['count'] : 0,
      'result': uomDetails[0]['paginatedResults']
  };
  return responseObj;
}

const updateuom = async (uomDetails) => {

    if (!uomDetails) {
        return false;
    }
    let whereObj = {};
    if(uomDetails.id){
        whereObj._id =  ObjectId(uomDetails.id)
    }
    
    return await UOM.updateMany(whereObj, { $set: uomDetails });
}

const getuomFullDetails = async (payloadData) => {
    const conditionObj = {
        _id: ObjectId(payloadData.uomObjectId)
    }
    const result = await UOM.aggregate(
         [
            {
                $match: conditionObj
            }
         ]
    );
    return result && result.length ? result[0] : null;
}

const deleteuom = async (uomId) => {

    if (!uomId) {
        return false;
    }
    let whereObj = {
        _id: ObjectId(uomId)
    };
    
    return await UOM.deleteMany(whereObj);
}

const getUomDuplicateDetails = async (payloadData) => {
    var conditionObj ={}

    if ("uom" in payloadData && payloadData.uom) {
        conditionObj["uom"] = { $regex: '^'+payloadData.uom+'$', $options: "i" }
    }
    if (payloadData.organizationId) {
        conditionObj["organizationId"] = ObjectId(payloadData.organizationId)
    }

    if (payloadData.id) {
        conditionObj["_id"] = ObjectId(payloadData.id)
    }

    const aggregateArr =
        [
            {
                $match: conditionObj
            }
        ]
    
    const result = await UOM.aggregate(aggregateArr);

    return result.length;
}

module.exports = {
    AddUOM,
    getUOM,
    updateuom,
    getuomFullDetails,
    deleteuom,
    getUomDuplicateDetails
}