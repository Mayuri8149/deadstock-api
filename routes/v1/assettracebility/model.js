var schema = require('./schema');
var mongoose = require('mongoose');

var create = (data) => {
    // console.log("data",data)

    var promise = new Promise((resolve, reject) => {
        var document = new schema(data);
        document.save().then(function (result) {
            var response = { isError: false, data: result, errors: [] };
            resolve(response);
        }).catch((err) => {
            var response = { isError: true, data: {}, errors: [] };
            resolve(response);
        });
    });

    return promise;
};

var listNew = (obj) => {
    console.log("obj",mongoose.Types.ObjectId(obj.organizationId))
    var promise = new Promise(async (resolve, reject) => {
         const aggregateArr = [
            {
                $match: {organizationId: mongoose.Types.ObjectId(obj.organizationId)}
            },
          
        {
            $lookup: {
                from: "organizations",
                localField: "organizationId",
                foreignField: "_id",
                as: "orgDetails"
            }
        },
        {
            $unwind: {
                "path": "$orgDetails",
                "preserveNullAndEmptyArrays": true
            }
        },

        {
            $lookup: {
                from: "transtypes",
                localField: "_id",
                foreignField: "_id",
                as: "transtype"
            }
        },
        {
            $unwind: {
                "path": "$transtype",
                "preserveNullAndEmptyArrays": true
            }
        },

        {
            $lookup: {
                from: "transactions",
                localField: "_id",
                foreignField: "_id",
                as: "transaction"
            }
        },
        {
            $unwind: {
                "path": "$transaction",
                "preserveNullAndEmptyArrays": true
            }
        },

            {
                $sort: {
                    updatedAt: -1
                }
            }
        ];
        let paginationResultArr = [];
        paginationResultArr.push({ $skip: obj.page || 0 });

        if (obj.size)
            paginationResultArr.push({ $limit: obj.size });
        aggregateArr.push({
            $facet: {
                paginatedResults: paginationResultArr,
                totalCount: [
                    {
                        $count: 'count'
                    }
                ]
            }

        });
        var partnersResultArr = await schema.aggregate(aggregateArr).allowDiskUse(true);
        var response2;
        if (partnersResultArr.length > 0) {
            const responseObj = {
                'result': partnersResultArr[0]['paginatedResults'],
                'totalCount': partnersResultArr[0]['totalCount'] && partnersResultArr[0]['totalCount'].length ? partnersResultArr[0]['totalCount'][0]['count'] : 0
            };
            response2 = { isError: false, assets: responseObj };
            console.log("response2111",response2)

            resolve(response2);
        } else {
            response2 = { isError: true, assets: [] };
            console.log("response2",response2)

            resolve(response2);
        }
    });
    return promise;
};

var findByOrganizationId = (organizationId) => {

    var promise = new Promise((resolve, reject) => {

		schema.findOne({organizationId:mongoose.Types.ObjectId(organizationId)}, (err, result) => {
			if(!err && result && result._id) {
                var response = {isError: false, draft: result, errors: []};
                resolve(response);
            } else {
                var response = {isError: true, draft: {}, errors: []};
                resolve(response);
            }
		});
    });

    return promise;
};

const findByOrgId = async (organizationId) => {
    return await schema.findOne(
        {   organizationId:mongoose.Types.ObjectId(organizationId)                       
        })
};


var deleteMany = (ids) => {
	var promise = new Promise((resolve, reject) => {
		schema.deleteMany({ 'organizationId' : mongoose.Types.ObjectId(ids) }).then((result) => {
			var response = { isError: false, drafts: result, errors: [] };
            resolve(response);
		}).catch((err) => {
            var response = { isError: true, drafts: {}, errors: [] };
            resolve(response);
        });	
	});
	return promise;
};

var findlistNew = (obj) => {
    console.log("obj",mongoose.Types.ObjectId(obj.organizationId))
    var promise = new Promise(async (resolve, reject) => {
         const aggregateArr = [
            {
                $match: {organizationId: mongoose.Types.ObjectId(obj.organizationId)}
            },
          
        {
            $lookup: {
                from: "organizations",
                localField: "organizationId",
                foreignField: "_id",
                as: "orgDetails"
            }
        },
        {
            $unwind: {
                "path": "$orgDetails",
                "preserveNullAndEmptyArrays": true
            }
        },

        {
            $lookup: {
                from: "transtypes",
                localField: "_id",
                foreignField: "_id",
                as: "transtype"
            }
        },
        {
            $unwind: {
                "path": "$transtype",
                "preserveNullAndEmptyArrays": true
            }
        },

        // {
        //     $lookup: {
        //         from: "transactions",
        //         localField: "_id",
        //         foreignField: "_id",
        //         as: "transaction"
        //     }
        // },
        // {
        //     $unwind: {
        //         "path": "$transaction",
        //         "preserveNullAndEmptyArrays": true
        //     }
        // },

            {
                $sort: {
                    updatedAt: -1
                }
            }
        ];
        let paginationResultArr = [];
        paginationResultArr.push({ $skip: obj.page || 0 });

        if (obj.size)
            paginationResultArr.push({ $limit: obj.size });
        aggregateArr.push({
            $facet: {
                paginatedResults: paginationResultArr,
                totalCount: [
                    {
                        $count: 'count'
                    }
                ]
            }

        });
        var partnersResultArr = await schema.aggregate(aggregateArr).allowDiskUse(true);
        var response2;
        if (partnersResultArr.length > 0) {
            const responseObj = {
                'result': partnersResultArr[0]['paginatedResults'],
                'totalCount': partnersResultArr[0]['totalCount'] && partnersResultArr[0]['totalCount'].length ? partnersResultArr[0]['totalCount'][0]['count'] : 0
            };
            response2 = { isError: false, assetTraceabilityField: responseObj };
            console.log("response2111",response2)

            resolve(response2);
        } else {
            response2 = { isError: true, assetTraceabilityField: [] };
            console.log("response2",response2)

            resolve(response2);
        }
    });
    return promise;
};

module.exports = {
    create,
    listNew,
    findByOrganizationId,
    deleteMany,
    findlistNew,
    findByOrgId
}