
var create = req => {
    try {
        req.checkBody("name", "Branch name cannot be blank").notEmpty().trim().escape();
        req.checkBody("organizationId", "organizationId cannot be blank").notEmpty();
        req.checkBody("code", "Branch ID cannot be blank").notEmpty();
        var errors = req.validationErrors();
    } catch (e) {
        var errors = [{ msg: "Something went wrong!" }];
    }

    return errors;
};

var list = req => {
    try {
        req.checkQuery("organizationId", "organizationId cannot be blank").notEmpty();
        var errors = req.validationErrors();

    } catch (e) {
        var errors = [{ msg: "Something went wrong!" }];
    }

    return errors;
};

module.exports = {
    create,
    list
}