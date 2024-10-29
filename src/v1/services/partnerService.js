const Partner = require('../../../routes/v1/invitepartner/schema');
const { ObjectId } = require('../models/asset');

const getPartnerList = async (payloadData) => {
    const conditionObj = {
        $or: [
            { childEntity: ObjectId(payloadData.userId) },
            { partnerEntity: ObjectId(payloadData.userId) }
        ],
        status: "approved"
    }

    if ("searchKey" in payloadData && payloadData.searchKey) {
        conditionObj["name"] = { $regex: payloadData.searchKey, $options: "i" }
    }
    const aggregateArr = [
        {
            $match: conditionObj
        },
        {
            $addFields: {
                'req_id': { $cond: { if: { $eq: ["$childEntity", ObjectId(payloadData.userId)] }, then: "$partnerEntity", else: "$childEntity" } }
            }
        },
        {
            $lookup: {
                from: "organizations",
                localField: "req_id",
                foreignField: "_id",
                as: "organizationDetails"
            }
        },
        {
            $unwind: {
                "path": "$organizationDetails",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            $lookup: {
                from: "corporates",
                localField: "req_id",
                foreignField: "_id",
                as: "corporate"
            }
        },
        {
            $unwind: {
                "path": "$corporate",
                "preserveNullAndEmptyArrays": true
            }
        },

    ];

    var projectObj = {
        '_id': "$req_id",
        'name': { $cond: [{ $not: ["$corporate"] }, "$organizationDetails.name", "$corporate.companyName"] },
        'status': { $cond: { if: { $eq: ["$childEntity", ObjectId(payloadData.userId)] }, then: "approved", else: "$status" } },
        'code': { $cond: [{ $not: ["$corporate"] }, "$organizationDetails.code", "$corporate.code"] },
        'type': { $cond: [{ $not: ["$corporate"] }, "Organization", "Partner"] },
    };
    if ("allFields" in payloadData && payloadData.allFields && payloadData.allFields == 'true') {
        projectObj["corporate"] = 1;
        projectObj["organization"] = "$organizationDetails";
    }
    aggregateArr.push({ $project: projectObj });

    var { startIndex, limit } = payloadData;
    startIndex = startIndex ? parseInt(startIndex) : 0;
    limit = limit ? parseInt(limit) : 10;
    const paginationArr = [];
    if (startIndex > 0)
        startIndex = startIndex - 1;
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
    var partnerDetails = await Partner.aggregate(aggregateArr);
    const responseObj = {
        'totalCount': partnerDetails[0]['totalCount'] && partnerDetails[0]['totalCount'].length ? partnerDetails[0]['totalCount'][0]['count'] : 0,
        'result': partnerDetails[0]['paginatedResults']
    };
    return responseObj;
}

module.exports = {
    getPartnerList
}