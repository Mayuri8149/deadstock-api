var schema = require('./schema');
var affiliateModules = require('./affiliateSchema');
var mongoose = require('mongoose');

var create = (module) => {
    var promise = new Promise((resolve, reject) => {
        var document = new schema(module);
        document.save().then((result) => {
            var response = { isError: false, module: result, errors: [] };
            resolve(response);
        }).catch((error) => {
            var response = { isError: true, module: {}, errors: [] };
            resolve(response);
        });
    });

    return promise;
}

var list = (data) => {
    var promise = new Promise((resolve, reject) => {

        var filter = [];

        var matchQuery = {
            organizationId: mongoose.Types.ObjectId(data.organizationId)        
        };

        if(data.departmentId) {
            matchQuery.departmentId = mongoose.Types.ObjectId(data.departmentId);  
        }
        if(data.isActive){
            matchQuery.isActive = true;
        }    

        filter.push({ $match: matchQuery }, { $sort: { createdAt: -1 } });

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

        var query = schema.aggregate(filter);

        query.exec((err, records) => {
            if (!err || records) {
                var modules = [];
                for(var i=0; i < records.length; i++) {
                    var record = records[i];
                    if(record) {
                        var module = record;
                        module.organization = record.organization;
                        module.department = record.department;

                        modules.push(module);
                    }
                }
                var response = { isError: false, modules: modules };
                resolve(response);
            } else {
                var response = { isError: true, modules: [] };
                resolve(response);
            }
        });
    });

    return promise;
};

//============= Start Neha Mutke (SNA-I9) 10/06/2021 =============
var moduleList = () => {
    var promise = new Promise((resolve, reject) => {
        var data = {
            organizationId: undefined,
            departmentId: undefined,
            isActive: true,
            is_deleted: false
        };
        schema.find(data, (err, result) => {
            if(!err && (result && result.length) ){
                var response = {isError: false, modules: result, errors: []};
                resolve(response);
            } else {
                var response = {isError: true, modules: {}, errors: [{msg: "Invalid Data"}]};
                resolve(response);
            }
		});
    });
    return promise;
};
//============= End Neha Mutke (SNA-I9) 10/06/2021 =============

var listNew = (data) => {
    var filter = [];

        var matchQuery = {
            organizationId: mongoose.Types.ObjectId(data.organizationId)        
        };

        if(data.departmentId) {
            matchQuery.departmentId = mongoose.Types.ObjectId(data.departmentId);  
        }
        if(data.isActive){
            matchQuery.isActive = true;
        }    

        filter.push({ $match: matchQuery }, { $sort: { createdAt: -1 } });

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

    var promise = new Promise((resolve, reject) => {            
        var query = schema.aggregate(filter);
        query.exec((err, records) => {
            if (!err || records) {
                var modules = [];
                for(var i=0; i < records.length; i++) {
                    var record = records[i];
                    if(record) {
                        var module = record;
                        module.organization = record.organization;
                        module.department = record.department;

                        modules.push(module);
                    }
                }
                resolve(modules.length);
            } else {
                resolve(0);
            }
        });
    }).then(function(response){
        return new Promise((resolve, reject) => {
            var query = schema.aggregate(filter);
            var response1;
        query        
        .skip(parseInt(data.skip))
        .limit(parseInt(data.limit))
        //  Start- Shubhangi, 05-02-2020, SCI-I749
        .sort({updatedAt: -1})
        //  End- Shubhangi, 06-02-2020, SCI-I749
        .exec((err, records) => {
            if (!err || records) {
                var modules = [];
                for(var i=0; i < records.length; i++) {
                    var record = records[i];
                    if(record) {
                        var module = record;
                        module.organization = record.organization;
                        module.department = record.department;
                        modules.push(module);
                    }
                }
                response1 = { isError: false, modules: modules, totalCount:response };
                resolve(response1);
            } else {
                response1 = { isError: true, modules: [], totalCount:0 };
                resolve(response1);
            }
        });
        setTimeout(() => resolve(response1), 1000);
        });      
      });
    return promise;
};


