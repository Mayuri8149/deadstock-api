var create = (req) => {
    try { 
        req.checkBody("organizationId", "Organization ID is required!").notEmpty();
        req.checkBody("departmentId", "Branch ID is required!").notEmpty();
        req.checkBody("name", "Module Name is required!").notEmpty().trim().escape();
        req.checkBody("code", "Module ID is required!").notEmpty();
        
        var type = req.body.type;
        var termType = req.body.termType;

        var errors = req.validationErrors();
    } catch (error) {
        var errors = [{ msg: "Something went wrong!" }];
    }

    return errors;
};

var update = (req) => {
    try {
        req.checkBody("organizationId", "Organization ID is required!").notEmpty();
        req.checkBody("departmentId", "Branch ID is required!").notEmpty();
        req.checkBody("name", "Module Name is required!").notEmpty().trim().escape();
        req.checkBody("code", "Module ID is required!").notEmpty();
        
        var type = req.body.type;
        var termType = req.body.termType;

        var errors = req.validationErrors();
    } catch (error) {
        var errors = [{ msg: "Something went wrong!" }];
    }

    return errors;
};

module.exports = {
    create,
    update
}
