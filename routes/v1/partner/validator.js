var validator = require('validator');
var moment = require('moment');

var buildData = (req, records) => {
    var partners = [];

    var batchId = req.body.batchId;
    //  Start- Priyanka Patil, 10-02-2021, SCI-I744
    var moduleId = req.body.moduleId;
    //  End- Priyanka Patil, 10-02-2021, SCI-I744
    var affiliateId = req.body.affiliateId;
    var organizationId = req.body.organizationId;

    for(var i=1; i < records.length; i++) {

        records[i].code = (records[i].code) ? records[i].code : "";
        records[i].firstName = (records[i].firstName) ? records[i].firstName : "";
        records[i].lastName = (records[i].lastName) ? records[i].lastName : "";
        
        
        var partner = {};

        partner.batchId = batchId;
        //  Start- Priyanka Patil, 10-02-2021, SCI-I744
        partner.moduleId = moduleId;
        //  End- Priyanka Patil, 10-02-2021, SCI-I744
        partner.affiliateId = affiliateId;
        partner.organizationId = organizationId;
        partner.code = records[i].code;
        partner.status = 'Reviewed';
        partners.push(partner);
    }

    return partners;
};

var register = (req) => {

    try {
        req.checkBody("email", "partner email cannot be blank").isEmail();
        req.checkBody("phoneNumber", 'partner Phone Number is required').notEmpty();

        var errors = req.validationErrors();

    } catch (e) {
        var errors = [{ msg: "Something went wrong!" }];

    }

    return errors;

};

module.exports = {
    buildData,
    register
};
