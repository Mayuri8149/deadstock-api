
var moment = require('moment');

const types = [
    'Central University', 'State University', 'Deemed University',
    'Private University', 'CBSE', 'ICSE', 'State Board',
    'International Board', 'Private Organization'
];

const regulatoryBody = [
    'UGC', 'AICTE', 'DEC', 'ICAR', 'NCTE', 'NBA', 'BCI', 'MCI', 'NAAC'
];

var isValidDate = (date) => {
    var d = moment(date, 'DD-MM-YYYY').isValid();
    return (d = true) ? true : false;
};

var register = (req) => {
    try {

        // Organization Admin validato
        req.checkBody("organizationAdmin.firstName", "organizationAdmin first name cannot be blank").notEmpty().trim().escape();
        req.checkBody("organizationAdmin.lastName", "organizationAdmin last name cannot be blank").notEmpty().trim().escape();
        req.checkBody("organizationAdmin.email", "organizationAdmin email cannot be blank").isEmail();
        req.checkBody('organizationAdmin.phoneNumber', 'organizationAdmin Phone Number is required').notEmpty();

        //Insititute Details
        req.checkBody("organizationAdmin.name", "Organization name cannot be blank").notEmpty().trim().escape();
        req.checkBody("organizationAdmin.code", "Organization ID cannot be blank").notEmpty(); 
        var errors = req.validationErrors();

    } catch (e) {
        var errors = [{ msg: "Something went wrong!" }];

    }

    return errors;
};

module.exports = {
    register
}