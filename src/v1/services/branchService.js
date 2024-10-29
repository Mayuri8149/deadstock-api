const Branch = require('../../../routes/v1/department/schema');
const { ObjectId } = require('../models/asset');

const getBranches = async (payloadData) => {
    const conditionObj = {
        isActive: true,
        isDeleted: false,
        "organizationId": ObjectId(payloadData.organizationId)
    }

    if ("searchKey" in payloadData && payloadData.searchKey) {
        conditionObj["name"] = { $regex: payloadData.searchKey, $options: "i" }
    }

    if ("code" in payloadData && payloadData.code) {
        conditionObj["code"] = payloadData.code
    }
    if ("name" in payloadData && payloadData.name) {
        conditionObj["name"] = payloadData.name
    }
    const aggregateArr = [
        {
            $match: conditionObj
        },
        {
            $lookup: {
                from: 'organizations',
                localField: 'organizationId',
                foreignField: "_id",
                as: "organizations"
            }
        },
        {
            $unwind: "$organizations"
        }
    ];

    if ("allFields" in payloadData &&  payloadData.allFields && payloadData.allFields == 'false') {
        let projectObj = {
            _id: 1,
            name: 1,
            code: 1,
            branch_address: 1,
            "organizations:name": 1,
            "organizations.code": 1
        };

        aggregateArr.push({ $project: projectObj });
    }

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
    var branchDetails = await Branch.aggregate(aggregateArr);
    const responseObj = {
        'totalCount': branchDetails[0]['totalCount'] && branchDetails[0]['totalCount'].length ? branchDetails[0]['totalCount'][0]['count'] : 0,
        'result': branchDetails[0]['paginatedResults']
    };
    return responseObj;
}

module.exports = {
    getBranches
}