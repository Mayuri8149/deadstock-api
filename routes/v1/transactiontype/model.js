var schema = require('./schema');
var mongoose = require('mongoose');
var moduleSchema = require('../module/schema');

var create = (transtype) => {
    var promise = new Promise((resolve, reject) => {
        var document = new schema(transtype);
        document.save().then((result) => {
            var response = { isError: false, transtype: result, errors: [] };
            resolve(response);
        }).catch((error) => {
            var response = { isError: true, transtype: {}, errors: [] };
            resolve(response);
        });
    });

    return promise;
}

var transactionTypecreate = async (transtype) => {
    transtype.createdAt = transtype.updatedAt = new Date(Date.now());
    let conditionObj = { organizationId: transtype.organizationId }
    if(transtype.transactionTypeCode){ conditionObj.transactionTypeCode= transtype.transactionTypeCode }
    // if(transtype.moduleId){ conditionObj.moduleId= transtype.moduleId }
    console.log('24-----transtype----',transtype)
    
        const result = await schema.findOneAndUpdate(
            conditionObj,
            {
                $set: transtype
            },
            { new: true, useFindAndModify: false, upsert: true }
        );
         return result;
    }

var findByName = (obj) => {
    var promise = new Promise((resolve, reject) => {
        
        var data = {}

        if(obj.corporateId){
            data.corporateId = mongoose.Types.ObjectId(obj.corporateId)
        }

        if(obj.organizationId){
            data.organizationId = mongoose.Types.ObjectId(obj.organizationId)
        }

        if(obj.transactionTypeName){
            data.transactionTypeName = obj.transactionTypeName
        }

        if(obj.transactionTypeCode){
            data.transactionTypeCode = obj.transactionTypeCode
        }

        if(obj.moduleId){
            data.moduleId = mongoose.Types.ObjectId(obj.moduleId)
        }

        console.log("obj----",obj)
        // End - Priyanka Patil (SNA-17) 18-05-2021
        schema.findOne((data), (err, result) => {
        console.log("obj data----",data)
        console.log("obj result----",result)

			if(!err && result) {
				var response = { isError: true, errors: [{"msg": "Transaction Type already available for this module!" }], transtypes: result};
            	resolve(response);
			} else {
				var response = { isError: false, errors: [], transtypes: [] };
            	resolve(response);
			}
		});
    });
    return promise; 
}

