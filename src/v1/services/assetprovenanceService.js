const { assetprovenance,ObjectId } = require('../models/assetprovenance');

const addAssetProvenance = async (payloadData) => {
    return await assetprovenance.insertMany(payloadData);
}

const getAssetProvenanceFullDetails = async (payloadData) => {
    var conditionObj ={}
  
    if(payloadData.assetProvenanceObjectId){
        conditionObj.organizationId = ObjectId(payloadData.assetProvenanceObjectId)
    }
    if(payloadData.organizationId){
        conditionObj.organizationId = ObjectId(payloadData.organizationId)
    }

    const aggregateArr =
        [
            {
                $match: conditionObj
            },
            {
                $sort: {
                    modified_on: -1
                }
            }
        ]
    
    const result = await assetprovenance.aggregate(aggregateArr);

    return result && result.length ? result[0] : null;
}

const updateAssetProvenance = async (payloadData) => {

    if (!payloadData) {
        return false;
    }
    let whereObj = {};
    if(payloadData.organizationId){
        whereObj.organizationId =  ObjectId(payloadData.organizationId)
    }
  
    return await assetprovenance.updateMany(whereObj, { $set: payloadData });
}


module.exports = {
    addAssetProvenance,
    getAssetProvenanceFullDetails,
    updateAssetProvenance
}