
var express = require('express');
var router = express.Router();
var model = require('./model');
var validator = require('./validator');
const organizationSchema = require('../organization/schema');
const corporateSchema = require('../corporate/schema')
var nodeoutlook = require('nodejs-nodemailer-outlook')
const Mongoose = require('mongoose');
var { BitlyClient } = require('bitly');
var bitly = new BitlyClient('bd7c59665ddf56b1a1938018176da1458566eb6b', {});
var emailService = require('../../../services/emailService')
var corporateModel = require('../corporate/model')

// On Error
var onError = (req, res, errors, statusCode) => {
    if (!(Array.isArray(errors) && errors.length)) {
        errors = [{
            "msg": "Something went wrong!"
        }];
    }
    req.app.responseHelper.send(res, false, {}, errors, statusCode);
};

router.post('/create', async (req, res) => {
    var errors = validator.validateData(req);
    if (errors && errors.length) {
        onError(req, res, errors, 400);
        return false;
    }
    var partnerDetails = req.body
    if(partnerDetails.status == 'invited'){
    partnerDetails.entityId =  Math.floor(1000 + Math.random() * 9000);
    }
    try {
        if(partnerDetails.status == 'invited'){
            let existCorpPartner = await corporateModel.checkDuplicateCorporate(partnerDetails)
            let newCorpPartner = await corporateModel.createNewCorp(existCorpPartner, partnerDetails)
            partnerDetails.childEntity = newCorpPartner._id
        }
        let existingPartner = await model.checkDuplicatePartner(partnerDetails);
        let newPartner = await model.create(existingPartner, partnerDetails)
        if ((newPartner && existingPartner == null) || partnerDetails.status == 'approved') {
            let organization = {}
            let corporates = {}
            let inviterName = ''
            if(partnerDetails.organizationId == partnerDetails.partnerEntity ){
                organization = await organizationSchema.findOne({ _id: Mongoose.Types.ObjectId(partnerDetails.organizationId) })
                inviterName = organization.name
            }else{
                corporates  = await corporateSchema.findOne({ _id: Mongoose.Types.ObjectId(partnerDetails.partnerEntity) })
                inviterName = corporates.companyName
            }
                var strLink = global.config.URI;
                var refLink;
                bitly.shorten(strLink).then(function (resultLink) {
                    var mailOptions = {}
                    if (partnerDetails.status == 'approved') {
                        mailOptions = {
                            to: partnerDetails.email,
                            subject: 'Approved as a partner!',
                            body: 'Congratulations, <br/><br/> You have been approved as a partner by' + " " + inviterName,
                        }
                       
                }else{


                    refLink = resultLink.link.link(global.config.MAILURI + "partnerRegistration/" + newPartner._id + '/Id/' + newPartner.entityId);
                    // }else{
                    //     refLink = resultLink.link.link(global.config.URI + "individualverifier/" + newPartner._id) ;
                    mailOptions = {
                        to: partnerDetails.email,
                        subject: 'Invitation for onboarding!',
                        body: 'Congratulations, <br/><br/> You are invited by' + " " + inviterName + '<br/><br/> Please click on the link below to Sign-Up. <br/><br/> <b>\n\nLink: </b>' + refLink,
                    }
                    
                }
                    emailService.sendEmail(mailOptions).then((result) => {
                        if (result.isError) {
                            onError(req, res, [], 500);
                        } else {
                            req.app.responseHelper.send(res, true, newPartner, [], 200);
                        }
                })
            })

        } else {
            if (partnerDetails.status == 'new' || partnerDetails.status == 'invited' || partnerDetails.status == 'signedUp' || partnerDetails.disAproved == true) {
                req.app.responseHelper.send(res, true, newPartner, [], 200);
            }
        }
    } catch (ex) {
        let e = ex;
    }
});


