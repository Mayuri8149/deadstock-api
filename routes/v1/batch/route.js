var express = require('express');
var router = express.Router();
var schema = require('./schema');
var model = require('./model');
// var partnerModel = require('../partner/model');
var moduleModel = require('../module/model');
var organizationModel = require('../organization/model');
// var affiliateModel = require('../affiliate/model');
var departmentModel = require('../department/model');
//  Start- Mahalaxmi Nakade, 17-02-2021, SCI-I783
var transTypeModel = require('../transactiontype/model');
//  End- Mahalaxmi Nakade, 17-02-2021, SCI-I783

var validator = require('./validator');
var moment = require('moment');
// On Error
var onError = (req, res, errors, statusCode) => {
    if (!(Array.isArray(errors) && errors.length)) {
        errors = [{
            "msg": "Something went wrong!"
        }];
    }
    req.app.responseHelper.send(res, false, {}, errors, statusCode);
};

router.post('/create', (req, res) => {
	var module;
	var moduleId = req.body.moduleId;
	
	var bodystartdate = new Date (req.body.start);
	var startyear = bodystartdate.getFullYear();
	var startmonth = bodystartdate.getMonth()+1;
	var startdt = bodystartdate.getDate();
	var startDate = moment.utc(startyear+'-' + startmonth + '-'+startdt)

	var bodyenddate = new Date (req.body.end);
	var endyear = bodyenddate.getFullYear();
	var endmonth = bodyenddate.getMonth()+1;
	var enddt = bodyenddate.getDate();
	var endDate = moment.utc(endyear+'-' + endmonth + '-'+enddt)

	var batch = {
		organizationId: req.body.organizationId,
		departmentId: req.body.departmentId,
		affiliateId: req.body.affiliateId,
		moduleId: req.body.moduleId,
		code: req.body.code,
		year: req.body.year,
		type: req.body.type,
		start: startDate,
		end: endDate,
		minCredits: req.body.minCredits,
		minCgpa: req.body.minCgpa,
		totalCgpa: req.body.totalCgpa,
		minScore: req.body.minScore,
		totalScore: req.body.totalScore,
		//  Start- Shubhangi, 05-02-2020, SCI-I749
		createdBy : req.body.createdBy,
		updatedBy : req.body.updatedBy
		 //  End- End, 05-02-2020, SCI-I749  
	};
	
	var findObj = {
		organizationId: req.body.organizationId,
		departmentId: req.body.departmentId,
		moduleId: req.body.moduleId,
		affiliateId: req.body.affiliateId,
		code: req.body.code
	}

	if(req.query.affiliateId) {
		findObj.affiliateId = req.query.affiliateId
	}
	
	var checkDuplicate = (findObj, moduleName) => {
		model.findByCode(findObj).then((result) => {
			if(result.isError || (result.batches && result.batches.length)) {
                onError(req, res, result.errors, 500);
            } else {
                getIds(batch, moduleName);
            }
        });
	};

	var getIds = (batch, moduleName) => {
		batch.moduleid = moduleName
		organizationModel.findById(batch.organizationId).then((instResult) => {
			if(!instResult.isError) {
				batch.organizationid = instResult.organization.code;
				if(batch.affiliateId) {

					departmentModel.findById(batch.departmentId).then((deptResult) => {
						if (!deptResult.isError) {
							batch.departmentid = deptResult.department.code;
							addBatch(batch);
						}
					})

					
					// affiliateModel.findById(batch.affiliateId).then((affResult) => {
					// 	if (!affResult.isError) {
					// 		batch.affiliateid = affResult.affiliate.code
					// 		departmentModel.findById(batch.departmentId).then((deptResult) => {
					// 			if (!deptResult.isError) {
					// 				batch.departmentid = deptResult.department.code;
					// 				addBatch(batch);
					// 			}
					// 		})
					// 	}
					// })
				}else {
					departmentModel.findById(batch.departmentId).then((deptResult) => {
						if (!deptResult.isError) {
							batch.departmentid = deptResult.department.code;
							addBatch(batch);
						}
					})
				}
			}
		});
	};

	var addBatch = () => {
		model.create(batch).then((result) => {
			if(result.isError  || !(result.batch && result.batch._id)) {
				onError(req, res, result.errors, 500);
			} else {
				var batch = result.batch;
				req.app.responseHelper.send(res, true, batch, [], 200);
			}
		})
    };

	getModule = (moduleId) => {
		moduleModel.findById(moduleId).then((result) => {
			if (result.isError) {
				var errors = result.errors;
				onError(req, res, errors, 500);
			} else {
				module = result.module;
				var errors = validator.batch(req, module);
				
				if (errors && errors.length) {
					onError(req, res, errors, 400);
					return false;
				} else {
					checkDuplicate(findObj, module.code);
				}
			}
		})
	};

	getModule(moduleId);

});

