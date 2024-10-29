var express = require('express');
var router = express.Router();
var schema = require('./schema');
var model = require('./model');
var validator = require('./validator');
var multer = require('multer');
var transTypeModel = require('../transtype/model');
var mongoose = require('mongoose');
var useraccessmodel = require('../useraccess/model');

var storage = multer.diskStorage({ //multers disk storage settings
    destination: function (req, file, cb) {
        cb(null, './uploads/')
    },
    filename: function (req, file, cb) {
        var datetimestamp = Date.now();
        cb(null, file.originalname)
    }
});

var upload = multer({ //multer settings
    storage: storage
}).single('file');

// On Error
var onError = (req, res, errors, statusCode) => {
    if (!(Array.isArray(errors) && errors.length)) {
        errors = [{
            "msg": "Something went wrong!"
        }];
    }
    req.app.responseHelper.send(res, false, {}, errors, statusCode);
};
router.get('/transByRefTransType', (req, res) => {
    model.getTransByRefTrans(req.query).then((result) => {
        req.app.responseHelper.send(res, true, {result}, [], 200);
    });
});

// Start - Priyanka Patil (SCI-I862) 23-04-2021
router.post('/Pdfupload', (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            onError(req, res, [], 500, {});
            return;
        } else if (!req.file) {
            var errors = [{
                'msg': 'No File Passed.'
            }];
            onError(req, res, errors, 500, {});
            return;
        } else {
                req.app.responseHelper.send(res, true, {}, [], 200);                        
        }
    });
});
// End - Priyanka Patil (SCI-I862) 23-04-2021
router.post('/upload', (req, res) => {
    
    upload(req, res, (err) => {
        // Start-Mayuri, 14-04-2021, SCI-I12 
        imgheight = req.body.height.substring(0, req.body.height.length - 2);
        imgwidth = req.body.width.substring(0, req.body.width.length - 2);
		// End-Mayuri, 14-04-2021, SCI-I12 
        if (err) {
            onError(req, res, [], 500, {});
            return;
        } else if (!req.file) {
            var errors = [{
                'msg': 'No File Passed.'
            }];
            onError(req, res, errors, 500, {});
            return;
        } else {
            //Start - PDF created from uploaded template
            const PDFDocument = require('pdfkit');
            const fs = require('fs');
            // Start-Mayuri, 14-04-2021, SCI-I12 
            if(parseInt(imgheight) > parseInt(imgwidth)){
                let pdfDoc = new PDFDocument({layout: 'portrait'});
                pdfDoc.image('./uploads/'+req.file.originalname, 0, 0, { width: 620,
                        height: 800});  
                pdfDoc.pipe(fs.createWriteStream('./uploads/'+req.file.originalname+'.pdf'));
                pdfDoc.end();       
                var fileType = "portrait";
                var credFileWidth = 615;
                var credFileHeight = 800; 
            }else if(parseInt(imgheight) < parseInt(imgwidth)){
                let pdfDoc = new PDFDocument({ layout: 'landscape'});
                pdfDoc.image('./uploads/'+req.file.originalname, 0, 0, { width: 800,
                        height: 620});   
                pdfDoc.pipe(fs.createWriteStream('./uploads/'+req.file.originalname+'.pdf'));
                pdfDoc.end(); 
                var fileType = "landscape";
                var credFileWidth = 800;
                var credFileHeight = 620;        
            }else if(parseInt(imgheight) == 0 || parseInt(imgwidth) == 0){
                // Start - Mayuri, 10-05-2021 SCI-I910
                var error = [{
                    'msg': 'Error! While processing image. Please upload your image again.!!'
                }];
                // End - Mayuri, 10-05-2021 SCI-I910
                onError(req, res, error, 500, {});
                return;
            }else{
                // 800, 620
                let pdfDoc = new PDFDocument({ layout: 'portrait'});
                pdfDoc.image('./uploads/'+req.file.originalname, 0, 0, { width: 620,
                        height: 620});
                pdfDoc.pipe(fs.createWriteStream('./uploads/'+req.file.originalname+'.pdf'));
                pdfDoc.end();
                var fileType = "portrait";
                var credFileWidth = 600;
                var credFileHeight = 620;
            }
            // End-Mayuri, 14-04-2021, SCI-I12 

                // var imagewidth = (pdfDoc.page.width - imgwidth) /2;
                // var imageheight = (pdfDoc.page.height - imgheight) /2;

                // pdfDoc.image('./uploads/'+req.file.originalname,{ fit: [imagewidth, imageheight],
                //     align: 'center',
                //     valign: 'center'});
		        // Start-Mayuri, 14-04-2021, SCI-I12 
                // pdfDoc.image('./uploads/'+req.file.originalname, 0, 0, { width: 605,
                //     height: 800});
		        // End-Mayuri, 14-04-2021, SCI-I12 
                // pdfDoc.pipe(fs.createWriteStream('./uploads/'+req.file.originalname+'.pdf'));
                // pdfDoc.end();

                // fs.unlink('././././uploads/' + req.file.originalname, function (err) {
                //     if (err) {
                //     } else {
                        req.app.responseHelper.send(res, true, {fileType: fileType, credFileWidth: credFileWidth, credFileHeight: credFileHeight}, [], 200);                        
                //     }
                // });

            //End - PDF created from uploaded template                
            // req.app.responseHelper.send(res, true, {}, [], 200);
        }
    });
});

