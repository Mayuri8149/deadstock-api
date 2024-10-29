var schema = require('./schema');
var mongoose = require('mongoose');
const Promise = require('bluebird');


const checkDuplicatePartner = function (partner) {
    return new Promise(function (resolve, reject) {
        try {
            //here check exits or not
            let partnerObj = {};
            if (!(typeof partner._id === 'undefined')) {
                partnerObj._id = mongoose.Types.ObjectId(partner._id)
            }
            if (!(typeof partner.entityId === 'undefined')) {
                partnerObj.entityId = partner.entityId;
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

const create = Promise.promisify(function (existingPartner, newPartner, cb) {
    if (existingPartner == null) {
        if(newPartner.status == 'approved' ){
            newPartner.status = newPartner.status
        }else{
            newPartner.status = 'invited'
        }
        // Product doesn;t exist, create one
        var newPartner = new schema(newPartner);
        schema.create(newPartner, function (err, newPartner) {
            if (err) {
                return cb(err, newPartner);
            } else {
                return cb(null, newPartner);
            }
        });
    } else {
        existingPartner.status = newPartner.status
        existingPartner.updatedBy = newPartner.updatedBy
        existingPartner.save(function (err) {
            if (err) {
                return cb(err, existingPartner);
            } else {
                return cb(null, existingPartner);

            }
        });
    }

})

var getPartnersByOrgId = (obj) => {
    var promise = new Promise(async (resolve, reject) => {
        var aggregateArr = []
        var matchQuery = {}
        const conditionObj = {}
        if (!(typeof obj.organizationId === 'undefined') && obj.status == 'approved') {
            matchQuery = {
                "organizationId": mongoose.Types.ObjectId(obj.organizationId),
                "status": obj.status
            }

        } else if (!(typeof obj.partnerEntity === 'undefined') && obj.status == 'approved') {
            matchQuery = {
                "partnerEntity": mongoose.Types.ObjectId(obj.partnerEntity),
                "status": obj.status
            }

        } else if (!(typeof obj.organizationId === 'undefined')) {
            matchQuery = {
                "organizationId": mongoose.Types.ObjectId(obj.organizationId)
            }

        } 
        else if (!(typeof obj.partnerEntity === 'undefined')) {
            matchQuery = {
                "partnerEntity": mongoose.Types.ObjectId(obj.partnerEntity)
            }
        }

        else if (!(typeof obj.childEntity === 'undefined')) {
            matchQuery = {
                "childEntity": mongoose.Types.ObjectId(obj.childEntity)
            }

        }
        if (obj.filters) {
            conditionObj['$and'] = [{
                $or: [
                    { 'corporate.code': { $regex: `${obj.filters}`, $options: "i" } },
                    { 'corporate.companyName': { $regex: `${obj.filters}`, $options: "i" } }
                ]
            }]
        }
         aggregateArr = [
            {
                $match: matchQuery
            },
           {
               $lookup: {
                   from: "corporates",
                   localField: "childEntity",
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
                $lookup: {
                    from: "users",
                    localField: "entityId",
                    foreignField: "companyCode",
                    as: "userdetail"
                }
           },
           {
               $unwind: {
                   "path": "$userdetail",
                   "preserveNullAndEmptyArrays": true
               }
           },

           {
            $lookup: {
                from: "organizations",
                localField: "organizationId",
                foreignField: "_id",
                as: "organization"
            }
        },
        {
            $unwind: {
                "path": "$organization",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            $match: conditionObj
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
            response2 = { isError: false, partners: responseObj };
            resolve(response2);
        } else {
            response2 = { isError: true, partners: [] };
            resolve(response2);
        }
    });
    return promise;
};

var getPartners = (obj) => {
    console.log('object --'.obj)
    var promise = new Promise(async (resolve, reject) => {
        var aggregateArr = []
        aggregateArr = [
                    {
                        $match:{
                            
                            $or: [
                                {childEntity : mongoose.Types.ObjectId(obj.partnerEntity)},
                                {partnerEntity : mongoose.Types.ObjectId(obj.partnerEntity)}
                            ]
                            
                        }
                    },
                   
              
               {
                $lookup: {
                    from: "organizations",
                    localField: "partnerEntity",
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
                $project: { 
                   
                    '_id': { $cond: { if: { $eq: ["$childEntity", mongoose.Types.ObjectId(obj.partnerEntity)] }, then: "$partnerEntity", else: "$childEntity"  } },
                  'entity_name': { $cond: { if: { $eq: ["$childEntity", mongoose.Types.ObjectId(obj.partnerEntity)] }, then: "$organizationDetails.name", else: "$entityName"  } },
                  'status': { $cond: { if: { $eq: ["$childEntity", mongoose.Types.ObjectId(obj.partnerEntity)] }, then: "approved", else: "$status"  } },
                  'entityId': { $cond: { if: { $eq: ["$childEntity", mongoose.Types.ObjectId(obj.partnerEntity)] }, then: "$organizationDetails.code", else: "$entityId"  } },
                  
                 
                }
            },
            
           
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
            console.log('responseObj--',responseObj)
            response2 = { isError: false, partners: responseObj };
            resolve(response2);
        } else {
            response2 = { isError: true, partners: [] };
            resolve(response2);
        }
    });
    return promise;
};

var update = (id, partner) => {
    var promise = new Promise((resolve, reject) => {
		schema.findOneAndUpdate({ 'childEntity': mongoose.Types.ObjectId(id) }, { $set : partner }, { new : true }, (error, result) =>{
			if(error) {
				var response = { isError: true, partner: {}, errors: [{"msg": "Failed to update partner!"}] };
            	resolve(response);
			} else {
				var response = { isError: false, partner: result, errors: [] };
            	resolve(response);
			}
		})
	});
	return promise;
};


module.exports = {
    create,
    getPartnersByOrgId,
    checkDuplicatePartner,
    getPartners,
    update
}