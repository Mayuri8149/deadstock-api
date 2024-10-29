var mongoose = require('mongoose');
var schema = require('./schema');
const Promise = require('bluebird');
var partnerSchema = require('./../invitepartner/schema');

var create =  (corporate) => {
    var promise = new Promise((resolve, reject) => {
		schema.findOne({ 'code': corporate.code }, (error, result) =>{
			if(error) {
				response = { isError: true, status: {}, errors: [{"msg": "Failed to update Company!"}] };
                resolve(response)
            } else {
                result.companyName = corporate.companyName
                result.emailId = corporate.email
                result.phoneNumber = corporate.phoneNumber
                result.logo = corporate.logo
                result.save()
                partnerSchema.findOne({ 'entityId': corporate.code }, (error, result1) =>{
                    if(error) {
                        response = { isError: true, status: {}, errors: [{"msg": "Failed to update Company!"}] };
                        resolve(response)
                    } else {
                        result1.entityName = corporate.companyName
                        result1.status = 'signedUp'
                        result1.save()
                        result.createdBy = result1.createdBy
                        result.updatedBy = result1.updatedBy
                        result.save()
                      response = { isError: false, corporate: result, errors: [] };
                      resolve(response)
                    }
                })
			 
			}
		})
    })
	return promise;
};

var findById = (id) => {
    var promise = new Promise((resolve, reject) => {
        var data = {
            _id: mongoose.Types.ObjectId(id),
        };
        schema.findOne(data, (err, corporate) => {
            if(!err && (corporate && corporate._id) ){
                var response = {isError: false, corporate: corporate, errors: []};
                resolve(response);
            } else {
                var response = {isError: true, corporate: {}, errors: [{msg: "Invalid Corporate ID"}]};
                resolve(response);
            }
        });
    });

    return promise;
};
// -----------------Start Rohini kamble (SCI-I771) 08/02/2021--------

var list = (data) => {
    var promise = new Promise((resolve, reject) => {            
        schema.find().countDocuments().exec(function(err, corporates) { 
            resolve(corporates);
        });
    }).then(function(response){
        return new Promise((resolve, reject) => { 
            var response1;
            schema
            .find()
            .skip(parseInt(data.skip))
            .limit(parseInt(data.limit))
             //  Start- Shubhangi, 05-02-2020, SCI-I749
             .sort({updatedAt: -1}) 
             //  End- Shubhangi, 05-02-2020, SCI-I749   
            .exec(function(err, corporates) { 
                if(err) {
                    response1 = { isError: true, corporates: [], errors: [], totalCount:0 };
                    resolve(response1);
                } else {
                    response1 = { isError: false, corporates: corporates, errors: [], totalCount:response};
                    resolve(response1);
                    
                }
            });
            setTimeout(() => resolve(response1), 1000);
        });      
    });
    return promise;
};

// -----------------End Rohini kamble (SCI-I771) 08/02/2021--------