var findById = (obj) => {
   var promise = new Promise((resolve, reject) => {
        var data = {
            _id: obj.transTypeId
        };
        
        schema.findOne(data, (err, result) => {
           
            if(!err && result) {
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


var findByModulesId = (obj) => {

    var promise = new Promise((resolve, reject) => {
        var data = {
            moduleId: obj.moduleId,
            _id: obj.id
         };
         
         schema.find(data, (err, result) => {

             if(!err && result) {
                 var response = {isError: false, transType: result, errors: []};
                 resolve(response);
             } else {
                 var response = { isError: true, errors: [{msg: "Module not available!"}], transType: []};
                 resolve(response);
             }
         })
     });
 
     return promise;
 
 }
 
 var findByModuledId = (obj) => {
    var promise = new Promise((resolve, reject) => {
        var data = {
            moduleId: obj.moduleId,
            };

            schema.find(data, (err, result) => {

                if(!err && result) {
                    var response = {isError: false, transType: result, errors: []};
                    resolve(response);
                } else {
                    var response = { isError: true, errors: [{msg: "Module not available!"}], transType: []};
                resolve(response);
            }
            })
        });

        return promise;
}

var findByTransactionTypeId = (obj) => {
    var promise = new Promise((resolve, reject) => {
         var data = {
            transactionTypeId: obj.transTypeId
         };
         console.log("data",data)
         schema.find(data, (err, result) => {
            console.log("result11111111111111111111",result)
             if(!err && result) {
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

var findByModuleId = (obj) => {
        var promise = new Promise((resolve, reject) => {
    
            var filter = [];
            var matchQuery = {};
    
             var data = {
                 _id: mongoose.Types.ObjectId(obj.transTypeId)
             };
                
            if (obj.moduleId) {
                data.moduleId = mongoose.Types.ObjectId(obj.moduleId);
            };
             schema.findOne(data, (err, result) => {               
                if(!err && result) {                    
                    moduleSchema.findOne(data.moduleId, (err, res) => {
                        if(!err && res) {
                            result.moduleData = res.name;
                            var response = {isError: false, moduleData: res, transType: result,  errors: []};
                            resolve(response);
                        } else {
                            var response = { isError: true, errors: [{msg: "Transaction Type Data not available!"}], transType: []};
                            resolve(response);
                        }
                    })
                    // var response = {isError: false, transType: result, errors: []};
                    // resolve(response);
                } else {
                     var response = { isError: true, errors: [{msg: "Transaction Type Data not available!"}], transType: []};
                     resolve(response);
                 }
             })
    
            
         });

        return promise;
    };

var findDraftByIds = (ids, moduleId) => {
    var promise = new Promise((resolve, reject) => {

        for(var i=0; i < ids.length; i++) {
            ids[i] = mongoose.Types.ObjectId(ids[i]);
        }

        var data = {
            moduleId: { "$in" : ids }
        };

        if(moduleId) {
            data.moduleId = mongoose.Types.ObjectId(moduleId);
        }

        schema.find(data, (err, result) => {
			if(!err && result && result.length) {
                var response = {isError: false, drafts: result, errors: []};
                resolve(response);
            } else {
                var response = {isError: true, drafts: [], errors: [{msg: "Invalid Transaction Type ids"}]};
                resolve(response);
            }
		});
    });

    return promise;
};

var deleteMany = (moduleId) => {
	var promise = new Promise((resolve, reject) => {
		schema.deleteMany({ 'moduleId' : { $in : moduleId }}).then((result) => {
			var response = { isError: false, drafts: result, errors: [] };
            resolve(response);
		}).catch((err) => {
            var response = { isError: true, drafts: {}, errors: [] };
            resolve(response);
        });	
	});
	return promise;
};

var list = (data) => {
    var promise = new Promise((resolve, reject) => {

        var filter = [];

        var matchQuery = {};
        if(data.organizationId) {
            matchQuery.organizationId = mongoose.Types.ObjectId(data.organizationId);  
        }

        if(data.departmentId) {
            matchQuery.departmentId = mongoose.Types.ObjectId(data.departmentId);  
        }

        if(data.moduleId) {
            matchQuery.moduleId = mongoose.Types.ObjectId(data.moduleId)  
        }

        if(data.transTypeId){
            matchQuery._id = mongoose.Types.ObjectId(data.transTypeId)  
        }

        if(data.batchId){
            matchQuery._id = mongoose.Types.ObjectId(data.batchId)  
        }
        
        filter.push({ $match: matchQuery });

        filter.push({
            "$lookup": {
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
            "$lookup": {
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
            "$lookup": {
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

         filter.push({
            "$lookup": {
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
                var transtypes = [];
                for(var i=0; i < records.length; i++) {
                    var record = records[i];
                    if(record) {
                        var transtype = record;
                        transtype.organization = record.organization;
                        transtype.department = record.department;

                        transtypes.push(transtype);
                    }
                }
                var response = { isError: false, transtypes: transtypes };
                resolve(response);
            } else {
                var response = { isError: true, transtypes: [] };
                resolve(response);
            }
        });
    });

    return promise;
};

var listNew = (data,filters={}) => {
    console.log('data1',data)
    var promise = new Promise(async (resolve, reject) => {
        var aggregateArr = []
        var matchQuery = {};
            if(data.organizationId){
                matchQuery.organizationId = mongoose.Types.ObjectId(data.organizationId);
            }
            if(data.corporateId){
                matchQuery.corporateId = mongoose.Types.ObjectId(data.corporateId);
            }
            if(data.referenceId){
                matchQuery.referenceId = data.referenceId;
            }
            if(data.role == 'sysadmin' || data.role == 'subadmin'){
                if(data.referenceCreatedBy){
                    var userArr = JSON.parse(data.referenceCreatedBy)
                    matchQuery.referenceCreatedBy = { "$in" : userArr };
                }
            }else{
                if(data.referenceCreatedBy){
                    matchQuery.referenceCreatedBy = data.referenceCreatedBy;
                }
            }

            if(data.id){
                matchQuery._id = mongoose.Types.ObjectId(data.id);
            }

            if(data.role == 'sysadmin' && data.showithoutCorpId == 'showithoutCorpId' || data.role == 'subadmin' && data.showithoutCorpId == 'showithoutCorpId'){
                matchQuery.corporateId = {"$ne":undefined}
            }

            if(data.role == 'sysadmin' && data.showithCorpId == 'showithCorpId' || data.role == 'subadmin' && data.showithCorpId == 'showithCorpId'){
                matchQuery.corporateId = {"$eq":undefined}
            }

            if(data.role == 'sysadmin' && data.showithoutOrgId == 'showithoutOrgId' || data.role == 'subadmin' && data.showithoutOrgId == 'showithoutOrgId'){
                matchQuery.organizationId = {"$ne":mongoose.Types.ObjectId('111111111111111111111111')}
            }

            if(data.role == 'admin' && data.showToadmin == 'showToadmin'){
                matchQuery.corporateId = {"$eq":undefined}
            }

            if (data.moduleId){
                matchQuery.moduleId = mongoose.Types.ObjectId(data.moduleId);
            }     

            if(data.transTypeId){
                matchQuery._id = mongoose.Types.ObjectId(data.transTypeId);
            }

            if (filters.transactionTypeName) {
                matchQuery["transactionTypeName"] = { $regex: `${filters.transactionTypeName}`, $options: "i" }
            }
            if (filters.transactionTypeCode) {
                matchQuery["transactionTypeCode"] = { $regex: `${filters.transactionTypeCode}`, $options: "i" }
            }
            if (filters.additionalDescription) {
                matchQuery["additionalDescription"] = { $regex: `${filters.additionalDescription}`, $options: "i" }
            }
            if (filters.moduleCode) {
                matchQuery["module.code"] = { $regex: `${filters.moduleCode}`, $options: "i" }
            }
            if (filters.moduleName) {
                matchQuery["module.name"] = { $regex: `${filters.moduleName}`, $options: "i" }
            }
            if (filters.additionalDescription) {
                matchQuery["additionalDescription"] = { $regex: `${filters.additionalDescription}`, $options: "i" }
            }
            if (filters.organizationCode) {
                matchQuery["organization.code"] = { $regex: `${filters.organizationCode}`, $options: "i" }
            }
            if (filters.organizationName) {
                matchQuery["organization.name"] = { $regex: `${filters.organizationName}`, $options: "i" }
            }
            if (filters.category) {
                matchQuery["category.name"] = { $regex: `${filters.category}`, $options: "i" }
            }
            if (filters.subcategory) {
                matchQuery["subcategory.name"] = { $regex: `${filters.subcategory}`, $options: "i" }
            }
            if (filters.transaction) {
                matchQuery["transaction"] = { $regex: `${filters.transaction}`, $options: "i" }
            }
            if (filters.companyCode) {
                matchQuery["corporate.code"] = { $regex: `${filters.companyCode}`, $options: "i" }
            }
            if (filters.companyName) {
                matchQuery["corporate.companyName"] = { $regex: `${filters.companyName}`, $options: "i" }
            }
            if (filters.invitedEntityName) {
                matchQuery["$or"] = [
                            { "organizationsCreatedBy.name": { $regex: filters.invitedEntityName, $options: "i" } },
                            { "userCreatedBy.companyName": { $regex: filters.invitedEntityName, $options: "i" } }
                        ]
            }
            if (filters.status) {
                matchQuery["customstatus"] = { $regex: `${filters.status}`, $options: "i" }
            }
            matchQuery.is_deleted = false
            if ("searchKey" in filters && filters.searchKey) {
                matchQuery['$and'] = [{
                    $or: [
                        { 'transactionTypeName': { $regex: `${filters.searchKey}`, $options: "i" } },
                        { 'transactionTypeCode': { $regex: `${filters.searchKey}`, $options: "i" } },
                        { 'additionalDescription': { $regex: `${filters.searchKey}`, $options: "i" } },
                        { 'module.code': { $regex: `${filters.searchKey}`, $options: "i" } },
                        { 'module.name': { $regex: `${filters.searchKey}`, $options: "i" } },
                        { 'category.name': { $regex: `${filters.searchKey}`, $options: "i" } },
                        { 'subcategory.name': { $regex: `${filters.searchKey}`, $options: "i" } },
                        { 'transaction': { $regex: `${filters.searchKey}`, $options: "i" } },
                        { 'corporate.code': { $regex: `${filters.searchKey}`, $options: "i" } },
                        { 'corporate.companyName': { $regex: `${filters.searchKey}`, $options: "i" } },
                        { 'organization.name': { $regex: `${filters.searchKey}`, $options: "i" } },
                        { 'organization.code': { $regex: `${filters.searchKey}`, $options: "i" } },
                        { 'organizationsCreatedBy.name': { $regex: `${filters.searchKey}`, $options: "i" } },
                        { 'userCreatedBy.companyName': { $regex: `${filters.searchKey}`, $options: "i" } },
                        { 'customstatus': { $regex: `${filters.searchKey}`, $options: "i" } }
                    ]
                }]
            }
        aggregateArr = [
            {
                $addFields:{
                    "customstatus":{ $cond: { if: "$status", then: 'Active', else:'Inactive'} },
                }
            },
            // Start - Priyanka Patil (SNA-17) 18-05-2021
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
                    from: "departments",
                    localField: "departmentId",
                    foreignField: "_id",
                    as: "department"
                }
            },
            {
                $unwind: {
                    "path": "$department",
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
                    from: "batches",
                    localField: "batchId",
                    foreignField: "_id",
                    as: "batch"
                }
            },
            {
                $unwind: {
                    "path": "$batch",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                $lookup: {
                    from: "subcategories",
                    localField: "module.sub_category",
                    foreignField: "_id",
                    as: "subcategory"
                }
            },
            {
                $unwind: {
                    "path": "$subcategory",
                    "preserveNullAndEmptyArrays": true
                }
            },

            {
                $lookup: {
                    from: "categories",
                    localField: "module.category",
                    foreignField: "_id",
                    as: "category"
                }
            },
            {
                $unwind: {
                    "path": "$category",
                    "preserveNullAndEmptyArrays": true
                }
            },


            {
                $lookup: {
                    from: "corporates",
                    localField: "corporateId",
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
                    from: "relationships",
                    localField: "corporateId",
                    // Start - Priyanka Patil (SNA-I42) 19-06-2021
                    foreignField: "childEntity",
                    // ENd - Priyanka Patil (SNA-I42) 19-06-2021
                    as: "relationship"
                }
            },
            {
                $unwind: {
                    "path": "$relationship",
                    "preserveNullAndEmptyArrays": true
                }
            },

            {
                $lookup: {
                    from: "users",
                    localField: "relationship.email",
                    foreignField: "email",
                    as: "user"
                }
            },
            {
                $unwind: {
                    "path": "$user",
                    "preserveNullAndEmptyArrays": true
                }
            },

            // Start - Priyanka Patil (SNA-I80) 27-06-2021
            {
                $lookup: {
                    from: "users",
                    localField: "relationship.createdBy",
                    foreignField: "_id",
                    as: "userCreatedBy"
                }
            },
            {
                $unwind: {
                    "path": "$userCreatedBy",
                    "preserveNullAndEmptyArrays": true
                }
            },


            {
                $lookup: {
                    from: "userreferences",
                    localField: "userCreatedBy._id",
                    foreignField: "userId",
                    as: "userreferencesCreatedBy"
                }
            },
            {
                $unwind: {
                    "path": "$userreferencesCreatedBy",
                    "preserveNullAndEmptyArrays": true
                }
            },

            {
                $lookup: {
                    from: "organizations",
                    localField: "userreferencesCreatedBy.organizationId",
                    foreignField: "_id",
                    as: "organizationsCreatedBy"
                }
            },
            {
                $unwind: {
                    "path": "$organizationsCreatedBy",
                    "preserveNullAndEmptyArrays": true
                }
            },
            // End - Priyanka Patil (SNA-I80) 27-06-2021
            {
                $match: matchQuery
            },
            {
                $sort: {
                    updatedAt: -1
                }
            }
        ];
        let paginationResultArr = [];
        paginationResultArr.push({ $skip: data.page || 0 });

        if (data.size)
            paginationResultArr.push({ $limit: data.size });
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
        var transtypesResultArr = await schema.aggregate(aggregateArr).allowDiskUse(true);
        var response2;
        if (transtypesResultArr.length > 0) {
            const responseObj = {
                'transtypes': transtypesResultArr[0]['paginatedResults'],
                'total_count': transtypesResultArr[0]['totalCount'] && transtypesResultArr[0]['totalCount'].length ? transtypesResultArr[0]['totalCount'][0]['count'] : 0
            };
            response2 = { isError: false, transtypes: responseObj };
            resolve(response2);
        } else {
            response2 = { isError: true, transtypes: [] };
            resolve(response2);
        }
    });
    return promise;
};

var transcationlist = (data,filters={}) => {
    var promise = new Promise(async (resolve, reject) => {
        var aggregateArr = []
        var matchQuery = {};
            if(data.organizationId){
                matchQuery.organizationId = mongoose.Types.ObjectId(data.organizationId);
            }
            if(data.corporateId){
                matchQuery.corporateId = mongoose.Types.ObjectId(data.corporateId);
            }
            if(data.referenceId){
                matchQuery.referenceId = data.referenceId;
            }
            if(data.role == 'sysadmin' || data.role == 'subadmin'){
                if(data.referenceCreatedBy){
                    var userArr = JSON.parse(data.referenceCreatedBy)
                    matchQuery.referenceCreatedBy = { "$in" : userArr };
                }
            }else{
                if(data.referenceCreatedBy){
                    matchQuery.referenceCreatedBy = data.referenceCreatedBy;
                }
            }

            if(data.id){
                matchQuery._id = mongoose.Types.ObjectId(data.id);
            }

            if(data.role == 'sysadmin' && data.showithoutCorpId == 'showithoutCorpId' || data.role == 'subadmin' && data.showithoutCorpId == 'showithoutCorpId'){
                matchQuery.corporateId = {"$ne":undefined}
            }

            if(data.role == 'sysadmin' && data.showithoutOrgId == 'showithoutOrgId' || data.role == 'subadmin' && data.showithoutOrgId == 'showithoutOrgId'){
                matchQuery.organizationId = {"$ne":mongoose.Types.ObjectId('111111111111111111111111')}
            }

            if(data.role == 'admin' && data.showToadmin == 'showToadmin'){
                matchQuery.corporateId = {"$eq":undefined}
            }

            if (data.moduleId){
                matchQuery.moduleId = mongoose.Types.ObjectId(data.moduleId);
            }     

            if(data.transTypeId){
                matchQuery._id = mongoose.Types.ObjectId(data.transTypeId);
            }
            if (filters.transactionTypeName) {
                matchQuery["transactionTypeName"] = { $regex: `${filters.transactionTypeName}`, $options: "i" }
            }
            if (filters.transactionTypeCode) {
                matchQuery["transactionTypeCode"] = { $regex: `${filters.transactionTypeCode}`, $options: "i" }
            }
            if (filters.moduleCode) {
                matchQuery["module.code"] = { $regex: `${filters.moduleCode}`, $options: "i" }
            }
            if (filters.moduleName) {
                matchQuery["module.name"] = { $regex: `${filters.moduleName}`, $options: "i" }
            }
            if (filters.companyName) {
                matchQuery["corporate.companyName"] = { $regex: `${filters.companyName}`, $options: "i" }
            }
            if (filters.organizationName) {
                matchQuery["organization.name"] = { $regex: `${filters.organizationName}`, $options: "i" }
            }
            if (filters.status) {
                matchQuery["customstatus"] = { $regex: `${filters.status}`, $options: "i" }
            }
            if ("searchKey" in filters && filters.searchKey) {
                matchQuery['$and'] = [{
                    $or: [
                        { 'transactionTypeName': { $regex: `${filters.searchKey}`, $options: "i" } },
                        { 'transactionTypeCode': { $regex: `${filters.searchKey}`, $options: "i" } },
                        { 'module.code': { $regex: `${filters.searchKey}`, $options: "i" } },
                        { 'module.name': { $regex: `${filters.searchKey}`, $options: "i" } },
                        { 'corporate.companyName': { $regex: `${filters.searchKey}`, $options: "i" } },
                        { 'organization.name': { $regex: `${filters.searchKey}`, $options: "i" } },
                        { 'customstatus': { $regex: `${filters.searchKey}`, $options: "i" } }
                    ]
                }]
            }
            // matchQuery.is_deleted = false
        aggregateArr = [
            {
                $addFields:{
                    "customstatus":{ $cond: { if: "$status", then: 'Active', else:'Inactive'} },
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
                    from: "departments",
                    localField: "departmentId",
                    foreignField: "_id",
                    as: "department"
                }
            },
            {
                $unwind: {
                    "path": "$department",
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
                    from: "batches",
                    localField: "batchId",
                    foreignField: "_id",
                    as: "batch"
                }
            },
            {
                $unwind: {
                    "path": "$batch",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                $lookup: {
                    from: "subcategories",
                    localField: "module.sub_category",
                    foreignField: "_id",
                    as: "subcategory"
                }
            },
            {
                $unwind: {
                    "path": "$subcategory",
                    "preserveNullAndEmptyArrays": true
                }
            },

            {
                $lookup: {
                    from: "categories",
                    localField: "module.category",
                    foreignField: "_id",
                    as: "category"
                }
            },
            {
                $unwind: {
                    "path": "$category",
                    "preserveNullAndEmptyArrays": true
                }
            },


            {
                $lookup: {
                    from: "corporates",
                    localField: "corporateId",
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
                    from: "relationships",
                    localField: "corporateId",
                    foreignField: "childEntity",
                    as: "relationship"
                }
            },
            {
                $unwind: {
                    "path": "$relationship",
                    "preserveNullAndEmptyArrays": true
                }
            },

            {
                $lookup: {
                    from: "users",
                    localField: "relationship.email",
                    foreignField: "email",
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
                    from: "users",
                    localField: "relationship.createdBy",
                    foreignField: "_id",
                    as: "userCreatedBy"
                }
            },
            {
                $unwind: {
                    "path": "$userCreatedBy",
                    "preserveNullAndEmptyArrays": true
                }
            },


            {
                $lookup: {
                    from: "userreferences",
                    localField: "userCreatedBy._id",
                    foreignField: "userId",
                    as: "userreferencesCreatedBy"
                }
            },
            {
                $unwind: {
                    "path": "$userreferencesCreatedBy",
                    "preserveNullAndEmptyArrays": true
                }
            },

            {
                $lookup: {
                    from: "organizations",
                    localField: "userreferencesCreatedBy.organizationId",
                    foreignField: "_id",
                    as: "organizationsCreatedBy"
                }
            },
            {
                $unwind: {
                    "path": "$organizationsCreatedBy",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                $match: matchQuery
            },
            {
                $sort: {
                    updatedAt: -1
                }
            }
        ];
        let paginationResultArr = [];
        paginationResultArr.push({ $skip: data.page || 0 });

        if (data.size)
            paginationResultArr.push({ $limit: data.size });
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
        var transtypesResultArr = await schema.aggregate(aggregateArr).allowDiskUse(true);
        var response2;
        if (transtypesResultArr.length > 0) {
            const responseObj = {
                'transtypes': transtypesResultArr[0]['paginatedResults'],
                'total_count': transtypesResultArr[0]['totalCount'] && transtypesResultArr[0]['totalCount'].length ? transtypesResultArr[0]['totalCount'][0]['count'] : 0
            };
            response2 = { isError: false, transtypes: responseObj };
            resolve(response2);
        } else {
            response2 = { isError: true, transtypes: [] };
            resolve(response2);
        }
    });
    return promise;
};

var findType = (typeName) => {
    var promise = new Promise((resolve, reject) => {
        schema.findOne({
            transactionTypeName: typeName
        }, (err, type) => {
            if(!err && (type && type._id) ){
                var response = {isError: false, type: type, errors: []};
                resolve(response);
            } else {
                var response = {isError: true, type: {}, errors: [{msg: "Invalid type ID"}]};
                resolve(response);
            }            
        })
    });

    return promise;
}

//  Start- Mayuri, 23-01-2021, SCI-I618 
var update = (id, transtype) => {
    var promise = new Promise((resolve, reject) => {
		schema.findOneAndUpdate({ '_id': id }, { $set : transtype }, { new : true }, (error, result) =>{
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

var findAutoNumber = async(id) => {
    const result = await schema.findOne({"_id": id},
    {
        transactionTypePrefix: 1,
        transactionAutoNumber: 1        
    },
    )
    return result; 
};

var updateTransactionAutoNumber = async (id, transtype) => {

    const result = await schema.findOneAndUpdate(
        {  '_id': id },
        {
            $set: transtype
        },
        { new: true, useFindAndModify: false, upsert: true }
    );
    return result;	
};

var updateByTransactionType = (id, transtype) => {
	var promise = new Promise((resolve, reject) => {
		schema.findOneAndUpdate({ 'transactionTypeId': id }, { $set : transtype }, { new : true }, (error, result) =>{
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
//  End- Mayuri, 23-01-2021, SCI-I618 


const updateManyTranstype = async (transtype) => {
    console.log("transtype.....................",transtype)
    if (!transtype.transactionTypeCode) {
        return false;
    }
    let whereObj = {};
    if(transtype.transactionTypeCode){
        whereObj.transactionTypeCode = transtype.transactionTypeCode;
    }
    
    return await schema.updateMany(whereObj, { $set: transtype });
}


var findTypeModule = (typeName, module) => {
    var promise = new Promise((resolve, reject) => {
        schema.findOne({
            transactionTypeName: typeName,
            moduleId: module
        }, (err, type) => {
            if(!err && (type && type._id) ){
                var response = {isError: false, type: type, errors: []};
                resolve(response);
            } else {
                var response = {isError: true, type: {}, errors: [{msg: "Invalid type ID"}]};
                resolve(response);
            }            
        })
    });

    return promise;
}
var findModuleId = (obj) => {
    var promise = new Promise((resolve, reject) => {
         var data = {
             moduleId: mongoose.Types.ObjectId(obj.moduleId)
         };
         console.log("data",data)

         schema.find(data, (err, result) => {
             if(!err && result) {
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

 var updateTranstype = (id, module) => {
    var promise = new Promise((resolve, reject) => {
        schema.updateMany({ moduleId: { $in: id } }, { $set:  module }, (err, result) => {
			if (!err) {
				var response = { isError: false, errors: [] };
				resolve(response);
			} else {
				var response = { isError: true, errors: [{ msg: "failed to update status" }] };
				resolve(response);
			}
		});
	});
	return promise;
};


var listNewTrans = (data) => {
    console.log('data1',data)
    var promise = new Promise(async (resolve, reject) => {
        var aggregateArr = []
        var matchQuery = {};
            if(data.organizationId){
                matchQuery.organizationId = mongoose.Types.ObjectId(data.organizationId);
            }
            if(data.corporateId){
                matchQuery.corporateId = mongoose.Types.ObjectId(data.corporateId);
            }
            if(data.referenceId){
                matchQuery.referenceId = data.referenceId;
            }
            if(data.referenceCreatedBy){
                matchQuery.referenceCreatedBy = data.referenceCreatedBy;
            }

            if(data.id){
                matchQuery._id = mongoose.Types.ObjectId(data.id);
            }

            if(data.role == 'sysadmin' && data.showithoutCorpId == 'showithoutCorpId' || data.role == 'subadmin' && data.showithoutCorpId == 'showithoutCorpId'){
                matchQuery.corporateId = {"$ne":undefined}
            }

            if(data.role == 'sysadmin' && data.showithCorpId == 'showithCorpId' || data.role == 'subadmin' && data.showithCorpId == 'showithCorpId'){
                matchQuery.corporateId = {"$eq":undefined}
            }

            if(data.role == 'sysadmin' && data.showithoutOrgId == 'showithoutOrgId' || data.role == 'subadmin' && data.showithoutOrgId == 'showithoutOrgId'){
                matchQuery.organizationId = {"$ne":mongoose.Types.ObjectId('111111111111111111111111')}
            }

            if(data.role == 'admin' && data.showToadmin == 'showToadmin'){
                matchQuery.corporateId = {"$eq":undefined}
            }

            if (data.moduleId){
                matchQuery.moduleId = mongoose.Types.ObjectId(data.moduleId);
            }     

            if(data.transTypeId){
                matchQuery._id = mongoose.Types.ObjectId(data.transTypeId);
            }

            matchQuery.is_deleted = false

        aggregateArr = [
            {
                $match: matchQuery
            },
            // Start - Priyanka Patil (SNA-17) 18-05-2021
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
                    from: "departments",
                    localField: "departmentId",
                    foreignField: "_id",
                    as: "department"
                }
            },
            {
                $unwind: {
                    "path": "$department",
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
                    from: "batches",
                    localField: "batchId",
                    foreignField: "_id",
                    as: "batch"
                }
            },
            {
                $unwind: {
                    "path": "$batch",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                $lookup: {
                    from: "subcategories",
                    localField: "module.sub_category",
                    foreignField: "_id",
                    as: "subcategory"
                }
            },
            {
                $unwind: {
                    "path": "$subcategory",
                    "preserveNullAndEmptyArrays": true
                }
            },

            {
                $lookup: {
                    from: "categories",
                    localField: "module.category",
                    foreignField: "_id",
                    as: "category"
                }
            },
            {
                $unwind: {
                    "path": "$category",
                    "preserveNullAndEmptyArrays": true
                }
            },


            {
                $lookup: {
                    from: "corporates",
                    localField: "corporateId",
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
                    from: "relationships",
                    localField: "corporateId",
                    // Start - Priyanka Patil (SNA-I42) 19-06-2021
                    foreignField: "childEntity",
                    // ENd - Priyanka Patil (SNA-I42) 19-06-2021
                    as: "relationship"
                }
            },
            {
                $unwind: {
                    "path": "$relationship",
                    "preserveNullAndEmptyArrays": true
                }
            },

            {
                $lookup: {
                    from: "users",
                    localField: "relationship.email",
                    foreignField: "email",
                    as: "user"
                }
            },
            {
                $unwind: {
                    "path": "$user",
                    "preserveNullAndEmptyArrays": true
                }
            },

            // Start - Priyanka Patil (SNA-I80) 27-06-2021
            {
                $lookup: {
                    from: "users",
                    localField: "relationship.createdBy",
                    foreignField: "_id",
                    as: "userCreatedBy"
                }
            },
            {
                $unwind: {
                    "path": "$userCreatedBy",
                    "preserveNullAndEmptyArrays": true
                }
            },


            {
                $lookup: {
                    from: "userreferences",
                    localField: "userCreatedBy._id",
                    foreignField: "userId",
                    as: "userreferencesCreatedBy"
                }
            },
            {
                $unwind: {
                    "path": "$userreferencesCreatedBy",
                    "preserveNullAndEmptyArrays": true
                }
            },

            {
                $lookup: {
                    from: "organizations",
                    localField: "userreferencesCreatedBy.organizationId",
                    foreignField: "_id",
                    as: "organizationsCreatedBy"
                }
            },
            {
                $unwind: {
                    "path": "$organizationsCreatedBy",
                    "preserveNullAndEmptyArrays": true
                }
            },
            // {
            //     $lookup: {
            //         from: "assettracebilitysetups",
            //         localField: "assetTraceabilityField[0]._id",
            //         foreignField: "_id",
            //         as: "assettracebilitysetups"
            //     }
            // },
            // {
            //     $unwind: {
            //         "path": "$assettracebilitysetups",
            //         "preserveNullAndEmptyArrays": true
            //     }
            // },
            // End - Priyanka Patil (SNA-I80) 27-06-2021
            {
                $sort: {
                    updatedAt: -1
                }
            }
        ];
        let paginationResultArr = [];
        paginationResultArr.push({ $skip: data.page || 0 });

        if (data.size)
            paginationResultArr.push({ $limit: data.size });
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
        var transtypesResultArr = await schema.aggregate(aggregateArr).allowDiskUse(true);
        var response2;
        if (transtypesResultArr.length > 0) {
            const responseObj = {
                'transtypes': transtypesResultArr[0]['paginatedResults'],
                'total_count': transtypesResultArr[0]['totalCount'] && transtypesResultArr[0]['totalCount'].length ? transtypesResultArr[0]['totalCount'][0]['count'] : 0
            };
            response2 = { isError: false, transtypes: responseObj };
            resolve(response2);
        } else {
            response2 = { isError: true, transtypes: [] };
            resolve(response2);
        }
    });
    return promise;
};

var refTransType = (data) => {
    var promise = new Promise(async (resolve, reject) => {
        var aggregateArr = []
        var matchQuery = {};
            if(data.organizationId){
                matchQuery.organizationId = mongoose.Types.ObjectId(data.organizationId);
            }
            if(data.transactionTypeCode){
                matchQuery.refTransType = data.transactionTypeCode;
            }
            
        aggregateArr = [
            {
                $lookup: {
                    from: "useraccesses",
                    as: "useraccesses",
                    let: { "id": "$_id", "moduleId": "$moduleId"},
                    pipeline: [
                        {
                            $match: {
                                $and: [
                                    { $expr: { $eq: ["$transactionId", "$$id"] } },
                                    { $expr: { $eq: ["$moduleId", "$$moduleId"] } },
                                    { $expr: { $eq: ["$partnerId", mongoose.Types.ObjectId(data.userId)] } },
                                    // { $expr: { $eq: ["$isWrite", true] } }
                                ]
                            }
                        }
                    ]
                }
            },
            {
                $unwind:
                {
                    "path": "$useraccesses"
                }
            },
            {
                $match: matchQuery
            }
        ];
        let paginationResultArr = [];
        paginationResultArr.push({ $skip: data.page || 0 });

        if (data.size)
            paginationResultArr.push({ $limit: data.size });
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
        var transtypesResultArr = await schema.aggregate(aggregateArr).allowDiskUse(true);
        var response2;
        if (transtypesResultArr.length > 0) {
            const responseObj = {
                'transtypes': transtypesResultArr[0]['paginatedResults'],
                'total_count': transtypesResultArr[0]['totalCount'] && transtypesResultArr[0]['totalCount'].length ? transtypesResultArr[0]['totalCount'][0]['count'] : 0
            };
            response2 = { isError: false, transtypes: responseObj };
            resolve(response2);
        } else {
            response2 = { isError: true, transtypes: [] };
            resolve(response2);
        }
    });
    return promise;
};


const getTransByRefTrans = async (payloadData) => {
    const result = await schema.findOne(
        {   
            organizationId: payloadData.organizationId,
            transactionTypeCode: payloadData.refTransType
        }
    );
    return result;
};


module.exports = {
    findAutoNumber,
    findByName,
    create,
    update,
    list,
    findById,
    findByModuleId,
    findDraftByIds,
    deleteMany,
    findType,
    findTypeModule,
    findByTransactionTypeId,
    findByModulesId,
    findByModuledId,
    //  Start- Mayuri, 23-01-2021, SCI-I618 
    updateByTransactionType,
    //  End- Mayuri, 23-01-2021, SCI-I618 
    listNew,
    // Start - Priyanka Patil (SNA-71) 01-07-2021
    findModuleId,
    updateTranstype,
    transcationlist,
    listNewTrans,
    // End - Priyanka Patil (SNA-71) 01-07-2021
    updateManyTranstype,
    refTransType,
    getTransByRefTrans,
    updateTransactionAutoNumber,
    transactionTypecreate
}