router.post('/create',  (req, res) => {
    console.log('req.body---',req.body)
    var errors = validator.create(req);

    if (errors && errors.length) {
        onError(req, res, errors, 400);
        return false;
    }
    var transtype = {
        transactionTypeId: req.body.transactionTypeId,
        organizationId: req.body.organizationId,
        departmentId: req.body.departmentId,
        moduleId: req.body.moduleId,
        transactionTypeCode: req.body.transactionTypeCode,
        transactionTypeName: req.body.transactionTypeName,
        additionalDescription: req.body.additionalDescription,
        transactionTypePrefix: req.body.transactionTypePrefix,
        transactionTypeAutoNumber: req.body.transactionTypeAutoNumber,
        transactionAutoNumber: req.body.transactionTypePrefix+req.body.transactionTypeAutoNumber,
        pdffield: req.body.pdffield,
        review: req.body.review,
        certify: req.body.certify,
        approve: req.body.approve,
        asset: req.body.asset,
        serialized: req.body.serialized,
        provenance: req.body.provenance,
        verifiable: req.body.verifiable,
        htmlFile: req.body.htmlFile,
        transaction: req.body.transaction,
        orderReference: req.body.orderReference,
        assetType: req.body.assetType,
        assetWithoutReference: req.body.assetWithoutReference,
        fromToEntity: req.body.fromToEntity,
        credImg: req.body.credImg,
        credFileType: req.body.credFileType,
        credFileWidth: req.body.credFileWidth,
        credFileHeight: req.body.credFileHeight,
        staticCredImg: req.body.staticCredImg,
        fields: req.body.fields,
        staticFields: req.body.staticFields,
        isPublic: req.body.isPublic,
        viewPDF: req.body.viewPDF,
        transRole: req.body.transRole,
        epr: req.body.epr,
        eprReceive: req.body.eprReceive,
        eprConsume: req.body.eprConsume,
        eprPrint: req.body.eprPrint,
        transRole: req.body.transRole,
        createdBy : req.body.createdBy,
		updatedBy : req.body.updatedBy,
        status : req.body.status,
        //============= Start Neha Mutke (SNA-I9) 10/06/2021 =============
        isExpiry: req.body.isExpiry,
        refModule: req.body.refModule,
        refTransType: req.body.refTransType,
        inputAsset: req.body.inputAsset,
        referenceCreatedBy: req.body.referenceCreatedBy,
        referenceId: req.body.referenceId,
        corporateId: req.body.corporateId,
        nft: req.body.nft
        //============= End Neha Mutke (SNA-I9) 10/06/2021 =============
    };

    var findObj = {};

    if(transtype.transactionTypeCode){
        findObj.transactionTypeCode = transtype.transactionTypeCode
    }

    if(transtype.moduleId){
        findObj.moduleId = transtype.moduleId
    }

    if(transtype.organizationId){
        findObj.organizationId = transtype.organizationId
    }

    if(transtype.corporateId){
        findObj.corporateId = transtype.corporateId
    }

    if(transtype.referenceCreatedBy){
        findObj.referenceCreatedBy = transtype.referenceCreatedBy
    }

    if(transtype.referenceId){
        findObj.referenceId = transtype.referenceId
    }

    var addTransactiontype = (transtype) => {
        console.log('219---',transtype)
        model.create(transtype).then((result) => {
            console.log('221---',result)
            if (result.isError || (result.transtypes && result.transtypes._id)) {
                onError(req, res, [], 500);
            } else {
                req.app.responseHelper.send(res, true, result.transtypes, [], 200);
            }
        });
    };

    var checkDuplicate = (findObj) => {
        model.findByName(findObj).then((result) => {
            console.log('231---',result)
            if(result.isError || (result.transtypes && result.transtypes._id)) {
                onError(req, res, result.errors, 500);
            } else {
                addTransactiontype(transtype);
            }
        })
    };

    checkDuplicate(findObj);
});

