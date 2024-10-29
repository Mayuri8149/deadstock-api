

var signin = (req) => {
    try {
        // Start - Priyanka Patil 11-01-2021 (SCI-I642)
        req.checkBody('email', 'Email and Password is required').notEmpty();
        req.checkBody('email', 'Email is invalid.').isEmail();
        // End - Priyanka Patil 11-01-2021 (SCI-I642)
        var errors = req.validationErrors();
    } catch(e) {
        var errors = [{msg: "Something went wrong!"}];
    } 
    return errors;
};

var forgotPassword = (req) => {
    try {
// -------------Start Rohini kamble (SCI-I642) 23/12/2020--------------
// -------------Start Priyanka Patil (SCI-I642) 11/01/2021--------------
        req.checkBody('email', 'Email is required.').notEmpty();
// -------------Start Rohini kamble (SCI-I642) 5/1/2021--------------
        // req.checkBody('password', 'Password is required.').notEmpty();
// -------------End Priyanka Patil (SCI-I642) 11/01/2021--------------
// -------------End Rohini kamble (SCI-I642) 5/1/2021--------------
// -------------End Rohini kamble (SCI-I642) 23/12/2020--------------
        req.checkBody('email', 'Email is invalid.').isEmail();
        
        var errors = req.validationErrors();

    } catch(e) {
        var errors = [{msg: "Something went wrong!"}];
    } 
    return errors;
};

var resetPassword = (req) => {
    try {
        req.checkBody('password', 'Password is required.').notEmpty();
        req.checkBody('password', 'Password length should be minimum 4 characters.').isLength({ min: 4 });
        //---Start Rohini Kamble (SCI-I900) 26/04/2021
        req.checkBody('confirmPassword', "Password and Confirm Password should be equal").custom( password => {
        //---End Rohini Kamble (SCI-I900) 26/04/2021
            if(req.body.confirmPassword && (password  === req.body.confirmPassword)) {
                return true;
            }
            return false;
        });
        req.checkBody('code', 'OTP code is required.').notEmpty();
        
        var errors = req.validationErrors();

    } catch(e) {
        var errors = [{msg: "Something went wrong!"}];
    } 
    return errors;
};

var changePassword = (req) => {
    try {
        req.checkBody('newpassword', 'Password is required.').notEmpty();
        req.checkBody('newpassword', 'Password length should be minimum 4 characters.').isLength({ min: 4 });
        //---Start Rohini Kamble (SCI-I900) 26/04/2021
        req.checkBody('confirmPassword', "Password and Confirm Password should be equal").custom( password => {
        //---End Rohini Kamble (SCI-I900) 26/04/2021
            if(req.body.confirmPassword && (req.body.newpassword  === req.body.confirmPassword)) {
                return true;
            }
            return false;
        });
        var errors = req.validationErrors();

    } catch(e) {
        var errors = [{msg: "Something went wrong!!!"}];
    } 
    return errors;
};

var create = (req) => {
    try {

        req.checkBody("email", "Please fill all the mandatory Fields.").notEmpty();
        var role = req.body.role;
        var entity = req.body.entity;

        if(entity == 'affiliate') {
            req.checkBody("role", "User role is invalid.").isIn(['manager', 'reviewer', 'approver']);
            req.checkBody("departmentId", "Branch ID is required!").notEmpty();
            req.checkBody("affiliateId", "Affiliate Organization ID is required!").notEmpty();
        }

        if(entity == 'organization' && role == 'manager') {
            if(role == 'manager') {
                req.checkBody("role", "User role is invalid.").isIn(['manager', 'reviewer', 'certifier']);
                req.checkBody("departmentId", "Branch ID is required!").notEmpty();
            }

            if(role == 'admin') {
                req.checkBody("role", "User role is invalid.").isIn(['admin', 'manager']);
            }
        }

        if(entity == 'corporate' && role == 'verifier') {
            req.checkBody("role", "User role is required.").notEmpty();
            req.checkBody("entity", "User entity is required.").notEmpty();
        }
        
        var errors = req.validationErrors();

    } catch(e) {
        var errors = [{msg: "Something went wrong!"}];
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
    forgotPassword,
    resetPassword,
    changePassword,
    create,
    update,
    signin
}