var schema = require('./schema');
var departmentSchema = require('../department/schema');
var mongoose = require('mongoose');

var create = (organization) => {
    var promise = new Promise((resolve, reject) => {
        var document = new schema(organization);
        document.save().then(function (result) {
            var response = { error: null, organization: result };
            resolve(response);
        }).catch(function (err) {
            var response = { error: err, organization: {} };
            resolve(response);
        });
    });
    return promise;

};

var checkDuplicate = (organization) => {
    var promise = new Promise((resolve, reject) => {
        var data = {
            code: organization.code
        }
        schema.findOne(data, (err, organization) => {
            if (organization == null) {
                var response = { isError: false, organization: organization, errors: [] };
                resolve(response);
            } else {
                var response = { isError: true, organization: {}, errors: [{ msg: "Duplicate Organization ID" }] };
                resolve(response);
            }
        });
    });

    return promise;
};

// -----------Start Rohini KAmble(SCI-I868) 18/04/2021

var findById = (id) => {
    var promise = new Promise((resolve, reject) => {
        var filter = [];
        
        var data = {
            _id: mongoose.Types.ObjectId(id),
        };
        filter.push({ $match: data});

        filter.push({
            "$lookup": {
                from: "userreferences",
                // Start - Priyanka Patil (SNA-I66) 21-06-2021
                localField: "_id",
                foreignField: "organizationId",
                // End - Priyanka Patil (SNA-I66) 21-06-2021
                as: "userreference"
            }
        });

        filter.push({
            // Start - Priyanka Patil (SNA-I66) 21-06-2021
            $unwind: {
                "path": "$userreference",
                "preserveNullAndEmptyArrays": true
            // End - Priyanka Patil (SNA-I66) 21-06-2021
            }
        });

        filter.push({
            "$lookup": {
                from: "users",
                // Start - Priyanka Patil (SNA-I66) 21-06-2021
                localField: "userreference.userId",
                // End - Priyanka Patil (SNA-I66) 21-06-2021
                foreignField: "_id",
                as: "user"
            }
        });

        filter.push({
            // Start - Priyanka Patil (SNA-I66) 21-06-2021
            $unwind: {
                "path": "$user",
                "preserveNullAndEmptyArrays": true
            // End - Priyanka Patil (SNA-I66) 21-06-2021
            }
        });
        var query = schema.aggregate(filter);
        // Start - Priyanka Patil (SNA-I66) 21-06-2021
        // query.exec((err, organization) => {
            
        //     if (!err || organization.length) {
        // // End - Priyanka Patil (SNA-I66) 21-06-2021
        //         var response = { isError: false, organization: organization, errors: [] };
        //         resolve(response);
        //     } else {
        //         var response = { isError: true, organization: {}, errors: [{ msg: "Invalid organization ID" }] };
        //         resolve(response);
        //     }
        // });

        var query = schema.aggregate(filter);
        schema.findOne(data, (err, organization) => {
            if (!err && (organization && organization._id)) {
                var response = { isError: false, organization: organization, errors: [] };
                resolve(response);
            } else {
                var response = { isError: true, organization: {}, errors: [{ msg: "Invalid organization ID" }] };
                resolve(response);
            }
        });
    // });


    });

    return promise;
};

//----------End Rohini kambleSCI-I868) 18/04/2021
// Start - Priyanka Patil (SNA-I68) 22-06-2021
var findOrgDetilsById = (id) => {
    var promise = new Promise((resolve, reject) => {
        var filter = [];
        
        var data = {
            _id: mongoose.Types.ObjectId(id),
        };
        filter.push({ $match: data});

        filter.push({
            "$lookup": {
                from: "userreferences",
                localField: "_id",
                foreignField: "organizationId",
                as: "userreference"
            }
        });

        filter.push({
            $unwind: {
                "path": "$userreference",
                "preserveNullAndEmptyArrays": true
            }
        });

        filter.push({
            "$lookup": {
                from: "users",
                localField: "userreference.userId",
                foreignField: "_id",
                as: "user"
            }
        });

        filter.push({
            $unwind: {
                "path": "$user",
                "preserveNullAndEmptyArrays": true
            }
        });
        var query = schema.aggregate(filter);
        query.exec((err, organization) => {
            if (!err || organization.length) {
                var response = { isError: false, organization: organization[0], errors: [] };
                resolve(response);
            } else {
                var response = { isError: true, organization: {}, errors: [{ msg: "Invalid organization ID" }] };
                resolve(response);
            }
        });

    });

    return promise;
};
// End - Priyanka Patil (SNA-I68) 22-06-2021