// Start - Priyanka Patil (SNA-17) 18-05-2021
router.post('/Transtypecreate',  (req, res) => {
    var errors = validator.create(req);

    if (errors && errors.length) {
        onError(req, res, errors, 400);
        return false;
    }
    var transtype = {
        corporateId: req.body.corporateId,
        // Start - Priyanka Patil (SNA-17) 20-05-2021
        referenceCreatedBy: req.body.referenceCreatedBy,
        // End - Priyanka Patil (SNA-17) 20-05-2021
        // Start - Priyanka Patil (SNA-17) 20-05-2021
        referenceId: req.body.referenceId,
        // End - Priyanka Patil (SNA-17) 20-05-2021
        transactionTypeId: req.body.transactionTypeId,
        // Start - Priyanka Patil (SNA-I11) 02-06-2021
        transactionTypeCode: req.body.transactionTypeCode,
        // End - Priyanka Patil (SNA-I11) 02-06-2021
        organizationId: req.body.organizationId,
        departmentId: req.body.departmentId,
        moduleId: req.body.moduleId,
        // Start - Priyanka Patil (SNA-17) 29-05-2021
        transactionTypeName: req.body.transactionTypeName,
        additionalDescription: req.body.additionalDescription,
        transactionTypePrefix: req.body.transactionTypePrefix,
        transactionTypeAutoNumber: req.body.transactionTypeAutoNumber,
        transactionAutoNumber: req.body.transactionTypePrefix+req.body.transactionTypeAutoNumber,
        // End - Priyanka Patil (SNA-17) 29-05-2021
        // Start - Priyanka Patil (SNA-I23) 09-06-2021
        serialized: req.body.serialized,
        provenance: req.body.provenance,
        verifiable: req.body.verifiable,
        fromToEntity: req.body.fromToEntity,
        transaction: req.body.transaction,
        orderReference: req.body.orderReference,
        assetType: req.body.assetType,
        assetWithoutReference: req.body.assetWithoutReference,
        // End - Priyanka Patil (SNA-I23) 09-06-2021
        pdffield: req.body.pdffield,
        review: req.body.review,
        certify: req.body.certify,
        approve: req.body.approve,
        asset: req.body.asset,
        credImg: req.body.credImg,
        staticCredImg: req.body.credImgstaticCredImg,
        fields: req.body.fields,
        staticFields: req.body.staticFields,
        isPublic: req.body.isPublic,
        viewPDF: req.body.viewPDF,
        transRole: req.body.transRole,
        epr: req.body.epr,
        eprReceive: req.body.eprReceive,
        eprConsume: req.body.eprConsume,
        eprPrint: req.body.eprPrint,
        transRole: req.body.transRole,
		createdBy : req.body.createdBy,
		updatedBy : req.body.updatedBy,
        status : req.body.status
    };

    var findObj = {
        corporateId: transtype.corporateId,
        // Start - Priyanka Patil (SNA-17) 29-05-2021
        transactionTypeName: transtype.transactionTypeName,
        // Start - Priyanka Patil (SNA-18) 07-06-2021
        moduleId:transtype.moduleId,
        // End - Priyanka Patil (SNA-18) 07-06-2021
        // End - Priyanka Patil (SNA-17) 29-05-2021
    }

    var addTranscationtype = (transtype) => {
        model.create(transtype).then((result) => {
            if (result.isError || (result.certtypes && result.certtypes._id)) {
                onError(req, res, [], 500);
            } else {
                req.app.responseHelper.send(res, true, result.certtypes, [], 200);
            }
        });
    };

    var checkDuplicate = (findObj) => {
        model.findByName(findObj).then((result) => {
            if(result.isError || (result.transtypes && result.transtypes._id)) {
                onError(req, res, result.errors, 500);
            } else {
                addTranscationtype(transtype);
            }
        })
    };

    checkDuplicate(findObj);
});
// End - Priyanka Patil (SNA-17) 18-05-2021

