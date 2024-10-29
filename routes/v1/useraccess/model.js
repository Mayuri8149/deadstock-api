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
            } else {
                if (!(typeof partner.moduleId === 'undefined')) {
                    partnerObj.organizationId = mongoose.Types.ObjectId(partner.organizationId);
                }
                if (!(typeof partner.moduleId === 'undefined')) {
                    partnerObj.moduleId = partner.moduleId;
                }
                if (!(typeof partner.transactionId === 'undefined')) {
                    partnerObj.transactionId = partner.transactionId;
                }
                if (!(typeof partner.partnerId === 'undefined')) {
                    partnerObj.partnerId = partner.partnerId;
                }
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
        if(newPartner.isRead == false && newPartner.isWrite == false && newPartner.isDelete == false && newPartner.isUpdate== false ){
            newPartner.status = 'inactive'
        }else{
            newPartner.status = 'active'
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
        if(newPartner.isRead === false && newPartner.isWrite === false && newPartner.isDelete === false && newPartner.isUpdate === false ){
            newPartner.status = 'inactive'
        }else{
            newPartner.status = 'active'
        }
        existingPartner.isRead = newPartner.isRead
        existingPartner.isWrite = newPartner.isWrite
        existingPartner.isDelete = newPartner.isDelete
        existingPartner.isUpdate = newPartner.isUpdate
        existingPartner.updatedBy = newPartner.updatedBy
        existingPartner.status = newPartner.status
        existingPartner.save(function (err) {
            if (err) {
                return cb(err, existingPartner);
            } else {
                return cb(null, existingPartner);

            }
        });
    }

})

var getPartnersByUserId = (obj) => {
    var promise = new Promise(async (resolve, reject) => {
            const aggregateArr = [
                {
                    $match: {
                        "partnerId": mongoose.Types.ObjectId(obj.partnerId),
                        "status" : 'active'
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "partnerId",
                        foreignField: "_id",
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
                    $lookup: {
                        from: "modules",
                        localField: "moduleId",
                        foreignField: "_id",
                        as: "module"
                    }
                },
                {
                    $unwind: {
                        "path": "$module",
                        "preserveNullAndEmptyArrays": true
                    }
                },
                {
                    $lookup: {
                        from: "transtypes",
                        localField: "transactionId",
                        foreignField: "_id",
                        as: "transactionType"
                    }
                },
                {
                    $unwind: {
                        "path": "$transactionType",
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
            response2 = { isError: false, partners: responseObj };
            resolve(response2);
        } else {
            response2 = { isError: true, partners: [] };
            resolve(response2);
        }
    });
    return promise;
};

var findById = (obj) => {
    console.log("obj--model",obj)
    var promise = new Promise((resolve, reject) => {
         var data = {
            transactionId: mongoose.Types.ObjectId(obj.transTypeId),
            organizationId: mongoose.Types.ObjectId(obj.organizationId)
         };
         
         schema.findOne(data, (err, result) => {
            
             if(!err) {
                 var response = {isError: false, transType: result, errors: []};
                 resolve(response);
             } else {
                 var response = { isError: true, errors: [{msg: "Transaction Type not available!"}], transType: []};
                 resolve(response);
             }
         })
     });
 
     return promise;
 
 }

 var update = (id,organizationId,moduleId, transtype) => {
    var promise = new Promise((resolve, reject) => {
		schema.findOneAndUpdate({ transactionId: mongoose.Types.ObjectId(id), organizationId: mongoose.Types.ObjectId(organizationId),moduleId: mongoose.Types.ObjectId(moduleId) }, { $set : transtype }, { new : true }, (error, result) =>{
			if(error) {
				var response = { isError: true, transtype: {}, errors: [{"msg": "Failed to update transaction data-!"}] };
            	resolve(response);
			} else {
				var response = { isError: false, transtype: result, errors: [] };
            	resolve(response);
			}
		})
	});
	return promise;
};
module.exports = {
    create,
    getPartnersByUserId,
    checkDuplicatePartner,
    findById,
    update
}