var express = require('express');
var router = express.Router();
var schema = require('./schema');
var model = require('./model');
var batchModel = require('../batch/model');
var validator = require('./validator');

// On Error
var onError = (req, res, errors, statusCode) => {
    if (!(Array.isArray(errors) && errors.length)) {
        errors = [{
            "msg": "Something went wrong!"
        }];
    }
    req.app.responseHelper.send(res, false, {}, errors, statusCode);
};

router.post("/create", (req, res) => {
    var errors = validator.create(req);

    if (errors && errors.length) {
        onError(req, res, errors, 400);
        return false;
    }

    var module = {
        organizationId: req.body.organizationId,
        departmentId: req.body.departmentId,
        type: req.body.type,
        code: req.body.code,
        name: req.body.name,
        specialization: req.body.specialization,
        transactionGenerate: req.body.transactionGenerate,
        transactionPrint: req.body.transactionPrint,
        gpaCalculated: req.body.gpaCalculated,
        subjectCredits: req.body.subjectCredits,
        duration: req.body.duration,
        durationUnit: req.body.durationUnit,
        termType: req.body.termType,
        noOfTerms: req.body.noOfTerms,
        //  Start- Shubhangi, 05-02-2020, SCI-I749
		createdBy : req.body.createdBy,
		updatedBy : req.body.updatedBy
		 //  End- End, 05-02-2020, SCI-I749  
    };

    var findObj = {
        organizationId: module.organizationId,
        departmentId: module.departmentId,
        code: module.code
    }

    var checkDuplicate = (findObj) => {
        model.findByCode(findObj).then((result) => {
            if(result.isError || (result.modules && result.modules.length)) {
                onError(req, res, result.errors, 500);
            } else {
                addModule(module);
            }
        })
    };

    var addModule = (module) => {
        model.create(module).then((result) => {
            if(result.isError || !(result.module && result.module._id) ) {
                onError(req, res, [], 500);
            } else {
                req.app.responseHelper.send(res, true, result.module, [], 200);
            }
        });
    };

    checkDuplicate(findObj);
});

//============= Start Neha Mutke (SNA-I9) 10/06/2021 =============
router.get('/moduleList', (req, res) => {
    model.moduleList().then((result) => {
        if (!result.isError) {
            req.app.responseHelper.send(res, true, result.modules, [], 200);
        } else {
            onError(req, res, [], 500);
        }
    })
});
//============= End Neha Mutke (SNA-I9) 10/06/2021 =============

router.get("/list", (req, res) => {
    var organizationId = req.query.organizationId;
    var departmentId = req.query.departmentId;
    var isActive = req.query.isActive;

    //  Start- Mahalaxmi, 19-12-2020, SCI-I579
    const pageSize = +parseInt(req.query.pagesize);
    const currentPage = +parseInt(req.query.page);
    var skip = pageSize === undefined ? 0 : (pageSize * (currentPage - 1));
	var limit = pageSize === undefined ? 0 : pageSize;
    if(pageSize && currentPage) {
        var obj = {
			skip: skip,
            limit: limit,
            organizationId: organizationId
		};	
    }else{
        var obj = {
            organizationId: organizationId
        };
    }
    
    if(departmentId) {
        obj.departmentId = departmentId;
    }
    if(isActive){
        obj.isActive = true;
    }

    model.listNew(obj).then((result) => {
        if(result.isError || !(result.modules)) {
			onError(req, res, [], 500);
		} else {
			req.app.responseHelper.send(res, true, {result}, [], 200);
		}
    });
});

router.get("/affiliateModules", (req, res) => {
    //  Start- Mahalaxmi, 19-12-2020, SCI-I579
    const pageSize = +parseInt(req.query.pagesize);
    const currentPage = +parseInt(req.query.page);
    var skip = pageSize === undefined ? 0 : (pageSize * (currentPage - 1));
	var limit = pageSize === undefined ? 0 : pageSize;
    if(pageSize && currentPage) {
        var data = {
            organizationId: req.query.organizationId,
            departmentId: req.query.departmentId,
            affiliateId: req.query.affiliateId,
            skip: skip,
			limit: limit,
        };	
    }else{
        var data = {
            organizationId: req.query.organizationId,
            departmentId: req.query.departmentId,
            affiliateId: req.query.affiliateId
        };    
    } 
    if(req.query.mymodule) {
        data.mymodule = req.query.mymodule;
        data.isActive = true;
    }
    model.getAffiliateModulesNew(data).then((result) => {
        if(result.isError || !(result.modules)) {
			onError(req, res, [], 500);
		} else {
			req.app.responseHelper.send(res, true, {result}, [], 200);
		}
    });
});

