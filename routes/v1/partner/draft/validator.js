var validator = require('validator');
var moment = require('moment');
var crypto = require('crypto');
var md5 = require('md5');

var onError = (req, res, errors, statusCode, data) => {
    if (!(Array.isArray(errors) && errors.length)) {
        errors = [{
            "msg": "Something went wrong!"
        }];
    }

    if (!data) {
        data = {};
    }
    req.app.responseHelper.send(res, false, data, errors, statusCode);
};

var isValidDate = (date) => {
    var d = moment(date).isValid();
    return (d) ? true : false;
};

var dobFormat = (date) => {
    var bodystartdate = new Date(date);
    var startyear = bodystartdate.getFullYear();
    var startmonth = bodystartdate.getMonth() + 1;
    var startdt = bodystartdate.getDate();
    var d = moment.utc(startyear + '-' + startmonth + '-' + startdt)

    return (d) ? true : false;
};

var buildData = (req, records) => {
    var partners = [];

    var batchId = req.body.batchId;
    //  Start- Priyanka Patil, 10-02-2021, SCI-I744
    var moduleId = req.body.moduleId;
    //  End- Priyanka Patil, 10-02-2021, SCI-I744
    var organizationId = req.body.organizationId;
    //  Start- Shubhangi, 05-02-2020, SCI-I749
    var createdBy = req.body.createdBy;
    var updatedBy = req.body.updatedBy;
    //  End- Shubhangi, 05-02-2020, SCI-I749

    for (var i = 1; i < records.length; i++) {

        records[i].firstName = (records[i].firstName) ? records[i].firstName : "";
        records[i].lastName = (records[i].lastName) ? records[i].lastName : "";
        records[i].email = (records[i].email) ? records[i].email : "";
        if (!records[i].code && !records[i].email) {
            var emailDID = "";
        } else if (records[i].code) {
            var emailDID = records[i].code;
        } else {
            var sha256 = crypto.createHash('md5').update(records[i].email).digest('hex');
            var emailDID = 'did:snapcert:' + sha256;

        }

        var partner = {};

        partner.batchId = batchId;
        //  Start- Priyanka Patil, 10-02-2021, SCI-I744
        partner.moduleId = moduleId;
        //  End- Priyanka Patil, 10-02-2021, SCI-I744
        partner.organizationId = organizationId;
        partner.code = { value: emailDID, error: true };
        partner.firstName = { value: records[i].firstName, error: true };
        partner.lastName = { value: records[i].lastName, error: true };
        partner.email = { value: records[i].email, error: true };
        partner.did = { value: emailDID, error: false };
        //  Start- Shubhangi, 05-02-2020, SCI-I749
        partner.createdBy = createdBy;
        partner.updatedBy = updatedBy
        //  End- Shubhangi, 05-02-2020, SCI-I749
        if (records[i].code || records[i].email) {
            partner.code.error = false;
        }

        if (records[i].firstName && !validator.isEmpty(records[i].firstName)) {
            partner.firstName.error = false;
        }

        if (records[i].lastName && !validator.isEmpty(records[i].lastName)) {
            partner.lastName.error = false;
        }

        if (records[i].email && validator.isEmail(records[i].email)) {
            partner.email.error = false;
        }

        partners.push(partner);
    }

    return partners;
};

var process = (req) => {

    var user = req.user;
    var data = {
        partners: [],
        draftIds: [],
        batchId: 0,
        //  Start- Priyanka Patil, 10-02-2021, SCI-I744
        moduleId: 0,
        //  End- Priyanka Patil, 10-02-2021, SCI-I744
        isAffiliateCheckFailed: false,
        isDataInvalid: false,
        incorrectDraftIds: []
    };
    //  Start- Priyanka Patil, 21-01-2021, SCI-I715
    var userAffiliateId = (user && user.reference && user.reference.organizationId) ? user.reference.organizationId : 0;

    var drafts = req.body.drafts;

    for (var i = 0; i < drafts.length; i++) {
        var draft = drafts[i];
        if (draft.status === "new") {
            //  Start- Priyanka Patil, 10-02-2021, SCI-I744
            if (draft.moduleId && draft.organizationId && (draft.code.error === false) && (draft.firstName.error === false) && (draft.lastName.error === false) && (draft.email.error === false)) {

                if (userAffiliateId && (userAffiliateId != draft.organizationId)) {
                    data.isAffiliateCheckFailed = true;
                    break;
                }

                if (!data.organizationId && !data.moduleId) {
                    data.organizationId = draft.organizationId;
                    data.moduleId = draft.moduleId;
                } else if (data.organizationId && (data.organizationId != draft.organizationId) && (data.moduleId != draft.moduleId)) {

                    data.isAffiliateCheckFailed = true;
                    break;
                }
                //  End- Priyanka Patil, 10-02-2021, SCI-I744
                data.draftIds.push(draft._id);

                var partner = {};
                partner.code = draft.code.value;
                partner.firstName = draft.firstName.value;
                partner.lastName = draft.lastName.value;
                partner.email = draft.email.value;
                partner.batchId = draft.batchId;
                //  Start- Priyanka Patil, 10-02-2021, SCI-I744
                partner.moduleId = draft.moduleId;
                //  End- Priyanka Patil, 10-02-2021, SCI-I744
                partner.organizationId = draft.organizationId;
                partner.did = draft.did.value;
                //  Start- Shubhangi, 05-02-2020, SCI-I749
                partner.createdBy = draft.createdBy;
                partner.updatedBy = draft.updatedBy;
                //  End- Shubhangi, 05-02-2020, SCI-I749
                data.partners.push(partner);
            }
            else {
                data.incorrectDraftIds.push(draft._id);
            }
        }
    }

    if (data.isAffiliateCheckFailed && data.isDataInvalid) {
        data.draftIds = [];
        data.partners = [];
    }

    return data;
};
//  End- Priyanka Patil, 21-01-2021, SCI-I715
var updateDraft = (req) => {
    var draft = {};
    draft._id = req.body._id;
    draft.batchId = req.body.batchId;
    //  Start- Priyanka Patil, 10-02-2021, SCI-I744
    draft.moduleId = req.body.moduleId;
    //  End- Priyanka Patil, 10-02-2021, SCI-I744
    draft.organizationId = req.body.organizationId;
    draft.code = { value: req.body.code.value, error: true };
    draft.firstName = { value: req.body.firstName.value, error: true };
    draft.lastName = { value: req.body.lastName.value, error: true };
    draft.email = { value: req.body.email.value, error: true };
    draft.status = req.body.status;

    if (draft.code.value) {
        draft.code.error = false;
    }

    if (draft.firstName.value && !validator.isEmpty(draft.firstName.value)) {
        draft.firstName.error = false;
    }

    if (draft.lastName.value && !validator.isEmpty(draft.lastName.value)) {
        draft.lastName.error = false;
    }

    if (draft.email.value && validator.isEmail(draft.email.value)) {
        draft.email.error = false;
    }

    return draft;
};

module.exports = {
    buildData,
    process,
    updateDraft
};
