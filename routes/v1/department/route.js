var express = require('express');
var router = express.Router();
var model = require('./model');
var validator = require('./validator');
var schema = require('./schema');
var mongoose = require('mongoose');
var userSchema = require('../user/schema')
var userRefSchema = require('../user/userRefSchema')
var onError = (req, res, errors, statusCode) => {
    if (!(Array.isArray(errors) && errors.length)) {
        errors = [{
            "msg": "Something went wrong!"
        }];
    }
    req.app.responseHelper.send(res, false, {}, errors, statusCode);
};

// List department
router.get("/list", (req, res) => {
    var errors = validator.list(req);
    var isActive = req.query.isActive;
    var _id = req.query._id;
    var filters = req.query;

    if (errors && errors.length) {
        onError(req, res, errors, 400);
        return true;
    }


    const pageSize = +parseInt(req.query.pagesize);
    const currentPage = +parseInt(req.query.page);
    var skip = pageSize === undefined ? 0 : (pageSize * (currentPage - 1));
    var limit = pageSize === undefined ? 0 : pageSize;
    if (pageSize && currentPage) {
        if (_id == '111111111111111111111111') {
            var data = {
                organizationId: req.query.organizationId,
                skip: skip,
                limit: limit
            };
        } else {
            var data = {
                organizationId: req.query.organizationId,
                _id: req.query._id,
                skip: skip,
                limit: limit
            };
        }
    } else {
        if (_id == '111111111111111111111111') {
            var data = {
                organizationId: req.query.organizationId,
            };
        } else {
            var data = {
                organizationId: req.query.organizationId,
                _id: req.query._id
            };
        }
    }
    if (isActive) {
        data.isActive = true;
    }
    model.listNew(data,filters).then((result) => {
        if (result.isError) {
            onError(req, res, result.errors, 500);
        } else {
            req.app.responseHelper.send(res, true, { result }, [], 200);
        }
    })

});

// ---------------------Start Rohini Kamble (SCI-I797) 22/03/2021
//create department
router.post("/create", (req, res) => {

    var errors = validator.create(req);

    if (errors && errors.length) {
        onError(req, res, errors, 400);
        return true;
    }
    if (typeof req.body.isActive === 'undefined') {
        req.body.isActive = 'null'
    }

    var department = {
        organizationId: req.body.organizationId,
        name: req.body.name,
        code: req.body.code,
        // Start - Priyanka Patil (SNA-I12) 19-05-2021
        branch_location: req.body.branch_location,
        branch_address: req.body.branch_address,
        locationCoordinates: req.body.locationCoordinates,
        // End - Priyanka Patil (SNA-I12) 19-05-2021
        // Start- Shubhangi, 05-02-2020, SCI-I749
        createdBy: req.body.createdBy,
        updatedBy: req.body.updatedBy,
        // End- End, 05-02-2020, SCI-I749 

        //isActive: 'false'
    };

    console.log('department 105',department)
    var filter = {
        isActive: req.body.isActive,
    }

    var findObj = {
        organizationId: department.organizationId,
        code: department.code,
        name: department.name
    };
    var checkDuplicate = (findObj) => {
        model.findByCode(findObj).then((result) => {
            if (result.isError || (result.departments && result.departments.length)) {
                if (filter.isActive == 'true') {
                    result.departments[0].isActive = 'true'
                    model.updateDepartment(department.organizationId, result.departments[0]).then((result) => {
                        if (result.isError || !(result.department && result.department._id)) {
                            onError(req, res, result.errors, 500);
                        } else {
                            var department = result.department;
                            req.app.responseHelper.send(res, true, department, [], 200);
                        }
                    });
                } else if (filter.isActive == 'false') {
                    result.departments[0].isActive = 'false'
                    model.updateDepartment(department.organizationId, result.departments[0]).then((result) => {
                        if (result.isError || !(result.department && result.department._id)) {
                            onError(req, res, result.errors, 500);
                        } else {
                            var department = result.department;
                            req.app.responseHelper.send(res, true, department, [], 200);
                        }
                    });
                }
                else {
                    onError(req, res, result.errors, 500);
                }
                //onError(req, res, result.errors, 500);
            } else {
                addDepartment();
            }
        });
    };

    var addDepartment = () => {
        model.create(department).then((result) => {
            if (result.isError || !(result.department && result.department._id)) {
                onError(req, res, [], 500);
            } else {
                req.app.responseHelper.send(res, true, result.department, [], 200);
            }
        });
    };

    checkDuplicate(findObj);

});
// ----------------------End Rohini Kamble (SCI-I797) 22/03/2021
// Get department
router.get("/:id", (req, res) => {
    var id = req.params.id;

    model.findById(id).then((result) => {
        if (result.isError) {
            onError(req, res, result.errors, 500);
        } else {
            var department = result.department;
            req.app.responseHelper.send(res, true, department, [], 200);
        }
    })
});

// Start - Priyanka Patil (SNA-17) 18-05-2021
router.get("/organization/:id", (req, res) => {
    var id = req.params.id;
    model.findByOrganization(id).then((result) => {
        if (result.isError) {
            onError(req, res, result.errors, 500);
        } else {
            var department = result.department;
            req.app.responseHelper.send(res, true, department, [], 200);
        }
    })
});
// End - Priyanka Patil (SNA-17) 18-05-2021

// Update deparment
router.put("/:id", (req, res) => {

    var errors = validator.create(req);

    if (errors && errors.length) {
        onError(req, res, errors, 400);
        return false;
    }

    var id = req.params.id;

    model.findById(id).then((data) => {
        if (data.isError) {
            onError(req, res, data.errors, 500);
        } else {
            var department = data.department;
            department.name = req.body.name;
            department.code = req.body.code;

            model.update(department).then((result) => {
                if (result.isError) {
                    onError(req, res, result.errors, 500);
                } else {
                    var department = result.department;
                    req.app.responseHelper.send(res, true, department, [], 200);
                }
            });
        }
    })
});

// Active/Inactive department
// ============================ Start - Shubhangi (SCI-I852) - 12-04-2021 ============================

router.put('/:id/changeStatus', async (req, res) => {
    var id = req.params.id;
    departmentDetails = await schema.findOne({ _id: mongoose.Types.ObjectId(id) })
    departmentDetails.isActive = req.body.isActive;
    await departmentDetails.save()
    let validate = 0
    userRefDetails = await userRefSchema.find({ departmentId: mongoose.Types.ObjectId(id)})
    for(let i = 0;i<userRefDetails.length;i++){
        validate++
        userDetails = await userSchema.findOne({_id: mongoose.Types.ObjectId(userRefDetails[i].userId)})
        userDetails.isActive =  req.body.isActive;
        await userDetails.save()
    }
    if(validate == userRefDetails.length){
        req.app.responseHelper.send(res, true, departmentDetails, [], 200);
    }
})

// ============================ End - Shubhangi (SCI-I852) - 13-04-2021 ============================


router.post('/edit',  (req, res) => {
    var id = req.body.id;
    var department = {};
    
    department.branch_location = req.body.location;
    department.branch_address = req.body.address;
     
     model.updateDepartment(id, department).then((result) => {
        if(result.isError  || !(result.department && result.department._id)) {
            onError(req, res, result.errors, 500);
        } else {
            var department = result.department;
            req.app.responseHelper.send(res, true, department, [], 200);
        }
    });
});

module.exports = router;