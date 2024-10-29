var schema = require('./schema');
var mongoose = require('mongoose');

var create = (batch) => {
	var promise = new Promise((resolve, reject) => {
		var document = new schema(batch);
		document.save().then(function(result) {
			var response = { isError: false, batch: result, errors: [] };
            resolve(response);
		}).catch((err) => {
            var response = { isError: true, batch: {}, errors: [] };
            resolve(response);
        });
	})
	return promise;
};

var update = (id, batch) => {
	var promise = new Promise((resolve, reject) => {
		schema.findOneAndUpdate({ '_id': id }, { $set : batch }, { new : true }, (error, result) =>{
			if(error) {
				var response = { isError: true, batch: {}, errors: [{"msg": "Failed to update batch!"}] };
            	resolve(response);
			} else {
				var response = { isError: false, batch: result, errors: [] };
            	resolve(response);
			}
		})
	});
	return promise;
};

var deleteMany = (ids) => {
	var promise = new Promise((resolve, reject) => {
		schema.deleteMany({ '_id' : { $in : ids }}).then((result) => {
			var response = { isError: false, batches: result, errors: [] };
            resolve(response);
		}).catch((err) => {
            var response = { isError: true, batches: {}, errors: [] };
            resolve(response);
        });	
	});
	return promise;
};

var list = (obj) => {
        var promise = new Promise((resolve, reject) => {
        var filter = [];

        var matchQuery = {
            departmentId: mongoose.Types.ObjectId(obj.departmentId)
        };

        if(obj.affiliateId) {
            matchQuery.affiliateId = mongoose.Types.ObjectId(obj.affiliateId)
        }

        if(obj.moduleId) {
            matchQuery.moduleId = mongoose.Types.ObjectId(obj.moduleId)
        }

        filter.push({ $match: matchQuery }, { $sort: { createdAt: -1 } });

        filter.push({
            $lookup: {
                from: "affiliates",
                localField: "affiliateId",
                foreignField: "_id",
                as: "affiliate"
            }
        });

        
        filter.push({
            $unwind: {
                "path": "$affiliate",
                "preserveNullAndEmptyArrays": true
            }
        });

        filter.push({
            $lookup: {
                from: "organizations",
                localField: "organizationId",
                foreignField: "_id",
                as: "organization"
            }
        });

        filter.push({
            $unwind: {
                "path": "$organization",
                "preserveNullAndEmptyArrays": true
            }
        });

        filter.push({
            $lookup: {
                from: "departments",
                localField: "departmentId",
                foreignField: "_id",
                as: "department"
            }
        });

        filter.push({
            $unwind: {
                "path": "$department",
                "preserveNullAndEmptyArrays": true
            }
        });

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

        var query = schema.aggregate(filter);

        query.exec((err, records) => {
            if (!err || records) {
                var batches = [];
                for(var i=0; i < records.length; i++) {
                    var record = records[i];
                    var fromDate = record.start;
                    var toDate = record.end;

                    var bodystartdate = new Date(fromDate);
                    var startDate = bodystartdate.toDateString();
                    var date = new Date(startDate);
                    var newDate =date.getFullYear() + '-' + (date.getMonth()+1) + '-' + date.getDate();
                    var bodyenddate = new Date(toDate);
                    var endDate = bodyenddate.toDateString();
                    var newEndDate = new Date(endDate);
                    var newDate1 = newEndDate.getFullYear() + '-' + (newEndDate.getMonth()+1) + '-' + newEndDate.getDate();
                    if(record) {
                        var fromDate = startDate;
                        var toDate = endDate;
                        var batch = record;
                        batch.start = newDate;
                        batch.end = newDate1;
                        batch.organization = record.organization;
                        batch.department = record.department;
                        batch.affiliate = record.affiliate;
                        batch.module = record.module;
                        batches.push(batch);
                    }
                }
                var response = { isError: false, batches: batches };
                resolve(response);
            } else {
                var response = { isError: true, batches: [] };
                resolve(response);
            }
        })
    });

    return promise;
}