// Start - Priyanka Patil (SNA-I11) 02-06-2021
router.put("/:id/changeStatus", (req, res) => {
    var id = req.params.id;
    var organizationId = req.body.organizationId;
    var moduleId = req.body.moduleId;

    var obj = {
        transTypeId: id
    }
    
    if(organizationId){
        obj.organizationId = organizationId
    }
    if(moduleId){
        obj.moduleId = moduleId
    }
    model.findById(obj).then((result) => {
        if (result.isError) {
            var errors = result.errors;
            onError(req, res, errors, 500);
        } else {
            result.is_deleted = req.body.isActive;
            model.update(id, result).then((transType) => {
                if (transType.isError) {
                    onError(req, res, transType.errors, 500);
                } else {
                    transType.is_deleted = req.body.isActive;
                    // req.app.responseHelper.send(res, true, transType, [], 200);
                        useraccessmodel.findById(obj).then((results) => {
                            if (results.isError) {
                                var errors = results.errors;
                                onError(req, res, errors, 500);
                            } else {
                                if(req.body.isActive == true || req.body.isActive == "true"){
                                    results.status = 'inactive'
                                }else{
                                    results.status = 'active'
                                }
                                useraccessmodel.update(id,organizationId,moduleId, results).then((transTypes) => {
                                    console.log("transTypes",transTypes)
                                    if (transTypes.isError) {
                                        onError(req, res, transTypes.errors, 500);
                                    } else {
                                        console.log("req.body.isActive",req.body.isActive)
                                        
                                        req.app.responseHelper.send(res, true, transType, [], 200);
                                    }
                                });
                            }
                        });
                        // req.app.responseHelper.send(res, true, transType, [], 200);
                }
            });
        }
    });
});
// End - Priyanka Patil (SNA-I11) 02-06-2021

router.put("/:id", (req, res) => {
    var transtype = {};
    if(req.body.credImg){
        transtype.credImg = req.body.credImg;
        var errors = validator.update(req);
    }else{
        transtype.fields = req.body;
    }

    if (errors && errors.length) {
        onError(req, res, errors, 400);
        return false;
    }

    var id = req.params.id;  
    model.update(id, transtype).then((result) => {
       
        if (result.isError && result.transtype) {
            onError(req, res, result.errors, 500);
        } else {
            var transtype = result.transtype;
            req.app.responseHelper.send(res, true, transtype, [], 200);
        }
    });
});

