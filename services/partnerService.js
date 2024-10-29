var partners = require('../routes/v1/invitepartner/schema');
var mongoose = require('mongoose');

var getPartnersList = async (payloadData) => {
    var whereObj = {};
    var whereObj1 = {};

    if (payloadData.organizationId) {
        whereObj.organizationId = mongoose.Types.ObjectId(payloadData.organizationId)
    }
    if (payloadData.partnerEntity) {
        whereObj["$or"] = [
            { childEntity: mongoose.Types.ObjectId(payloadData.partnerEntity) },
            { partnerEntity: mongoose.Types.ObjectId(payloadData.partnerEntity) }
        ]
    }
    if (payloadData.status) {
        whereObj.status = payloadData.status
    }

    if (payloadData.entity) {
        whereObj["$or"] = [
            { "organizationDetails.name": { $regex: payloadData.entity, $options: "i" } },
            { "corporate.companyName": { $regex: payloadData.entity, $options: "i" } }
        ]
    }
    if (payloadData.entityId) {
        whereObj["entityId"] = { $regex: `${payloadData.entityId}`, $options: "i" }
    }
    if (payloadData.entityName) {
        whereObj["entityName"] = { $regex: `${payloadData.entityName}`, $options: "i" }
    }
    if (payloadData.email) {
        whereObj["email"] = { $regex: `${payloadData.email}`, $options: "i" }
    }
    if ("pstatus" in payloadData && payloadData.pstatus) {
        whereObj1["customstatus"] = { $regex: `${payloadData.pstatus}`, $options: "i" }
    }
    if ("searchKey" in payloadData && payloadData.searchKey) {
        whereObj['$and'] = [{
            $or: [
                { 'email': { $regex: `${payloadData.searchKey}`, $options: "i" } },
                { 'entityName': { $regex: `${payloadData.searchKey}`, $options: "i" } },
                { 'entityId': { $regex: `${payloadData.searchKey}`, $options: "i" } }
            ]
        }]
    }
    const aggregateArr = [
        {
            $addFields: {
                'req_id': { $cond: { if: { $eq: ["$childEntity", mongoose.Types.ObjectId(payloadData.partnerEntity)] }, then: "$partnerEntity", else: "$childEntity" } },
                "customstatus": {
                    "$switch": {
                        "branches": [
                            { "case": { "$eq": ["$status", "approved"] }, "then": "Approved" },
                            { "case": { "$eq": ["$status", "signedUp"] }, "then": "Signed-Up" },
                            { "case": { "$eq": ["$status", "invited"] }, "then": "Invited" },
                            { "case": { "$eq": ["$status", "inactive"] }, "then": "Inactive" },
                        ],
                        "default":"$$REMOVE"
                    }
                }
            }
        },
        {
            $match: whereObj1
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

        {
            $project: {

                '_id': "$req_id",
                'corporate': 1,
                'organizationDetails': 1,
                'entityName': { $cond: [{ $not: ["$corporate"] }, "$organizationDetails.name", "$corporate.companyName"] },
                'entityId': { $cond: [{ $not: ["$corporate"] }, "$organizationDetails.code", "$corporate.code"] },
                'childEntity': { $cond: [{ $not: ["$corporate"] }, "$organizationDetails._id", "$corporate._id"] },
                'email': '$email',
                'createdAt': '$createdAt',
                'status': '$status',
                'entity': '$entity',
                'partnerEntity': '$partnerEntity',
                'createdBy': '$createdBy',
                'organizationId': '$organizationId',
                'updatedAt': '$updatedAt'
            }
        },
        {
            $match: whereObj
        },
        {
            $sort: {
                updatedAt: -1
            }
        }
    ];

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

    var partnersResultArr = await partners.aggregate(aggregateArr);
    const responseObj = {
        'partners': partnersResultArr[0]['paginatedResults'],
        'total_count': partnersResultArr[0]['totalCount'] && partnersResultArr[0]['totalCount'].length ? partnersResultArr[0]['totalCount'][0]['count'] : 0
    };

    return responseObj;
};

module.exports = {
    getPartnersList
}
