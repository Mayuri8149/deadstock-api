var create = (req) => {
    try {
        req.checkBody("organizationId", "Organization ID is required!").notEmpty();
        req.checkBody("departmentId", "Branch ID is required!").notEmpty();
        req.checkBody("moduleId", "Module is required!").notEmpty();
        // ------------Start Rohini Kamble (SCI-I816) 06/03/2021-------------------
        req.checkBody("TransactionTypeCode", "TransactionTypeCode is required!").notEmpty();
        // ------------End Rohini Kamble (SCI-I816) 06/03/2021-------------------
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