router.get('/transtype/list', (req, res) => {
    var organizationId = req.query.organizationId;
    var departmentId = req.query.departmentId;
    var moduleId = req.query.moduleId;
    var status = req.query.status;
    var transTypeId = req.query.transTypeId;
    var dynamicForm = req.query.dynamicForm;
    // Start - Priyanka Patil (SNA-17) 18-05-2021
    var corporateId = req.query.corporateId;
    // End - Priyanka Patil (SNA-17) 18-05-2021
    // Start - Priyanka Patil 18-06-2020
    var referenceCreatedBy = req.query.referenceCreatedBy;
    var referenceId = req.query.referenceId;
    var orgId = req.query.orgId
    var role = req.user.reference.role;
    var id = req.query.id;
    //  Start- Mahalaxmi, 19-12-2020, SCI-I579
    var showithoutCorpId = req.query.showithoutCorpId;
    var showToadmin = req.query.showToadmin;
    var showithoutOrgId = req.query.showithoutOrgId;
    var showithCorpId = req.query.showithCorpId;

    const pageSize = +parseInt(req.query.pagesize);
    const currentPage = +parseInt(req.query.page);
    var skip = pageSize === undefined ? 0 : (pageSize * (currentPage - 1));
	var limit = pageSize === undefined ? 0 : pageSize;
    // if(pageSize && currentPage) {
    //     var obj = {
    //         page: skip,
    //         size: limit,
	//     };	
    // }else{
        var obj = {};	
    // }
    if(organizationId) {
        obj.organizationId = organizationId;
    }

    if(showithoutCorpId) {
        obj.showithoutCorpId = showithoutCorpId;
    }

    if(showToadmin) {
        obj.showToadmin = showToadmin;
    }

    if(showithoutOrgId) {
        obj.showithoutOrgId = showithoutOrgId;
    }

    if(showithCorpId) {
        obj.showithCorpId = showithCorpId;
    }

    if(role){
        obj.role = role;
    }
    if(id){
        obj.id = id;
    }

    if(referenceCreatedBy) {
        obj.referenceCreatedBy = referenceCreatedBy;
    }

    if(referenceId){
        obj.referenceId = referenceId
    }

    if(orgId){
        obj.orgId = orgId
    }
    // End - Priyanka Patil 18-06-2020

    if(departmentId) {
        obj.departmentId = departmentId;
    }

    if(moduleId) {
        obj.moduleId = moduleId;
    }

    if(transTypeId) {
        obj.transTypeId = transTypeId;
    }
     // Start - Priyanka Patil (SNA-17) 18-05-2021
     if(corporateId) {
        obj.corporateId = corporateId;
    }
    // End - Priyanka Patil (SNA-17) 18-05-2021
    console.log("obj",obj)
    //============= Start Neha Mutke (SNA-I9) 10/06/2021 =============
    model.listNewTrans(obj).then((result) => {
        if (dynamicForm == 'dynamicForm') {
            var transactionTypePrefix = result.transtypes.transtypes[0].transactionTypePrefix;
            var transactionTypeAutoNumber = result.transtypes.transtypes[0].transactionTypeAutoNumber;
            var transactionAutoNumber = result.transtypes.transtypes[0].transactionAutoNumber;
            if (transactionAutoNumber == 'null' || transactionAutoNumber == undefined) {
                transactionAutoNumber = transactionTypePrefix + transactionTypeAutoNumber;
                //transactionAutoNumber = transactionTypePrefix + '1000' + transactionTypeAutoNumber;
            } else {
                var splitValue = transactionAutoNumber.split(transactionTypePrefix);
                var num = parseInt(splitValue[splitValue.length - 1]);
                splitValue.splice(-1, 1);
                num++;       
                transactionAutoNumber = transactionTypePrefix + num;
            }
            var transtype1 = {
                transactionAutoNumber: transactionAutoNumber
            }
            result.transtypes.transtypes[0].transactionAutoNumber = transactionAutoNumber;
            model.update(result.transtypes.transtypes[0]._id, transtype1).then((result1) => {
                if(result.isError || !(result.transtypes)) {
                    // onError(req, res, [], 500);
                } else {
                    req.app.responseHelper.send(res, true, {result}, [], 200);
                    //  End- Mahalaxmi, 19-12-2020, SCI-I579
                }
            })
        } else {
            if(result.isError || !(result.transtypes)) {
                // onError(req, res, [], 500);
            } else {
                req.app.responseHelper.send(res, true, {result}, [], 200);
                //  End- Mahalaxmi, 19-12-2020, SCI-I579
            }
        }
    });
    //============= End Neha Mutke (SNA-I9) 10/06/2021 =============
});