var list = (obj,filters) => {
    var promise = new Promise(async (resolve, reject) => {

        const whereObj = {}
        const conditionObj = {}
        if (filters.organizationId) {
            whereObj["code"] = { $regex: `${filters.organizationId}`, $options: "i" }
        }
        if (filters.organizationName) {
            whereObj["name"] = { $regex: `${filters.organizationName}`, $options: "i" }
        }
        if (filters.status) {
            whereObj["customstatus"] = { $regex: `${filters.status}`, $options: "i" }
        }

        if (filters.isActive=='true') {
            whereObj["isActive"] = true
        }

        if ("organizationNameCode" in filters && filters.organizationNameCode) {
            whereObj['$and'] = [{
                $or: [
                    { 'code': { $regex: `${filters.organizationNameCode}`, $options: "i" } },
                    { 'name': { $regex: `${filters.organizationNameCode}`, $options: "i" } }
                ]
            }]
        }

        if ("searchKey" in filters && filters.searchKey) {
            conditionObj['$and'] = [{
                $or: [
                    { 'code': { $regex: `${filters.searchKey}`, $options: "i" } },
                    { 'name': { $regex: `${filters.searchKey}`, $options: "i" } },
                    { 'customstatus': { $regex: `${filters.searchKey}`, $options: "i" } }
                ]
            }]
        }
         const aggregateArr = [
        {
            $addFields:{
                "customstatus":{ $cond: { if: "$isActive", then: 'Active', else:'Inactive'} },
            }
        },
        {
            $match: whereObj
        },
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
                                { $expr: { $eq: ["$code", "HO"] } },
                                { $expr: { $eq: ["$isActive", true] } }
                            ]
                        }
                    }
                ]
            }
        },
        {$unwind: {
                "path": "$branches",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            $sort: {
                updatedAt: -1
            }
        },
        {
            $match: conditionObj
        },
        ];
        let paginationResultArr = [];
        paginationResultArr.push({ $skip: obj.skip || 0 });

        if (obj.limit)
            paginationResultArr.push({ $limit: obj.limit });
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
            response2 = { isError: false, organizations: responseObj };
            resolve(response2);
        } else {
            response2 = { isError: true, organizations: [] };
            resolve(response2);
        }
    });
    return promise;
};

var findOrganization = (organizationName) => {
    var promise = new Promise((resolve, reject) => {
        schema.findOne({
            name: organizationName
        }, (err, organization) => {
            if (!err && (organization && organization._id)) {
                var response = { isError: false, organization: organization, errors: [] };
                resolve(response);
            } else {
                var response = { isError: true, organization: {}, errors: [{ msg: "Invalid organization ID" }] };
                resolve(response);
            }
        })
    });

    return promise;
}

var update = (id, organization) => {
    var promise = new Promise((resolve, reject) => {
        schema.findOneAndUpdate({ '_id': id }, { $set: organization }, { new: true }, (error, result) => {
            if (error) {
                var response = { isError: true, organization: {}, errors: [{ "msg": "Failed to update organization!" }] };
                resolve(response);
            } else {
                var response = { isError: false, organization: result, errors: [] };
                resolve(response);
            }
        })
    });
    return promise;
};

//  Start- Shubhangi, 06-04-2021, SCI-I832
var updateWallet = async (id, wallet,expiryType) => {
    var promise = new Promise((resolve, reject) => {
		schema.findOne({ '_id': mongoose.Types.ObjectId(id) }, (error, result) =>{
			if(error) {
				response = { isError: true, status: {}, errors: [{"msg": "Failed to update organization!"}] };
                resolve(response)
            } else {
                if (typeof result.wallet === 'undefined') {
                    result.wallet = 0
                }
                let balance = 0
                balance = result.wallet + parseInt(wallet)
                result.wallet = balance
                result.expiryType = expiryType
                result.expiryDate = new Date()
                result.save()
			  response = { isError: false, organization: result, errors: [] };
              resolve(response)
			}
		})
    })
	return promise;
}
//  End- Shubhangi, 06-04-2021, SCI-I832
const findOrganizationById = async (Id) => {
    return await schema.findOne(
        {   _id:mongoose.Types.ObjectId(Id),
        })
}

const deparmentCreate = async (payloadData) => {
    const result = await departmentSchema.findOneAndUpdate(
        { _id: mongoose.Types.ObjectId(payloadData.organizationId) },
        {
            $set: payloadData
        },
        { new: true, useFindAndModify: false, upsert: true }
    );
    return result;
}

module.exports = {
    create,
    findById,
    list,
    findOrganization,
    update,
    checkDuplicate,
    //  Start- Shubhangi, 06-04-2021, SCI-I832
    updateWallet,
    //  End- Shubhangi, 06-04-2021, SCI-I832
    // Start - Priyanka Patil (SNA-I68) 22-06-2021
    findOrgDetilsById,
    // End - Priyanka Patil (SNA-I68) 22-06-2021
    findOrganizationById,
    deparmentCreate
};