var listNew = (obj,filters={}) => {
    var promise = new Promise(async (resolve, reject) => {

        const whereObj = {}

        if(obj.verifiertype) {
            whereObj.verifiertype = obj.verifiertype
        };
        if (filters.location) {
            whereObj["location"] = { $regex: `${filters.location}`, $options: "i" }
        }
        if (filters.address) {
            whereObj["address"] = { $regex: `${filters.address}`, $options: "i" }
        }
        if (filters.organizationId) {
            whereObj["orgDetails.code"] = { $regex: `${filters.organizationId}`, $options: "i" }
        }
        if (filters.organizationName) {
            whereObj["orgDetails.name"] = { $regex: `${filters.organizationName}`, $options: "i" }
        }
        if (filters.entityId) {
            whereObj["code"] = { $regex: `${filters.entityId}`, $options: "i" }
        }
        if (filters.entityName) {
            whereObj["companyName"] = { $regex: `${filters.entityName}`, $options: "i" }
        }
        if (filters.status) {
            whereObj["partnerDetails.customstatus"] = { $regex: `${filters.status}`, $options: "i" }
        }
        if ("searchKey" in filters && filters.searchKey) {
            whereObj['$and'] = [{
                $or: [
                    { 'location': { $regex: `${filters.searchKey}`, $options: "i" } },
                    { 'address': { $regex: `${filters.searchKey}`, $options: "i" } },
                    { 'orgDetails.code': { $regex: `${filters.searchKey}`, $options: "i" } },
                    { 'orgDetails.name': { $regex: `${filters.searchKey}`, $options: "i" } },
                    { 'code': { $regex: `${filters.searchKey}`, $options: "i" } },
                    { 'companyName': { $regex: `${filters.searchKey}`, $options: "i" } },
                    { 'partnerDetails.customstatus': { $regex: `${filters.searchKey}`, $options: "i" } }
                ]
            }]
        }

         const aggregateArr = [
           {
            $lookup: {
                from: "users",
                localField: "createdBy",
                foreignField: "_id",
                as: "createdBy"
            }
        },
        {
            $unwind: {
                "path": "$createdBy",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "updatedBy",
                foreignField: "_id",
                as: "updatedBy"
            }
        },
        {
            $unwind: {
                "path": "$updatedBy",
                "preserveNullAndEmptyArrays": true
            }
        },
//============================ Start - Shubhangi (SNA-I45) - 19-06-2021 ============================ 
        {
            $lookup: {
                from: "relationships",
                localField: "_id",
                foreignField: "childEntity",
                as: "partnerDetails"
            }
        },
        {
            $unwind: {
                "path": "$partnerDetails",
                "preserveNullAndEmptyArrays": true
            }
        },

        {
            $addFields:{
                "partnerDetails.customstatus": {
                    "$switch": {
                      "branches": [
                        { "case": { "$eq": [ "$partnerDetails.status", "invited" ] }, "then": "Invited" },
                        { "case": { "$eq": [ "$partnerDetails.status", "approved" ] }, "then": "Active" },
                        { "case": { "$eq": [ "$partnerDetails.status", "signedUp" ] }, "then": "Active" },
                        { "case": { "$eq": [ "$partnerDetails.status", "inactive" ] }, "then": "Inactive" }
                      ],
                      "default":"$$REMOVE"
                    }
                  }
            }
        },

        {
            $lookup: {
                from: "organizations",
                localField: "partnerDetails.organizationId",
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
            $match: whereObj
        },

        //============================ End - Shubhangi (SNA-I5) - 19-06-2021 ============================ 

            {
                $sort: {
                    updatedAt: -1
                }
            }
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
            response2 = { isError: false, corporates: responseObj };
            resolve(response2);
        } else {
            response2 = { isError: true, corporates: [] };
            resolve(response2);
        }
    });
    return promise;
};
var findByName = (name) => {
    var promise = new Promise((resolve, reject) => {
        var data = {
            name: name
        }
        schema.findOne(data, (err, corporate) => {
            if(!err && (corporate && corporate._id) ){
                var response = {isError: false, corporate: corporate, errors: []};
                resolve(response);
            } else {
                var response = {isError: true, corporate: {}, errors: [{msg: "Invalid Corporate ID"}]};
                resolve(response);
            }
        })
    });
    
    return promise;
}

var update = (id, corporate) => {
	var promise = new Promise((resolve, reject) => {
		schema.findOneAndUpdate({ '_id': id }, { $set : corporate }, { new : true }, (error, result) =>{
			if(error) {
				var response = { isError: true, corporate: {}, errors: [{"msg": "Failed to update corporate!"}] };
            	resolve(response);
			} else {
				var response = { isError: false, corporate: result, errors: [] };
            	resolve(response);
			}
		})
	});
	return promise;
};

//  Start- Shubhangi, 07-04-2021, SCI-I832
var updateWallet = async (id, wallet,expiryType) => {
    var promise = new Promise((resolve, reject) => {
		schema.findOne({ '_id': mongoose.Types.ObjectId(id) }, (error, result) =>{
			if(error) {
				response = { isError: true, status: {}, errors: [{"msg": "Failed to update verifier!"}] };
                resolve(response)
            } else {
                let balance = 0
                if (typeof result.wallet === 'undefined') {
                    result.wallet = 0
                }
                balance = result.wallet + parseInt(wallet)
                result.wallet = balance
                result.expiryType = expiryType
                result.expiryDate = new Date()
                result.save()
			  response = { isError: false, verifier: result, errors: [] };
              resolve(response)
			}
		})
    })
	return promise;
};
//  End- Shubhangi, 07-04-2021, SCI-I832

//============================ Start - Shubhangi (SNA-I5) - 13-05-2021 ============================ 
var getPartners = (obj) => {
    var promise = new Promise(async (resolve, reject) => {
         const aggregateArr = [
            {
                $match: {verifiertype:obj.verifiertype}
            },
           {
            $lookup: {
                from: "users",
                localField: "code",
                foreignField: "companyCode",
                as: "user"
            }
        },
        {
            $unwind: {
                "path": "$user",
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
                'partners': partnersResultArr[0]['paginatedResults'],
                'total_count': partnersResultArr[0]['totalCount'] && partnersResultArr[0]['totalCount'].length ? partnersResultArr[0]['totalCount'][0]['count'] : 0
            };
            response2 = { isError: false, corporate: responseObj };
            resolve(response2);
        } else {
            response2 = { isError: true, corporate: [] };
            resolve(response2);
        }
    });
    return promise;
};
//============================ End - Shubhangi (SNA-I5) - 24-05-2021 ============================ 

const checkDuplicateCorporate = function (partner) {
    return new Promise(function (resolve, reject) {
        try {
            //here check exits or not
            let partnerObj = {};
            if (!(typeof partner.entityId === 'undefined')) {
                partnerObj.code = partner.entityId
            }
            if (!(typeof partner.code === 'undefined')) {
                partnerObj.code = partner.code
            }
            schema.findOne(partnerObj)
                .exec()
                .then(function (partner) {
                    return resolve(partner);
                })
                .catch(function (err) {
                    // For now just hard code response
                    return reject(err);
                });
        } catch (err) {
            return reject(err);
        }
    }); //Promise
};

const createNewCorp = Promise.promisify(function (existingPartner, newPartner, cb) {
    if (existingPartner == null) {
        newPartner.code = newPartner.entityId
        newPartner.companyName = newPartner.entityName
        newPartner.emailId = newPartner.email
        newPartner.status = 'new'
        newPartner.verifiertype = 'corporateverifier'
        newPartner.createdBy = newPartner.createdBy
        newPartner.updatedBy = newPartner.updatedBy
        var newPartner = new schema(newPartner);
        schema.create(newPartner, function (err, newPartner) {
            if (err) {
                return cb(err, newPartner);
            } else {
                return cb(null, newPartner);
            }
        });
    } else {
        existingPartner.save(function (err) {
            if (err) {
                return cb(err, existingPartner);
            } else {
                return cb(null, existingPartner);

            }
        });
    }

})

var findByCompCode = (code) => {
    var promise = new Promise((resolve, reject) => {
        schema.findOne({
            code: code
        }, (err, corporate) => {
            if(!err && (corporate && corporate._id) ){
                var response = {isError: false, corporate: corporate, errors: []};
                resolve(response);
            } else {
                var response = {isError: true, corporate: {}, errors: [{msg: "Invalid Corporate ID"}]};
                resolve(response);
            }
        })
    });

    return promise;
}

var updateCorporate = (id, corporate) => {
	var promise = new Promise((resolve, reject) => {
		schema.findOneAndUpdate({ '_id': mongoose.Types.ObjectId(id) }, { $set : corporate }, { new : true }, (error, result) =>{
			if(error) {
				var response = { isError: true, corporate: {}, errors: [{"msg": "Failed to update corporate!"}] };
            	resolve(response);
			} else {
				var response = { isError: false, corporate: result, errors: [] };
            	resolve(response);
			}
		})
	});
	return promise;
};

module.exports = {
    create,
    findById,
    // Start Rohini Kamble (SCI-I771) 09/02/2021
    list,
    // End Rohini Kamble (SCI-I771) 09/02/2021
    findByName,
    update,
    // Start - Priyanka Patil 24-02-2021 (SCI-I771)
    listNew,
    // End - Priyanka Patil 24-02-2021 (SCI-I771)
    //Start- Shubhangi, 07-04-2021, SCI-I832
    updateWallet,
    //End- Shubhangi, 07-04-2021, SCI-I832
     //============================ Start - Shubhangi (SNA-I5) - 13-05-2021 ============================ 
  getPartners ,
  checkDuplicateCorporate,
  createNewCorp,
  // ============================ End - Shubhangi (SNA-I5) - 24-05-2021 ============================
  findByCompCode,
  updateCorporate
};