var getAffiliateModules = (data) => {

    var promise = new Promise((resolve, reject) => {

        var filter = [];

        var matchQuery = {
            organizationId: mongoose.Types.ObjectId(data.organizationId),
            departmentId: mongoose.Types.ObjectId(data.departmentId)
        };
    
        if(data.affiliateId) {
            matchQuery.affiliateId = mongoose.Types.ObjectId(data.affiliateId);
        }


        filter.push({ $match: matchQuery }, { $sort: { createdAt: -1 } });

        filter.push({
            "$lookup": {
                from: "affiliatemodules",
                localField: "modulesId",
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
                as: "modules"
            }
        });

        filter.push({
            $unwind: {
                "path": "$modules",
                "preserveNullAndEmptyArrays": true
            }
        });

        filter.push({
            "$lookup": {
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

        var query = affiliateModules.aggregate(filter);

        query.exec((err, records) => {
            if (!err || records) {
                var modules = [];
                for(var i=0; i < records.length; i++) {
                    var record = records[i];
                    if(record) {
                        var module = record;
                        
                        module.organization = record.organization;
                        module.department = record.department;
                        module.modules = record.modules;
                        module.affiliate = record.affiliate;
                        
                        if(data.affiliateId) {
                            module.affiliate = record.affiliate;
                        }
                        module.affiliateReferenceId = record._id;
                        module.affiliateReferenceIsActive = record.isActive;
                        modules.push(module);
                    }
                }

                var response = { isError: false, modules: modules, errors: [] };
                resolve(response);
            } else {
                var response = { isError: true, modules: [], errors: [{msg: "No Modules found!"}] };
                resolve(response);
            }
        });

    });

    return promise;
}

var getAffiliateModulesNew = (data) => {

    var filter = [];

        var matchQuery = {
            organizationId: mongoose.Types.ObjectId(data.organizationId),
            departmentId: mongoose.Types.ObjectId(data.departmentId)
        };
    
        if(data.affiliateId) {
            matchQuery.affiliateId = mongoose.Types.ObjectId(data.affiliateId);
        }

        if(data.isActive) {
            matchQuery.isActive = data.isActive;
        }


        filter.push({ $match: matchQuery }, { $sort: { createdAt: -1 } });

        filter.push({
            "$lookup": {
                from: "affiliatemodules",
                localField: "modulesId",
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
                as: "modules"
            }
        });

        filter.push({
            $unwind: {
                "path": "$modules",
                "preserveNullAndEmptyArrays": true
            }
        });

        filter.push({
            "$lookup": {
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

    var promise = new Promise((resolve, reject) => {            
        var query = affiliateModules.aggregate(filter);
        var activeModules = [];
        query
        .exec((err, records) => {
            if (!err || records) {
                var modules = [];

                for(var i=0; i < records.length; i++) {
                    var record = records[i];
                    if(record) {
                        var module = record;
                        
                        module.organization = record.organization;
                        module.department = record.department;
                        module.modules = record.modules;
                        module.affiliate = record.affiliate;
                        
                        if(data.affiliateId) {
                            module.affiliate = record.affiliate;
                        }
                        module.affiliateReferenceId = record._id;
                        module.affiliateReferenceIsActive = record.isActive;                       
						modules.push(module);
                        
                    }
                }
                resolve(modules.length);
            } else {
                resolve(0);
            }
        });

    }).then(function(response){        
        return new Promise((resolve, reject) => {
            var response1;
            var query = affiliateModules.aggregate(filter);
            var activeModules = [];
            query
            .skip(parseInt(data.skip))
            .limit(parseInt(data.limit))
            //  Start- Shubhangi, 05-02-2020, SCI-I749
            .sort({updatedAt: -1})    
            //  End- Shubhangi, 06-02-2020, SCI-I749  
            .exec((err, records) => {
                if (!err || records) {
                    var modules = [];
                    for(var i=0; i < records.length; i++) {
                        var record = records[i];
                        if(record) {
                            var module = record;
                            
                            module.organization = record.organization;
                            module.department = record.department;
                            module.modules = record.modules;
                            module.affiliate = record.affiliate;
                            
                            if(data.affiliateId) {
                                module.affiliate = record.affiliate;
                            }
                            module.affiliateReferenceId = record._id;
                            module.affiliateReferenceIsActive = record.isActive;
                            modules.push(module);
                        }
                    }                  
                    response1 = { isError: false, modules: modules, errors: [], totalCount:response };                       
                    resolve(response1);
                } else {
                    response1 = { isError: true, modules: [], errors: [{msg: "No Modules found!"}],totalCount:0 };
                    resolve(response1);
                }
            });
    
        setTimeout(() => resolve(response1), 1000);
        });      
      });
    return promise;
};


var findById = (id) => {
    var promise = new Promise((resolve, reject) => {
        var data = {
            _id: id
        };
        schema.findOne(data, (err, module) => {
            if(!err && (module && module._id) ){
                var response = {isError: false, module: module, errors: []};
                resolve(response);
            } else {
                var response = {isError: true, module: {}, errors: [{msg: "Invalid Module ID"}]};
                resolve(response);
            }
        });
    });

    return promise;
}

var update = (id, module) => {
    var promise = new Promise((resolve, reject) => {
		schema.findOneAndUpdate({ '_id': id }, { $set : module }, { new : true }, (error, result) =>{
			if(error) {
				var response = { isError: true, module: {}, errors: [{"msg": "Failed to update module!"}] };
            	resolve(response);
			} else {
				var response = { isError: false, module: result, errors: [] };
            	resolve(response);
			}
		})
	});
	return promise;
}

var linkAffiliate = (module, affiliateId) => {
    var saveModule = (link) => {

        var promise = new Promise((resolve, reject) => {
            var document = new affiliateModules(link);
            document.save().then((result) => {
                resolve(result);  
            });
        });

        return promise;
    };

    var promise = new Promise((resolve, reject) => {
        
        var promises = [];

        var data = {
            moduleId : module._id,
            organizationId: module.organizationId,
            departmentId: module.departmentId,
            affiliateId: affiliateId
        };
        promises.push(saveModule(data));

        Promise.all(promises).then((result) => {
            if(result.length !=0) {
                var response = { isError: false, errors: [], module: module };
                resolve(response);
            }
        }).catch((error) => {
            var response = { isError: true, errors: error, module: [] };
            resolve(response);
        });
    });
    return promise; 
}

var linkAffiliates = (modules,affiliateId) => {

    var saveModule = (link) => {

        var promise = new Promise((resolve, reject) => {
            var document = new affiliateModules(link);
            document.save().then((result) => {
                resolve(result);
               
            });
        });

        return promise;
    };

    var promise = new Promise((resolve, reject) => {

        var promises = [];
        for(var i=0; i < modules.length; i++) {
            var module = modules[i];

            var data = {
                moduleId : module._id,
                organizationId: module.organizationId,
                departmentId: module.departmentId,
                affiliateId: affiliateId
            };
            promises.push(saveModule(data));
        }

        Promise.all(promises).then((results) => {
            if(results.length == modules.length) {
                var response = { isError: false, modules: modules };
                resolve(response);
            }
        }).catch((error) => {
            var response = { isError: true, modules: [] };
            resolve(response);
        });
    });
    return promise;
}

var affiliateModuleUpdate = (id, module) => {
    var promise = new Promise((resolve, reject) => {
		affiliateModules.findOneAndUpdate({ '_id': id }, { $set : module }, { new : true }, (error, result) =>{
			if(error) {
				var response = { isError: false, module: {}, errors: [{"msg": "Failed to update module status!"}] };
            	resolve(response);
			} else {
				var response = { isError: false, module: result, errors: [] };
            	resolve(response);
			}
		})
	});
	return promise;
}

var findByCode = (obj) => {
    var promise = new Promise((resolve, reject) => {
        var data = {
            organizationId: obj.organizationId,
            code: obj.code
        };

        schema.find(data, (err, result) => {
			if(!err && result && result.length) {
				var response = { isError: false, errors: [{msg: "Module ID already available!"}], modules: result};
            	resolve(response);
			} else {
				var response = { isError: false, errors: [{msg: "Module code not available"}], modules: [] };
            	resolve(response);
			}
		});
    });
    return promise; 
}

var findAffliateModule = (id, affiliateId) => {

    var promise = new Promise((resolve, reject) => {
        var data = {
            moduleId: id,
            affiliateId: affiliateId
        };

        affiliateModules.findOne(data, (err, affiliatemodule) => {
            if(!err && (affiliatemodule && affiliatemodule.moduleId && affiliatemodule.affiliateId) ){
                var response = {isError: true, affiliatemodule: {}, errors: [{msg: "Module is Already Added"}]};
                resolve(response);
            } else {
                var response = {isError: false, errors: []};
                resolve(response);
            }
        });
    });

    return promise;
}

var findModule = (moduleName) => {
    var promise = new Promise((resolve, reject) => {
        schema.findOne({
            name: moduleName
        }, (err, cousre) => {
            if(!err && (cousre && cousre._id) ){
                var response = {isError: false, cousre: cousre, errors: []};
                resolve(response);
            } else {
                var response = {isError: true, cousre: {}, errors: [{msg: "Invalid cousre ID"}]};
                resolve(response);
            }            
        })
    });

    return promise;
}

var getModuleByCode = (data) => {
    var promise = new Promise((resolve, reject) => {
        schema.findOne({
            code: data.moduleId,
            organizationId: data.organizationId
        }, (err, module) => {
            if(!err && (module && module._id) ){
                var response = {isError: false, module: module, errors: []};
                resolve(response);
            } else {
                var response = {isError: true, module: {}, errors: [{msg: "Invalid module ID"}]};
                resolve(response);
            }
        });
    });

    return promise;
}

module.exports = {
    create,
    findById,
    list,
    update,
    linkAffiliates,
    linkAffiliate,
    getAffiliateModules,
    affiliateModuleUpdate,
    findByCode,
    findAffliateModule,
    findModule,
    listNew,
    getAffiliateModulesNew,
//============= Start Neha Mutke (SNA-I9) 10/06/2021 ============= 
    moduleList,
    getModuleByCode
//============= End Neha Mutke (SNA-I9) 10/06/2021 =============
}