router.get('/getPartnersByOrgId', (req, res) => {
    const pageSize = +parseInt(req.query.pagesize);
    const currentPage = +parseInt(req.query.page);
    var skip = pageSize === undefined ? 0 : (pageSize * (currentPage - 1));
    var limit = pageSize === undefined ? 0 : pageSize;
    var filters = req.query.corporateNameCode
    var data = {
        page: skip,
        size: limit,
        status: req.query.status,
        partnerEntity: req.query.partnerEntity,
        organizationId: req.query.organizationId,
        childEntity:req.query.childEntity
    };
    if (filters) {
        data.filters = filters;
    }
    // if(req.query.organizationId == '111111111111111111111111'){
    //     data.partnerEntity = req.query.partnerEntity;
    // }else{
    //     data.organizationId = req.query.organizationId;
    // }
    console.log('Data in partner-',data)
    model.getPartnersByOrgId(data).then((result) => {
        if (result.isError) {
            onError(req, res, [{ "msg": "Failed to get partners!" }], 500);
        } else {
            req.app.responseHelper.send(res, true, result, [], 200);
        }
    })
})


router.get('/getPartnersForTransactions', (req, res) => {
    const pageSize = +parseInt(req.query.pagesize);
    const currentPage = +parseInt(req.query.page);
    var skip = pageSize === undefined ? 0 : (pageSize * (currentPage - 1));
    var limit = pageSize === undefined ? 0 : pageSize;
    var data = {
        page: skip,
        size: limit,
        status: req.query.status,
        partnerEntity: req.query.partnerEntity,
        organizationId: req.query.organizationId,
        childEntity:req.query.childEntity
    };
    console.log('Data in partner-',data)
    model.getPartners(data).then((result) => {
        if (result.isError) {
            onError(req, res, [{ "msg": "Failed to get partners!" }], 500);
        } else {
            req.app.responseHelper.send(res, true, result, [], 200);
        }
    })
})


router.post('/resendInvitation', async (req, res) => {
    let resendInvitationDetails = req.body
    var strLink = global.config.URI;
    var refLink;
    if(typeof resendInvitationDetails.organizationName === 'undefined'){
        let parentDetails = await corporateSchema.findOne({ _id: Mongoose.Types.ObjectId(resendInvitationDetails._id) })
        resendInvitationDetails.organizationName = parentDetails.companyName
    }
    if(!(typeof resendInvitationDetails.organizationName === 'undefined')){
    bitly.shorten(strLink).then(function (resultLink) {
        var mailOptions = {}
        refLink = resultLink.link.link(global.config.MAILURI + "partnerRegistration/" + resendInvitationDetails._id + '/Id/' + resendInvitationDetails.entityId);
                    mailOptions = {
                        to: resendInvitationDetails.email,
                        subject: 'Invitation for onboarding!',
                        body: 'Congratulations, <br/><br/> You are invited by' + " " + resendInvitationDetails.organizationName + '<br/><br/> Please click on the link below to Sign-Up. <br/><br/> <b>\n\nLink: </b>' + refLink,
                    }
                    emailService.sendEmail(mailOptions).then((result) => {
                        if (result.isError) {
                            onError(req, res, [], 500);
                        } else {
                            req.app.responseHelper.send(res, true, resendInvitationDetails, [], 200);
                        }
                })
            })
        }
})


router.put("/:id/changeStatus", (req, res) => {
    var id = req.params.id;
    var isBlockchainService = req.body.isBlockchainService
    if(req.body.isBlockchainService==undefined || req.body.isBlockchainService==null || req.body.isBlockchainService==''){
        isBlockchainService = false
    }

    var partner = {
        status: req.body.status
    }
    var corporate = {
        isBlockchainService: isBlockchainService
    }
    model.update(id, partner).then((result) => {
        if (result.isError || !(result.partner)) {
            onError(req, res, result.errors, 500);
        } else {
            if(req.body.status=='approved'){
                corporateModel.updateCorporate(req.body.corporate._id, corporate).then((corpResult) => {
                })
            }
            var partner = result.partner;
            req.app.responseHelper.send(res, true, partner, [], 200);
        }
    });

});

module.exports = router;