router.put('/:id', (req, res) => {
	var errors = validator.batch(req);

	if(errors && errors.length) {
		onError(req, res, errors, 400);
		return false;
	}

	var id = req.params.id;

	var batch = {
		organizationId: req.body.organizationId,
		departmentId: req.body.departmentId,
		affiliateId: req.body.affiliateId,
		moduleId: req.body.moduleId,
		code: req.body.code,
		year: req.body.year,
		type: req.body.type,
		start: req.body.start,
		end: req.body.end,
		minCredits: req.body.minCredits,
		minCgpa: req.body.minCgpa,
		totalCgpa: req.body.totalCgpa,
		minScore: req.body.minScore,
		totalScore: req.body.totalScore
	};

	var findObj = {
		affiliateId: req.body.affiliateId,
		batchId: req.params.id
	}

	var update = () => {
		model.update(id, batch).then((result) => {
			if(result.isError  || !(result.batch && result.batch._id)) {
				onError(req, res, result.errors, 500);
			} else {
				var batch = result.batch;
				req.app.responseHelper.send(res, true, batch, [], 200);
			}
		});
	}

	var checkReviewedPartner = (findObj) => {
		update();
	// 	partnerModel.findByStatus(findObj).then((result) => {
	// 		if(result.isError || (result.partners && result.partners.length)) {
	// 			onError(req, res, [{msg: "Partners reviewed, You can't update batch now!"}], 500);
	// 		} else {
    //             update();
    //         }
	// 	});
	}

	checkReviewedPartner(findObj);
	
});

router.delete("/delete", (req, res) => {
	var batchIds = req.body.batchIds;
	model.deleteMany(batchIds).then((result) => {
		if(result.isError) {
			onError(req, res, result.errors, 500);
		} else {
			var batches = result.batches;
			req.app.responseHelper.send(res, true, batches, [], 200);
		}
	});
});

router.get('/list', (req, res) => {
	 //  Start- Mahalaxmi, 21-12-2020, SCI-I579
    const pageSize = +parseInt(req.query.pagesize);
    const currentPage = +parseInt(req.query.page);
    var skip = pageSize === undefined ? 0 : (pageSize * (currentPage - 1));
	var limit = pageSize === undefined ? 0 : pageSize;
    if(pageSize && currentPage) {
        var obj = {
			departmentId: req.query.departmentId,
			skip: skip,
			limit: limit,
	    };	
    }else{
        var obj = {};	
	}
		
	//Start- Mahalaxmi, 08-01-2021, SCI-I579
	if(req.query.organizationId) {
		obj.organizationId = req.query.organizationId
	}
	//End- Mahalaxmi, 08-01-2021, SCI-I579
	if(req.query.tabIndex) {
		obj.tabIndex = req.query.tabIndex
	}
	if(req.query.flag) {
		obj.flag = req.query.flag;
	}
	//  Start- Mahalaxmi Nakade, 03-02-2021, SCI-I756
	if(req.user.reference.entity == 'organization' || req.query.moduleId!=='undefined') {
	//  End- Mahalaxmi Nakade, 03-02-2021, SCI-I756
		obj.moduleId = req.query.moduleId
	}	
	//  Start- Mahalaxmi Nakade, 17-02-2021, SCI-I783
	if(req.query.transTypeId!=='undefined') {
		transTypeModel.findById(req.query).then((credResult) => {
			if(credResult.isError && !(credResult.transType)) {
				onError(req, res, credResult.errors, 500);
			} else {				
				model.listNew(obj).then((result) => {		
					if(result.isError && !(result.batches)) {
						onError(req, res, result.errors, 500);
					} else {
						result.pdffield=credResult.transType.pdffield;
						//start-Mahalaxmi,24-03-2021,SCI-I818
						result.viewPDF=credResult.transType.viewPDF;
						//End-Mahalaxmi,24-03-2021,SCI-I818
						req.app.responseHelper.send(res, true, {result}, [], 200);
					}
				});
			}
		});
	}else{	
	//  End- Mahalaxmi Nakade, 17-02-2021, SCI-I783		
		model.listNew(obj).then((result) => {		
			if(result.isError && !(result.batches)) {
				onError(req, res, result.errors, 500);
			} else {
				req.app.responseHelper.send(res, true, {result}, [], 200);
			}
		});
	//  Start- Mahalaxmi Nakade, 17-02-2021, SCI-I783		
	}
	//  End- Mahalaxmi Nakade, 17-02-2021, SCI-I783		
});


router.get('/:id', (req, res) => {

	var id = req.params.id;

	model.findById(id).then((result) => {
        if(result.isError) {
			onError(req, res, result.errors, 500);
		} else {
			var batch = result.batch;
			req.app.responseHelper.send(res, true, batch, [], 200);
		}
    })
});

//============================ Start - Shubhangi (SNA-I5) - 13-05-2021 ============================ 
router.get('/module/moduleId', (req, res) => {
	var id = req.query.moduleId;
	model.findModule(id,true).then((result) => {
        if(result.isError) {
			onError(req, res, result.errors, 500);
		} else {
			var module = result.module[0];
			req.app.responseHelper.send(res, true, module, [], 200);
		}
    })
});
//============================ Start - Shubhangi (SNA-I5) - 21-05-2021 ============================ 


router.put("/:id/changeStatus", (req, res) => {
	var id = req.params.id;
	
	var batch = {
		isDeleted: req.body.isDeleted
	}
	
	model.update(id, batch).then((result) => {
		if(result.isError  || !(result.batch && result.batch._id)) {
			onError(req, res, result.errors, 500);
		} else {
			var batch = result.batch;
			req.app.responseHelper.send(res, true, batch, [], 200);
		}
	});
});

module.exports = router;