router.get('/list', (req, res) => {
    var organizationId = req.query.organizationId;
    var departmentId = req.query.departmentId;
    var moduleId = req.query.moduleId;
    var status = req.query.status;
    var transTypeId = req.query.transTypeId;
    var dynamicForm = req.query.dynamicForm;
    // Start - Priyanka Patil (SNA-17) 18-05-2021
    var corporateId = req.query.corporateId;
    // End - Priyanka Patil (SNA-17) 18-05-2021
    // Start - Priyanka Patil 18-06-2020
    var referenceCreatedBy = req.query.referenceCreatedBy;
    var referenceId = req.query.referenceId;
    var orgId = req.query.orgId
    var role = req.user.reference.role;
    var id = req.query.id;
    //  Start- Mahalaxmi, 19-12-2020, SCI-I579
    var showithoutCorpId = req.query.showithoutCorpId;
    var showToadmin = req.query.showToadmin;
    var showithoutOrgId = req.query.showithoutOrgId;
    var showithCorpId = req.query.showithCorpId;
    var filters = req.query
    const pageSize = +parseInt(req.query.pagesize);
    const currentPage = +parseInt(req.query.page);
    var skip = pageSize === undefined ? 0 : (pageSize * (currentPage - 1));
	var limit = pageSize === undefined ? 0 : pageSize;
    if(pageSize && currentPage) {
        var obj = {
            page: skip,
            size: limit,
	    };	
    }else{
        var obj = {};	
    }
    if(organizationId) {
        obj.organizationId = organizationId;
    }

    if(showithoutCorpId) {
        obj.showithoutCorpId = showithoutCorpId;
    }

    if(showToadmin) {
        obj.showToadmin = showToadmin;
    }

    if(showithoutOrgId) {
        obj.showithoutOrgId = showithoutOrgId;
    }

    if(showithCorpId) {
        obj.showithCorpId = showithCorpId;
    }

    if(role){
        obj.role = role;
    }
    if(id){
        obj.id = id;
    }

    if(referenceCreatedBy) {
        obj.referenceCreatedBy = referenceCreatedBy;
    }

    if(referenceId){
        obj.referenceId = referenceId
    }

    if(orgId){
        obj.orgId = orgId
    }
    // End - Priyanka Patil 18-06-2020

    if(departmentId) {
        obj.departmentId = departmentId;
    }

    if(moduleId) {
        obj.moduleId = moduleId;
    }

    if(transTypeId) {
        obj.transTypeId = transTypeId;
    }
     // Start - Priyanka Patil (SNA-17) 18-05-2021
     if(corporateId) {
        obj.corporateId = corporateId;
    }
    // End - Priyanka Patil (SNA-17) 18-05-2021
    console.log("obj",obj)
    //============= Start Neha Mutke (SNA-I9) 10/06/2021 =============
    model.listNew(obj,filters).then((result) => {
        if (dynamicForm == 'dynamicForm') {
            var transactionTypePrefix = result.transtypes.transtypes[0].transactionTypePrefix;
            var transactionTypeAutoNumber = result.transtypes.transtypes[0].transactionTypeAutoNumber;
            var transactionAutoNumber = result.transtypes.transtypes[0].transactionAutoNumber;
            if (transactionAutoNumber == 'null' || transactionAutoNumber == undefined) {
                transactionAutoNumber = transactionTypePrefix + transactionTypeAutoNumber;
                //transactionAutoNumber = transactionTypePrefix + '1000' + transactionTypeAutoNumber;
            } else {
                var splitValue = transactionAutoNumber.split(transactionTypePrefix);
                var num = parseInt(splitValue[splitValue.length - 1]);
                splitValue.splice(-1, 1);
                num++;       
                transactionAutoNumber = transactionTypePrefix + num;
            }
            var transtype1 = {
                transactionAutoNumber: transactionAutoNumber
            }
            result.transtypes.transtypes[0].transactionAutoNumber = transactionAutoNumber;
            model.update(result.transtypes.transtypes[0]._id, transtype1).then((result1) => {
                if(result.isError || !(result.transtypes)) {
                    // onError(req, res, [], 500);
                } else {
                    req.app.responseHelper.send(res, true, {result}, [], 200);
                    //  End- Mahalaxmi, 19-12-2020, SCI-I579
                }
            })
        } else {
            if(result.isError || !(result.transtypes)) {
                // onError(req, res, [], 500);
            } else {
                for(var iLoop = 0; iLoop < result.transtypes.transtypes.length; iLoop++){
                    if(result.transtypes.transtypes[iLoop].organizationsCreatedBy){
                        result.transtypes.transtypes[iLoop].invitedEntityName = result.transtypes.transtypes[iLoop].organizationsCreatedBy.name;
                    }else if(result.transtypes.transtypes[iLoop].userCreatedBy){
                        result.transtypes.transtypes[iLoop].invitedEntityName = result.transtypes.transtypes[iLoop].userCreatedBy.companyName;
                    }
                }
                req.app.responseHelper.send(res, true, {result}, [], 200);
                //  End- Mahalaxmi, 19-12-2020, SCI-I579
            }
        }
    });
    //============= End Neha Mutke (SNA-I9) 10/06/2021 =============
});

