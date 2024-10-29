var register = (req) => {

    try {
        req.checkBody("email", "recruiter email cannot be blank").isEmail();
        req.checkBody("phoneNumber", 'recruiter Phone Number is required').notEmpty();
        var errors = req.validationErrors();

    } catch (e) {
        var errors = [{ msg: "Something went wrong!" }];

    }

    return errors;

};

module.exports = {
    register
}