//  Start- Mahalaxmi, 19-12-2020, SCI-I579
var listNew = (obj) => {
    var filter = [];
    //Start- Mahalaxmi, 08-01-2021, SCI-I579
    var matchQuery = {};
    //Start- Priyanka Patil, 22-01-2021, SCI-I715
    if(obj.tabIndex=='0' && obj.flag=='instbatches'){
        if(obj.organizationId) {
            matchQuery.organizationId = mongoose.Types.ObjectId(obj.organizationId)
        }
    }else if(obj.tabIndex=='1' && obj.flag=='instbatches'){
            matchQuery.organizationId = mongoose.Types.ObjectId(obj.organizationId)
    }else{
        // matchQuery.organizationId = mongoose.Types.ObjectId(obj.organizationId)
    }
    //End- Priyanka Patil, 22-01-2021, SCI-I715
        if(obj.departmentId) {
            matchQuery.departmentId = mongoose.Types.ObjectId(obj.departmentId)
        }
        //End- Mahalaxmi, 08-01-2021, SCI-I579
        
        if(obj.moduleId) {
            matchQuery.moduleId = mongoose.Types.ObjectId(obj.moduleId)
        }
       
        filter.push({ $match: matchQuery }, { $sort: { createdAt: -1 } });
        
        filter.push({
            $lookup: {
                from: "organizations",
                localField: "organizationId",
                foreignField: "_id",
                as: "organization"
            }
        });

        filter.push({
            $unwind: {
                "path": "$organization",
                "preserveNullAndEmptyArrays": true
            }
        });

        filter.push({
            $lookup: {
                from: "departments",
                localField: "departmentId",
                foreignField: "_id",
                as: "department"
            }
        });

        filter.push({
            $unwind: {
                "path": "$department",
                "preserveNullAndEmptyArrays": true
            }
        });

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
    var promise = new Promise((resolve, reject) => {            
        var query = schema.aggregate(filter);

        query.exec((err, records) => {
            if (!err || records) {
                var batches = [];
                var activeBatches = [];
                var batch_length;
                for(var i=0; i < records.length; i++) {
                    var record = records[i];
                    var fromDate = record.start;
                    var toDate = record.end;

                    var bodystartdate = new Date(fromDate);
                    var startDate = bodystartdate.toDateString();
                    var date = new Date(startDate);
                    var newDate =date.getFullYear() + '-' + (date.getMonth()+1) + '-' + date.getDate();
                    var bodyenddate = new Date(toDate);
                    var endDate = bodyenddate.toDateString();
                    var newEndDate = new Date(endDate);
                    var newDate1 = newEndDate.getFullYear() + '-' + (newEndDate.getMonth()+1) + '-' + newEndDate.getDate();
                    if(record) {
                        var fromDate = startDate;
                        var toDate = endDate;
                        var batch = record;
                        batch.start = newDate;
                        batch.end = newDate1;
                        batch.organization = record.organization;
                        batch.department = record.department;
                        //Start- Priyanka Patil, 22-01-2021, SCI-I715
                        batch.module = record.module;

                        if(batch.isDeleted == false) {
							batch.status = "Active";
								activeBatches.push(batch);
						} else {
							batch.status = "Inactive";
								activeBatches.push(batch);
                        }                        
                        batches.push(batch);
                    }
                    if(obj.tabIndex == '0') {
						batch_length = activeBatches.length;
					} else if(obj.tabIndex == '1') {
					}else{
					    batch_length = batches.length;
                    }
                    //End- Priyanka Patil, 22-01-2021, SCI-I715
                }
                resolve(batch_length);
            } else {
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
                var batches = [];
                for(var i=0; i < records.length; i++) {
                    var record = records[i];
                    var fromDate = record.start;
                    var toDate = record.end;

                    var bodystartdate = new Date(fromDate);
                    var startDate = bodystartdate.toDateString();
                    var date = new Date(startDate);
                    var newDate =date.getFullYear() + '-' + (date.getMonth()+1) + '-' + date.getDate();
                    var bodyenddate = new Date(toDate);
                    var endDate = bodyenddate.toDateString();
                    var newEndDate = new Date(endDate);
                    var newDate1 = newEndDate.getFullYear() + '-' + (newEndDate.getMonth()+1) + '-' + newEndDate.getDate();
                    if(record) {
                        var fromDate = startDate;
                        var toDate = endDate;
                        var batch = record;
                        batch.start = newDate;
                        batch.end = newDate1;
                        batch.organization = record.organization;
                        batch.department = record.department;
                        //Start- Priyanka Patil, 22-01-2021, SCI-I715
                        batch.module = record.module;

                        if(batch.isDeleted == false && obj.tabIndex == '0' && obj.flag=='instbatches') {
							batch.status = "Active";
								batches.push(batch);
						} else if(obj.tabIndex == '1' && obj.flag=='instbatches') { 
							batch.status = "Inactive";
								batches.push(batch);
                        }else{
                            batches.push(batch);
                        }      
                        //End- Priyanka Patil, 22-01-2021, SCI-I715                             
                    }

                }
                response1 = { isError: false, batches: batches, totalCount:response };
                resolve(response1);
            } else {
                response1 = { isError: true, batches: [], totalCount:0 };
                resolve(response1);
            }
        })
            setTimeout(() => resolve(response1), 1000);
        });      
      });
    return promise;
};


//  End- Mahalaxmi, 19-12-2020, SCI-I579


var findById = (id) => {
    var promise = new Promise((resolve, reject) => {
		var data = {
            _id: id
        };
		schema.findOne(data, (err, result) => {
			if(!err && result && result._id) {
                var response = {isError: false, batch: result, errors: []};
                resolve(response);
            } else {
                var response = {isError: true, batch: {}, errors: [{param: "id", msg: "Invalid batch id"}]};
                resolve(response);
            }
		});
	});

	return promise;
};

