var schema = require('./schema');
var mongoose = require('mongoose');


var findById = (id) => {
    var promise = new Promise((resolve, reject) => {
        var data = {
            _id: id
        };
		schema.findOne(data, (err, result) => {
			if(!err && result && result._id) {
                var response = {isError: false, draft: result, errors: []};
                resolve(response);
            } else {
                var response = {isError: true, draft: {}, errors: [{param: "id", msg: "Invalid draft id"}]};
                resolve(response);
            }
		});
    });

    return promise;
};
//  Start- Priyanka Patil, 21-01-2021, SCI-I715
var findDraftByIds = (ids) => {
    var promise = new Promise((resolve, reject) => {

        for(var i=0; i < ids.length; i++) {
            ids[i] = mongoose.Types.ObjectId(ids[i]);
        }

        var data = {
            _id: { "$in" : ids }
        };

        schema.find(data, (err, result) => {
			if(!err && result && result.length) {
                var response = {isError: false, drafts: result, errors: []};
                resolve(response);
            } else {
                var response = {isError: true, drafts: [], errors: [{msg: "Invalid draft ids"}]};
                resolve(response);
            }
		});
    });

    return promise;
};

var insertMany = (partners) => {
	var promise = new Promise((resolve, reject) => {
        
		schema.insertMany(partners, function(err, result) {
			if(!err) {
				var response = { isError: false, partners: result, errors: [] };
            	resolve(response);
			} else {
				var response = { isError: true, partner: {}, errors: [] };
            	resolve(response);
			}
		})
	})
	return promise;
};

var insertRecords = (partners) => {
	var promise = new Promise((resolve, reject) => {
        var partner = {
            batchId: partners.batchId,
            //  Start- Priyanka Patil, 10-02-2021, SCI-I744
            moduleId: partners.moduleId,
            //  End- Priyanka Patil, 10-02-2021, SCI-I744
            organizationId: partners.organizationId,
            code: { value: partners.code, error: false },
            firstName: { value: partners.firstName, error: false },
            lastName: { value: partners.lastName, error: false },
            father: { value: partners.father, error: false },
            dob: { valuue: partners.dob, error: false },
            aadhar: { value: partners.aadhar, error: false },
            phoneNumber: { value: partners.phoneNumber, error: false },
            email: { value: partners.email, error: false }
        }
		schema.insertMany(partner, function(err, result) {
			if(!err) {
				var response = { isError: false, partners: result, errors: [] };
            	resolve(response);
			} else {
				var response = { isError: true, partner: {}, errors: [] };
            	resolve(response);
			}
		})
	})
	return promise;
};

var changeStatus = (ids, status) => {
	var promise = new Promise((resolve, reject) => {
		schema.updateMany({ _id: { $in: ids }}, { $set : { status : status}}, (err, result) => {
			if(!err) {
				var response = { isError: false, errors: [] };
            	resolve(response);
			}else {
				var response = { isError: true, errors: [{msg: "failed to update the draft status"}] };
            	resolve(response);
			}
		});
	});
	return promise;
};

var update = (id, draft) => {
	var promise = new Promise((resolve, reject) => {
		schema.findOneAndUpdate({ '_id': id }, { $set : draft }, { new : true }, (error, result) =>{
			if(error) {
				var response = { isError: true, draft: {}, errors: [{"msg": "Failed to update draft!"}] };
            	resolve(response);
			} else {
				var response = { isError: false, draft: result, errors: [] };
            	resolve(response);
			}
		})
	});
	return promise;
};

var list = (obj) => {
    var promise = new Promise((resolve, reject) => {
        var filter = [];

        var matchQuery = {
            batchId: mongoose.Types.ObjectId(obj.batchId),
            status: obj.status
        };

        filter.push({ $match: matchQuery }, { $sort: { createdAt: -1 } });

        filter.push({
            $lookup: {
                from: "batches",
                localField: "batchId",
                foreignField: "_id",
                as: "batch"
            }
        });

        
        filter.push({
            $unwind: {
                "path": "$batch",
                "preserveNullAndEmptyArrays": true
            }
        });

        var query = schema.aggregate(filter);

        query.exec((err, records) => {

            if (!err || records) {
                var drafts = [];
                for(var i=0; i < records.length; i++) {
                    var record = records[i];
                    if(record) {
                        var draft = record;
                        draft.batch = record.batch;
                        drafts.push(draft);
                    }
                }
                var response = { isError: false, drafts: drafts };
                resolve(response);
            } else {
                var response = { isError: true, drafts: [] };
                resolve(response);
            }
        })
    });

    return promise;
}

//  Start- Mahalaxmi, 12-01-2021, SCI-I579
var listNew = (obj) => {
    var filter = [];
        //  Start- Priyanka Patil, 10-02-2021, SCI-I744
        var matchQuery = {
            moduleId: mongoose.Types.ObjectId(obj.moduleId),
            status: obj.status
        };

        filter.push({ $match: matchQuery }, { $sort: { createdAt: -1 } });

        filter.push({
            $lookup: {
                from: "modules",
                localField: "moduleId",
                foreignField: "_id",
                as: "module"
            }
        });

        
        filter.push({
            $unwind: {
                "path": "$module",
                "preserveNullAndEmptyArrays": true
            }
        });
        //  End- Priyanka Patil, 10-02-2021, SCI-I744
    var promise = new Promise((resolve, reject) => {            
        var query = schema.aggregate(filter);

        query
        .exec((err, records) => {

            if (!err || records) {
                var drafts = [];
                for(var i=0; i < records.length; i++) {
                    var record = records[i];
                    if(record) {
                        var draft = record;
                        draft.batch = record.batch;
                        drafts.push(draft);
                    }
                }
                //var response = { isError: false, drafts: drafts };
                resolve(drafts.length);
            } else {
              //  var response = { isError: true, drafts: [] };
                resolve(0);
            }
        })
    }).then(function(response){
        
        return new Promise((resolve, reject) => {
            var response1;
            var query = schema.aggregate(filter);

        query
        .skip(parseInt(obj.skip))
        .limit(parseInt(obj.limit))
        //  Start- Shubhangi, 05-02-2020, SCI-I749
        .sort({updatedAt: -1}) 
        //  End- Shubhangi, 06-02-2020, SCI-I749       
        .exec((err, records) => {
            if (!err || records) {
                var drafts = [];
                for(var i=0; i < records.length; i++) {
                    var record = records[i];
                    if(record) {
                        var draft = record;
                        draft.batch = record.batch;
                        drafts.push(draft);
                    }
                }
                response1 = { isError: false, drafts: drafts, totalCount:response };
                resolve(response1);
            } else {
                response1 = { isError: true, drafts: [], totalCount:0 };
                resolve(response1);
            }
        })
            setTimeout(() => resolve(response1), 1000);
        });      
      });
    return promise;
};
//  End- Mahalaxmi, 12-01-2021, SCI-I579

var deleteMany = (ids) => {
	var promise = new Promise((resolve, reject) => {
		schema.deleteMany({ '_id' : { $in : ids }}).then((result) => {
			var response = { isError: false, drafts: result, errors: [] };
            resolve(response);
		}).catch((err) => {
            var response = { isError: true, drafts: {}, errors: [] };
            resolve(response);
        });	
	});
	return promise;
};

module.exports = {
    insertMany,
    list,
    changeStatus,
    update,
    findById,
    deleteMany,
    findDraftByIds,
    //  Start- Mahalaxmi, 12-01-2021, SCI-I579
    insertRecords,
    listNew
     //  End- Mahalaxmi, 12-01-2021, SCI-I579
};