router.get('/transcationlist', (req, res) => {
    var organizationId = req.query.organizationId;
    var departmentId = req.query.departmentId;
    var moduleId = req.query.moduleId;
    var status = req.query.status;
    var transTypeId = req.query.transTypeId;
    var dynamicForm = req.query.dynamicForm;
    var corporateId = req.query.corporateId;
    var referenceCreatedBy = req.query.referenceCreatedBy;
    var referenceId = req.query.referenceId;
    var orgId = req.query.orgId
    var role = req.user.reference.role;
    var id = req.query.id;
    var showithoutCorpId = req.query.showithoutCorpId;
    var showToadmin = req.query.showToadmin;
    var showithoutOrgId = req.query.showithoutOrgId;
    var filters = req.query;
    const pageSize = +parseInt(req.query.pagesize);
    const currentPage = +parseInt(req.query.page);
    var skip = pageSize === undefined ? 0 : (pageSize * (currentPage - 1));
	var limit = pageSize === undefined ? 0 : pageSize;
    if(pageSize && currentPage) {
        var obj = {
            page: skip,
            size: limit,
	    };	
    }else{
        var obj = {};	
    }
    if(organizationId) {
        obj.organizationId = organizationId;
    }

    if(showithoutCorpId) {
        obj.showithoutCorpId = showithoutCorpId;
    }

    if(showToadmin) {
        obj.showToadmin = showToadmin;
    }

    if(showithoutOrgId) {
        obj.showithoutOrgId = showithoutOrgId;
    }

    if(role){
        obj.role = role;
    }
    if(id){
        obj.id = id;
    }

    if(referenceCreatedBy) {
        obj.referenceCreatedBy = referenceCreatedBy;
    }

    if(referenceId){
        obj.referenceId = referenceId
    }

    if(orgId){
        obj.orgId = orgId
    }

    if(departmentId) {
        obj.departmentId = departmentId;
    }

    if(moduleId) {
        obj.moduleId = moduleId;
    }

    if(transTypeId) {
        obj.transTypeId = transTypeId;
    }
     if(corporateId) {
        obj.corporateId = corporateId;
    }
    model.transcationlist(obj,filters).then((result) => {
        if (dynamicForm == 'dynamicForm') {
            var transactionTypePrefix = result.transtypes.transtypes[0].transactionTypePrefix;
            var transactionTypeAutoNumber = result.transtypes.transtypes[0].transactionTypeAutoNumber;
            var transactionAutoNumber = result.transtypes.transtypes[0].transactionAutoNumber;
            if (transactionAutoNumber == 'null' || transactionAutoNumber == undefined) {
                transactionAutoNumber = transactionTypePrefix + transactionTypeAutoNumber;
                //transactionAutoNumber = transactionTypePrefix + '1000' + transactionTypeAutoNumber;
            } else {
                var splitValue = transactionAutoNumber.split(transactionTypePrefix);
                var num = parseInt(splitValue[splitValue.length - 1]);
                splitValue.splice(-1, 1);
                num++;       
                transactionAutoNumber = transactionTypePrefix + num;
            }
            var transtype1 = {
                transactionAutoNumber: transactionAutoNumber
            }
            result.transtypes.transtypes[0].transactionAutoNumber = transactionAutoNumber;
            model.update(result.transtypes.transtypes[0]._id, transtype1).then((result1) => {
                if(result.isError || !(result.transtypes)) {
                    // onError(req, res, [], 500);
                } else {
                    req.app.responseHelper.send(res, true, {result}, [], 200);
                }
            })
        } else {
            if(result.isError || !(result.transtypes)) {
                // onError(req, res, [], 500);
            } else {
                req.app.responseHelper.send(res, true, {result}, [], 200);
            }
        }
    });
});