var findByCode = (obj) => {
    var promise = new Promise((resolve, reject) => {
        var data = {
            organizationId: obj.organizationId,
            // departmentId: obj.departmentId,
            // affiliateId: obj.affiliateId,
		    moduleId: obj.moduleId,
            // code: obj.code
        };

        schema.find(data, (err, result) => {
			if(!err && result && result.length) {
				var response = { isError: false, errors: [{msg: "Batch ID already available!"}], batches: result};
            	resolve(response);
			} else {
				var response = { isError: false, errors: [{msg: "Batch ID not available"}], batches: [] };
            	resolve(response);
			}
		});
    });
    return promise; 
};

var findBatch = (batchName) => {
    var promise = new Promise((resolve, reject) => {
        schema.findOne({
            code: batchName
        }, (err, batch) => {
            if(!err && (batch && batch._id) ){
                var response = {isError: false, batch: batch, errors: []};
                resolve(response);
            } else {
                var response = {isError: true, batch: {}, errors: [{msg: "Invalid batch ID"}]};
                resolve(response);
            }            
        })
    });

    return promise;
}

var findBatchWithModule = (batchName, moduleName) => {
    var promise = new Promise((resolve, reject) => {
        schema.findOne({
            code: batchName,
            moduleid: moduleName
        }, (err, batch) => {
            if(!err && (batch && batch._id) ){
                var response = {isError: false, batch: batch, errors: []};
                resolve(response);
            } else {
                var response = {isError: true, batch: {}, errors: [{msg: "Invalid batch ID"}]};
                resolve(response);
            }            
        })
    });

    return promise;
}

const getTransTypeData = async (payload) => {
    let whereObj = {
        'organizations_details.code': payload.organization_code,
        'module_details.code': payload.module_code,
        'department_details.code': payload.department_code,
        'code': payload.batch_code,
        'organizations_details.transactiontype_details.transactionTypeName': payload.transaction_type,
    };


    const aggregateArr = [
        {
            '$lookup':
            {
                from: 'organizations',
                localField: 'organizationId',
                foreignField: '_id',
                as: 'organizations_details'
            }
        },
        { '$unwind': '$organizations_details' },
        {
            '$lookup':
            {
                from: 'modules',
                localField: 'moduleId',
                foreignField: '_id',
                as: 'module_details'
            }
        },
        { '$unwind': '$module_details' },
        {
            '$lookup':
            {
                from: 'departments',
                localField: 'departmentId',
                foreignField: '_id',
                as: 'department_details'
            }
        },
        { '$unwind': '$department_details' },
        {
            '$lookup':
            {
                from: 'transactiontypes',
                localField: 'organizations_details._id',
                foreignField: 'organizationId',
                as: 'organizations_details.transactiontype_details'
            }
        },
        { '$unwind': '$organizations_details.transactiontype_details' },

        {
            $match: whereObj
        },
        {
            $project: {
                batch_id: '$_id', organization_id: '$organizations_details._id', module_id: '$module_details._id',
                department_id: '$department_details._id', transactiontype_id: '$organizations_details.transactiontype_details._id'
            }
        }

    ];
    
    
    transactionResultArr = await schema.aggregate(aggregateArr).allowDiskUse(true);
     /*  Start- Name -Shubhangi, Date Of Code - 11-02-2021 SC-transaction_route*/
    if (transactionResultArr.length > 0) {
        responseObj = {
            'certInfo': transactionResultArr.length && transactionResultArr[0] ? transactionResultArr[0] : {}
        };
    } else {
        responseObj = {};
    }
    /*  End- Name -Shubhangi, Date Of Code - 11-02-2021 SC-transaction_route*/

    return responseObj;
};

/*  Start- Name -Shubhangi, Date Of Code - 12-04-2021 zoho Task Number -SCI-I852*/
var findModule = (id,isActive) => {
    if(isActive == true){
       var isDeleted = false
    }else{
       var isDeleted = true
    }
    var promise = new Promise((resolve, reject) => {
		schema.find({ 'moduleId': mongoose.Types.ObjectId(id) }, (error, result) =>{
			if(error) {
				var response = { isError: true, module: {}, errors: [{"msg": "Failed to update Batch!"}] };
            	resolve(response);
			} else {
                for(let i = 0;i<result.length;i++){
                    result[i].isDeleted = isDeleted
                    result[i].save() 
                }
				var response = { isError: false, module: result, errors: [] };
            	resolve(response);
			}
		})
	});
	return promise;
}
/*  End- Name -Shubhangi, Date Of Code - 12-04-2021 zoho Task Number -SCI-I852*/
module.exports = {
	create,
	update,
	deleteMany,
	list,
    findById,
    findByCode,
    findBatch,
    findBatchWithModule,
    listNew,
    getTransTypeData,
    /*  Start- Name -Shubhangi, Date Of Code - 12-04-2021 zoho Task Number -SCI-I852*/
    findModule
    /*  End- Name -Shubhangi, Date Of Code - 12-04-2021 zoho Task Number -SCI-I852*/
}