router.get("/:id", (req, res) => {

    var id = req.params.id;

    model.findById(id).then((result) => {
        if (result.isError) {
            var errors = result.errors;
			onError(req, res, errors, 500);
        } else {
            var module = result.module;
            req.app.responseHelper.send(res, true, module, [], 200);
        }
    });
});

router.put("/:id", (req, res) => {

    var errors = validator.update(req);

    if (errors && errors.length) {
        onError(req, res, errors, 400);
        return false;
    }

    var id = req.params.id;
    var module = {};
    module.name = req.body.name;
    module.specialization = req.body.specialization;
    module.transactionGenerate = req.body.transactionGenerate;
    module.transactionPrint = req.body.transactionPrint;
    module.gpaCalculated = req.body.gpaCalculated;
    module.subjectCredits = req.body.subjectCredits;
    module.duration = req.body.duration;
    module.durationUnit = req.body.durationUnit;
    module.termType = req.body.termType;
    module.noOfTerms = req.body.noOfTerms;
    module.type = req.body.type;
    //  Start- Shubhangi, 05-02-2020, SCI-I749
    module.updatedBy = req.body.updatedBy;
    //  End- Shubhangi, 06-02-2020, SCI-I749

    model.update(id, module).then((result) => {
        if (result.isError && result.module) {
            onError(req, res, result.errors, 500);
        } else {
            var module = result.module;
            req.app.responseHelper.send(res, true, module, [], 200);
        }
    });
});

router.put("/:id/changeStatus", (req, res) => {
    var id = req.params.id;

    model.findById(id).then((result) => {
        if (result.isError) {
            var errors = result.errors;
			onError(req, res, errors, 500);
        } else {
            var module = result.module;
            module.isActive = req.body.isActive;
            model.update(id, module).then((result) => {
                if (result.isError) {
                    onError(req, res, result.errors, 500);
                } else {
                    /*  Start- Name -Shubhangi, Date Of Code - 12-04-2021 zoho Task Number -SCI-I852*/
                    let batch = {
                        isDeleted:module.isActive
                    }
                    batchModel.findModule(id,batch).then((module) => {
                        if (module.isError) {
                            onError(req, res, module.errors, 500);
                        } else {
                            var module = result.module;
                            req.app.responseHelper.send(res, true, module, [], 200);
                        }
                    });
                    /*  End- Name -Shubhangi, Date Of Code - 12-04-2021 zoho Task Number -SCI-I852*/
                }
            });
        }
    });
});

router.post("/link/affiliates", (req, res) => {
    var modules = req.body.modules;
    var affiliateId = req.body.affiliateId;
    var organizationId = req.user.reference.organizationId;
    var departmentId = req.user.reference.departmentId;


    var linkToAffliate = (moduleArray) => {
        model.linkAffiliates(moduleArray, affiliateId).then((result) => {
            if(result.isError) {
                onError(req, res, [], 500);
            } else {
                req.app.responseHelper.send(res, true, result.modules, [], 200);
            }
        });
    };

    var filterModules = (linkedModules) => {
        
        if(!linkedModules.length) {
            return modules;
        }

        var newModules = [];
        var linkedModuleIds = [];

        for(var i=0; i < linkedModules.length; i++) {
            linkedModuleIds.push(linkedModules[i]._id);
        }

        for(var i=0; i < modules.length; i++) {
            if(linkedModuleIds.indexOf(modules[i]._id) == -1) {
                newModules.push(modules[i]);
            }
        }

        return newModules;
    };

    var getAffiliateModules = () => {
        var data = {
            organizationId: organizationId,
            departmentId: departmentId,
            affiliateId: affiliateId
        };
    
        model.getAffiliateModules(data).then((result) => {
            if(result.isError || !(result.modules)) {
                onError(req, res, [], 500);
            } else {
                
                var moduleArray = filterModules(result.modules);
                if(moduleArray.length) {
                    linkToAffliate(moduleArray);
                } else {
                    req.app.responseHelper.send(res, true, [], [], 200);
                }
                
            }
        });
    };

    getAffiliateModules();
});

router.post("/link/affiliatemodule", (req, res) => {
    var module = req.body.module;
    var affiliateId = req.body.affiliateId;

    var linkToAffliate = (module) => {
        model.linkAffiliate(module, affiliateId).then((result) => {
              if(result.isError) {
                onError(req, res, [], 500);
            } else {
                req.app.responseHelper.send(res, true, result.module, [], 200);
            }
        });
    };

    var checkAffiliateModule = () => {
       var id = module._id;
        model.findAffliateModule(id, affiliateId).then((result) => {
            if(result.isError || (result.affiliatemodule)) {
                onError(req, res, result.errors, 500);
            } 
            else {
                linkToAffliate(module);
            }
        });
    };

    checkAffiliateModule();
});

module.exports = router;