router.get('/refTransType', (req, res) => {
    req.query.userId = req.user.userId
    model.refTransType(req.query).then((result) => {
        req.app.responseHelper.send(res, true, {result}, [], 200);
    });
});

router.get('/:id', (req, res) => {
    var transTypeId = req.params.id;
    var obj = {
        transTypeId: transTypeId
    }

    model.findById(obj).then((result) => {
        if(result.isError && !result.transtype) {
            onError(req, res, [], 500);
        } else {
            req.app.responseHelper.send(res, true, {transType: result.transType}, [], 200);
        }
    });
});

router.get('/TransactionModule/:id', (req, res) => {

	var id = req.params.id;

    var obj = {
		id: id,
		moduleId: req.query.moduleId,
    }

    model.findByModulesId(obj).then((result) => {
        if(result.isError && !result.transtype) {
            onError(req, res, [], 500);
        } else {
            req.app.responseHelper.send(res, true, {transType: result.transType}, [], 200);
        }
    });

});


router.get('/transactionType/:id', (req, res) => {
    var transTypeId = req.params.id;
    var obj = {
        transTypeId: transTypeId
    }

    model.findByTransactionTypeId(obj).then((result) => {
        if(result.isError && !result.transtype) {
            onError(req, res, [], 500);
        } else {
            req.app.responseHelper.send(res, true, {transType: result.transType}, [], 200);
        }
    });
});

router.get('/:moduleId/:id', (req, res) => {
        
    var obj = {
        transTypeId: req.query.id,
        moduleId: req.query.moduleId
    }

    model.findByModuleId(obj).then((result) => {
        if(result.isError && !result) {
            onError(req, res, [], 500);
        } else {
            req.app.responseHelper.send(res, true, {result}, [], 200);
        }
    });
});
    
router.get('/TransactionModule/Module/ModuleId/Id', (req, res) => {
    var obj = {
		moduleId: req.query.moduleId,
    }
    model.findByModuledId(obj).then((result) => {
        if(result.isError && !result.transtype) {
            onError(req, res, [], 500);
        } else {
            req.app.responseHelper.send(res, true, {transType: result.transType}, [], 200);
        }
    });
});

router.get('/TransactionModule/ModuleList/Modules/ModuleId', (req, res) => {
    var data = {
		moduleId: req.query.moduleId,
    }

    model.list(data).then((result) => {
        if(result.isError && !result.transtypes) {
            onError(req, res, [], 500);
        } else {
            req.app.responseHelper.send(res, true, {transtypes: result.transtypes}, [], 200);
        }
    });
});

router.post('/delete', (req, res) => {
    var moduleId = req.body.moduleId;
    var draftIds = req.body.draftIds;
    var organizationId = req.body.organizationId;
        model.deleteMany(moduleId).then((result) => {
            if(result.isError) {
                onError(req, res, result.errors, 500, {});
            } else {
                req.app.responseHelper.send(res, true, [], [], 200);
            }
        });
});
// Start - Priyanka Patil (SNA-71) 01-07-2021
router.get('/changeStatus/selectedModuleId/:id', (req, res) => {
    var moduleId = req.params.id;
     var obj = {
        moduleId: moduleId
    }
    var module = {
        is_deleted: req.query.is_deleted
    }
    model.findModuleId(obj).then((result) => {
        if (result.isError && !result) {
            onError(req, res, [], 500);
        } else {
            model.updateTranstype(moduleId, module).then((resultTrans) => {
                if (resultTrans.isError) {
                    onError(req, res, resultTrans.errors, 500);
                } else {
                    req.app.responseHelper.send(res, true, resultTrans, [], 200);
                }
            });
        }
    });
});
// End - Priyanka Patil (SNA-71) 01-07-2021

router.get('/changeModuleStatus/selectedModuleId/:id', (req, res) => {
    var moduleId = req.params.id;
     var obj = {
        moduleId: moduleId
    }

    model.findModuleId(obj).then((result) => {
        if (result.isError && !result) {
            onError(req, res, [], 500);
        } else {
            req.app.responseHelper.send(res, true, {transType: result.transType }, [], 200);
        }
    });
   
});



module.exports = router;