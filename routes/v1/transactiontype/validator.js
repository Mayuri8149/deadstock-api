var create = (req) => {
    try {
        req.checkBody("organizationId", "Organization ID is required!").notEmpty();
        req.checkBody("departmentId", "Branch ID is required!").notEmpty();
        req.checkBody("moduleId", "Module is required!").notEmpty();
        req.checkBody("transactionTypeName", "Transaction Name is required!").notEmpty().trim().escape();
        var fields = req.body.fields;
    }
    catch (error) {
        var errors = [{ msg: "Something went wrong!" }];
    }

    return errors;
};


var update = (req) => {
    try {

        req.checkBody("credImg", "Transaction Image is required!").notEmpty();

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