var schema = require('./schema');
var mongoose = require('mongoose');

var create = (department) => {

    var promise = new Promise((resolve, reject) => {
        var document = new schema(department);
        document.save().then(function (result) {
            var response = { isError: false, department: result, errors: [] };
            resolve(response);
        }).catch((err) => {
            var response = { isError: true, department: {}, errors: [] };
            resolve(response);
        });
    });

    return promise;
};

var list = (data) => {
    var promise = new Promise((resolve, reject) => {

        var queryParams = {
            organizationId: data.organizationId
        };

        if(data._id) {
			queryParams._id = data._id
		}
        
        var options = {
            skip: parseInt(data.skip),
            limit: parseInt(data.limit),
            isActive: data.isActive
        };

        schema.find(queryParams, null, options, (err, departments) => {
            if(err) {
                var response = { isError: true, departments: [], errors: [] };
                resolve(response);
            } else {
                var response = { isError: false, departments: departments, errors: [] };
                resolve(response);
            }
            //  Start- Shubhangi, 05-02-2020, SCI-I749
        }).sort({updatedAt: -1});
        //  End- Shubhangi, 06-02-2020, SCI-I749
    });

    return promise;
};

var listNew = (obj,filters={}) => {
    var promise = new Promise(async (resolve, reject) => {

        const whereObj = {
            // code: {$ne:'Default'}
        }

        if(obj.organizationId) {
            whereObj.organizationId = mongoose.Types.ObjectId(obj.organizationId)
        };
        if(obj._id) {
            whereObj._id = mongoose.Types.ObjectId(obj._id)
        };
        if(obj.isActive) {
            whereObj.isActive = obj.isActive
        };
        if (filters.deptId) {
            whereObj["code"] = { $regex: `${filters.deptId}`, $options: "i" }
        }
        if (filters.deptName) {
            whereObj["name"] = { $regex: `${filters.deptName}`, $options: "i" }
        }
        if (filters.deptLocation) {
            whereObj["branch_location"] = { $regex: `${filters.deptLocation}`, $options: "i" }
        }
        if (filters.deptAddress) {
            whereObj["branch_address"] = { $regex: `${filters.deptAddress}`, $options: "i" }
        }
        if (filters.status) {
            whereObj["customstatus"] = { $regex: `${filters.status}`, $options: "i" }
        }
        if ("searchKey" in filters && filters.searchKey) {
            whereObj['$and'] = [{
                $or: [
                    { 'code': { $regex: `${filters.searchKey}`, $options: "i" } },
                    { 'name': { $regex: `${filters.searchKey}`, $options: "i" } },
                    { 'branch_location': { $regex: `${filters.searchKey}`, $options: "i" } },
                    { 'branch_address': { $regex: `${filters.searchKey}`, $options: "i" } },
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
            response2 = { isError: false, departments: responseObj };
            resolve(response2);
        } else {
            response2 = { isError: true, departments: [] };
            resolve(response2);
        }
    });
    return promise;
};

// Start - Priyanka Patil (SNA-17) 18-05-2021
var findByOrganization = (id) => {
    var promise = new Promise((resolve, reject) => {
		var data = {
            organizationId: id
        };
		schema.findOne(data, (err, result) => {
			if(!err && result && result._id) {
                var response = {isError: false, department: result, errors: []};
                resolve(response);
            } else {
                var response = {isError: true, department: {}, errors: [{param: "id", msg: "Invalid organization id"}]};
                resolve(response);
            }
		});
	});

	return promise;
};
// End - Priyanka Patil (SNA-17) 18-05-2021

var findById = (id) => {
    var promise = new Promise((resolve, reject) => {
		var data = {
            _id: id
        };
		schema.findOne(data, (err, result) => {
			if(!err && result && result._id) {
                var response = {isError: false, department: result, errors: []};
                resolve(response);
            } else {
                var response = {isError: true, department: {}, errors: [{param: "id", msg: "Invalid branch id"}]};
                resolve(response);
            }
		});
	});

	return promise;
};
// Start Rohini Kamble (SCI-I797) 22/03/2021
var updateDepartment = (id, department) => {
    var promise = new Promise((resolve, reject) => {
        schema.findOneAndUpdate({ organizationId:mongoose.Types.ObjectId(id),code : 'HO' }, { $set : department }, { new : true }, (error, result) =>{
            if(error) {
                var response = { isError: true, department: {}, errors: [{"msg": "Failed to update department!"}] };
     resolve(response);
            } else {
                var response = { isError: false, department: result, errors: [] };
     resolve(response);
            }
        })
    });
    return promise;
};
// End Rohini Kamble (SCI-I797) 22/03/2021

var update = (department) => {

    var promise = new Promise((resolve, reject) => {
        department.save().then((result) => {
            var response = { isError: false, department: result, errors: [] };
            resolve(response);
        }).catch((err) => {
            var response = { isError: false, department: {}, errors: [{"msg": "Failed to update department!"}] };
            resolve(response);
        })
    });

    return promise;
};

var findByCode = (obj) => {
    var promise = new Promise((resolve, reject) => {
        var codeData = {
            organizationId: obj.organizationId,
            code: obj.code
        };

        var nameData = {
            organizationId: obj.organizationId,
            name: obj.name
        };

        schema.find(codeData, (err, result) => {
            
			if(!err && result && result.length) {
               
				var response = { isError: false, errors: [{msg: "Branch Code already available!"}], departments: result};
            	resolve(response);
            } 
            else{
                schema.find(nameData, (err, result) => {
                    
                    if(!err && result && result.length) {
                        var response = { isError: false, errors: [{msg: "Branch Name already available!"}], departments: result};
                        resolve(response);
                    } 
                    else{
                        var response = { isError: false, errors: [{msg: "Branch ID not available"}], departments: [] };
                        resolve(response);
                    }
                });
			}
        });
        
        
    });
    return promise; 
};

var findDepartment = (departmentName) => {
    var promise = new Promise((resolve, reject) => {
        schema.findOne({
            name: departmentName
        }, (err, department) => {
            if(!err && (department && department._id) ){
                var response = {isError: false, department: department, errors: []};
                resolve(response);
            } else {
                var response = {isError: true, department: {}, errors: [{msg: "Invalid branch ID"}]};
                resolve(response);
            }            
        })
    });

    return promise;
}

module.exports = {
    create,
    list,
    findById,
    // Start Rohini Kamble (SCI-I797) 22/03/2021
    updateDepartment,
    // End Rohini Kamble (SCI-I797) 22/03/2021
    update,
    findByCode,
    findDepartment,
    listNew,
    // Start - Priyanka Patil (SNA-17) 18-05-2021
    findByOrganization
    // End - Priyanka Patil (SNA-17) 18-05-2021
};