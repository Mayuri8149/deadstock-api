var express = require('express');
var router = express.Router();
var schema = require('./schema');
var model = require('./model');
var validator = require('./validator');
var multer = require('multer');
//  Start- Mayuri, 23-01-2021, SCI-I618
var transactionTypeModel = require('../transactiontype/model');
var transactionTypeSchema = require('../transactiontype/schema');
var organizationModel = require('../organization/model');
//  End- Mayuri, 23-01-2021, SCI-I618
// Start - Priyanka Patil (SCI-I830) 05-04-2021
var moduleModel = require('../module/model');
// End - Priyanka Patil (SCI-I830) 05-04-2021
// Start - Priyanka Patil (SNA-17) 20-05-2021
var batchModel = require('../batch/model');
var moment = require('moment');
// End - Priyanka Patil (SNA-17) 20-05-2021

const fs = require("fs"); // Or `import fs from "fs";` with ESM

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

router.post('/upload', (req, res) => {
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

router.post('/create', async (req, res) => {
    var obj = req.body.fields[0];

    var errors = validator.create(req);

    if (errors && errors.length) {
        onError(req, res, errors, 400);
        return false;
    }
    
    

    var assetType;
    if (req.body.transaction == 'Asset' && req.body.assetType == "") {
        assetType = 'Produce Asset';
    }
    if (req.body.assetType != "") {
        assetType = req.body.assetType;
    }
   
    var transtype = {
        organizationId: req.body.organizationId,
        departmentId: req.body.departmentId,
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
        fromToEntity: req.body.fromToEntity,
        transaction: req.body.transaction,
        orderReference: req.body.orderReference,
        assetType: assetType,
        assetWithoutReference: req.body.assetWithoutReference,
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
        createdBy: req.body.createdBy,
        updatedBy: req.body.updatedBy,
        status: req.body.status,
        isExpiry: req.body.expiry,
        refModule: req.body.refModule,
        refTransType: req.body.refTransType,
        inputAsset: req.body.inputAsset,
        nft: req.body.nft
    };

    if (req.body.pdffield == false) {
        transtype.status = true;
    } else if (req.body.pdffield == true) {
        transtype.status = false;
    }
    var obj = {
        organizationId: req.body.organizationId
    }
    await model.listAll(obj).then((result1) => {
        console.log('result1---',result1)
        if(result1.transtypes[0]){
            var transTypeCode = result1.transtypes[0].transactionTypeCode
         }
         if(transTypeCode){
            var transactionTypeCode = parseInt(transTypeCode)
        }else{
            var transactionTypeCode = parseInt(1000)
        }
        let updatedAutoNumber = transactionTypeCode ++;
        let findtransactionAutoNumber = schema.find({}).sort({_id:-1}).limit(1).exec(function(err,docs) {
            if(!docs.length){
                transtype.transactionTypeCode = transactionTypeCode;         
            }else if(docs[0].transactionTypeCode == updatedAutoNumber ){
                let findUpdatedAutoNumber = ( parseInt(docs[0].transactionTypeCode) + parseInt(Math.floor(Math.random() * (9 - 2) + 2))) 
                transtype.transactionTypeCode = findUpdatedAutoNumber;            
            }else{
                transtype.transactionTypeCode = transactionTypeCode;
            }
            model.createTransactionType(transtype).then((result) => {
                if (result.isError || (result.transtypes && result.transtypes._id)) {
                    onError(req, res, [], 500);
                } else {
                    req.app.responseHelper.send(res, true, result, [], 200);
                }
            });
        });
                
        });

});


router.put("/updateTransType/:id", async (req, res) => {

    var errors = validator.update(req);

    if (errors && errors.length) {
        onError(req, res, errors, 400);
        return false;
    }

    var id = req.params.id;
    var assetType;
    if (req.body.transaction == 'Asset' && req.body.assetType == "") {
        assetType = 'Produce Asset';
    }
    if (req.body.assetType != "") {
        assetType = req.body.assetType;
    }
    var transtype = {
        //organizationId: req.body.organizationId,
        //departmentId: req.body.departmentId,
        transactionTypeCode: req.body.transactionTypeCode,
        transactionTypeName: req.body.transactionTypeName,
        additionalDescription: req.body.additionalDescription,
      //  transactionTypePrefix: req.body.transactionTypePrefix,
        transactionTypeAutoNumber: req.body.transactionTypeAutoNumber,
      //  transactionAutoNumber: req.body.transactionTypePrefix+req.body.transactionTypeAutoNumber,
        pdffield: req.body.pdffield,
        review: req.body.review,
        certify: req.body.certify,
        approve: req.body.approve,
        asset: req.body.asset,
        serialized: req.body.serialized,
        provenance: req.body.provenance,
        verifiable: req.body.verifiable,
        htmlFile: req.body.htmlFile,
        fromToEntity: req.body.fromToEntity,
        transaction: req.body.transaction,
        orderReference: req.body.orderReference,
        assetType: assetType,
        assetWithoutReference: req.body.assetWithoutReference,
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
        updatedBy: req.body.updatedBy,
        status: req.body.status,
        isExpiry: req.body.expiry,
        refModule: req.body.refModule,
        refTransType: req.body.refTransType,
        inputAsset: req.body.inputAsset,
        nft: req.body.nft
    };
    if (req.body.pdffield == false) {
        transtype.status = true;
    } else if (req.body.pdffield == true) {
        transtype.status = false;
    }
  
    const result = await model.updateManyTransType(transtype)
            if(result){
               // delete transtype.organizationId;
               // delete transtype.departmentId;
                const transactiontyperesult = await transactionTypeModel.updateManyTranstype(transtype)
                req.app.responseHelper.send(res, true, result, [], 200);
            }else{
                onError(req, res, result.errors, 500);
            }
});

// Start - Priyanka Patil (SCI-I830) 05-04-2021
router.post('/createTransType',  (req, res) => {
    var errors = validator.create(req);

    if (errors && errors.length) {
        onError(req, res, errors, 400);
        return false;
    }
    var transtype = {
        // Start - Priyanka Patil (SNA-17) 20-05-2021
        referenceId: req.body.referenceId,
        referenceCreatedBy: req.body.referenceCreatedBy,
        // End - Priyanka Patil (SNA-17) 20-05-2021
        organizationId: req.body.organizationId,
        // Start - Priyanka Patil (SNA-I12) 19-05-2021
        departmentId: '111111111111111111111111',
        // End - Priyanka Patil (SNA-I12) 19-05-2021
        transactionTypeName: req.body.transactionTypeName,
        // Start - Priyanka Patil (SNA-I12) 31-05-2021
        moduleId: req.body.moduleId,
        // End - Priyanka Patil (SNA-I12) 31-05-2021
        pdffield: req.body.pdffield,
        review: req.body.review,
        certify: req.body.certify,
        approve: req.body.approve,
        asset: req.body.asset,
        credImg: req.body.credImg,
        staticCredImg: req.body.staticCredImg,
        fields: req.body.fields,
        transactionTypeCode:req.body.transactionTypeCode,
        // Start - Priyanka Patil (SNA-17) 29-05-2021
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
        staticFields: req.body.staticFields,
        isPublic: req.body.isPublic,
        viewPDF: req.body.viewPDF,
        transRole: req.body.transRole,
        epr: req.body.epr,
        eprReceive: req.body.eprReceive,
        transRole: req.body.transRole,
        eprConsume: req.body.eprConsume,
        eprPrint: req.body.eprPrint,
        createdBy : req.body.createdBy,
        updatedBy : req.body.updatedBy,
        status : req.body.status,
        //============= Start Neha Mutke (SNA-I9) 10/06/2021 =============
        isExpiry: req.body.isExpiry,
        refModule: req.body.refModule,
        refTransType: req.body.refTransType,
        inputAsset: req.body.inputAsset,
        nft: req.body.nft
        //============= End Neha Mutke (SNA-I9) 10/06/2021 =============
    };

    var findObj = {
        organizationId: transtype.organizationId,
        // departmentId: transtype.departmentId,
        transactionTypeName: transtype.transactionTypeName,
        transactionTypeCode:transtype.transactionTypeCode,
        // Start - Priyanka Patil (SNA-I12) 31-05-2021
        moduleId:transtype.moduleId,
        // End - Priyanka Patil (SNA-I12) 31-05-2021
    }
    var checkDuplicate = (findObj) => {
        model.findByName(findObj).then((result) => {
            if(result.isError || (result.transtypes && result.transtypes.length)) {
                onError(req, res, result.errors, 500);
            } else {
                model.create(transtype).then((transtyperesult) => {
                    if (transtyperesult.isError) {
                        onError(req, res, [], 500);
                    } else {
                
                        var findModuleObj ={
                            organizationId: transtype.organizationId,
                            code: req.body.code
                        }
                        moduleModel.findByCode(findModuleObj).then((resultC) => {
                            if(resultC.isError || (resultC.modules && resultC.modules.length)) {
                                var transtypeData = {
                                    referenceId: transtype.referenceId,
                                    referenceCreatedBy: transtype.referenceCreatedBy,
                                    transactionTypeId: transtyperesult.transtype._id,
                                    organizationId: transtype.organizationId,
                                    // Start - Priyanka Patil (SNA-I12) 19-05-2021
                                    departmentId: '111111111111111111111111',
                                    // End - Priyanka Patil (SNA-I12) 19-05-2021
                                    moduleId: resultC.modules[0]._id,
                                    transactionTypeName: transtype.transactionTypeName,
                                    // Start - Priyanka Patil (SNA-I12) 31-05-2021
                                    transactionTypeCode: transtype.transactionTypeCode,
                                    // End - Priyanka Patil (SNA-I12) 31-05-2021
                                    additionalDescription: transtype.additionalDescription,
                                    transactionTypePrefix: transtype.transactionTypePrefix,
                                    transactionTypeAutoNumber: transtype.transactionTypeAutoNumber,
                                    transactionAutoNumber: transtype.transactionTypePrefix+transtype.transactionTypeAutoNumber,
                                    // Start - Priyanka Patil (SNA-I23) 09-06-2021
                                    serialized: transtype.serialized,
                                    provenance: transtype.provenance,
                                    verifiable: transtype.verifiable,
                                    fromToEntity: transtype.fromToEntity,
                                    transaction: transtype.transaction,
                                    orderReference: transtype.orderReference,
                                    assetType: transtype.assetType,
                                    assetWithoutReference: transtype.assetWithoutReference,
                                    pdffield: transtype.pdffield,
                                    review: transtype.review,
                                    certify: transtype.certify,
                                    approve: transtype.approve,
                                    asset: transtype.asset,
                                    credImg: transtype.credImg,
                                    staticCredImg: transtype.staticCredImg,
                                    fields: transtype.fields,
                                    staticFields: transtype.staticFields,
                                    isPublic: transtype.isPublic,
                                    viewPDF: transtype.viewPDF,
                                    transRole: req.body.transRole,
                                    epr: transtype.epr,
                                    eprReceive: transtype.eprReceive,
                                    eprConsume: transtype.eprConsume,
                                    eprPrint: transtype.eprPrint,
                                    transRole: transtype.transRole,
                                    createdBy : transtype.createdBy,
                                    updatedBy : transtype.updatedBy,
                                    status : transtype.status,
                                    //============= Start Neha Mutke (SNA-I9) 10/06/2021 =============
                                    isExpiry: req.body.isExpiry,
                                    refModule: req.body.refModule,
                                    refTransType: req.body.refTransType,
                                    inputAsset: req.body.inputAsset,
                                    nft: req.body.nft
                                    //============= End Neha Mutke (SNA-I9) 10/06/2021 =============
                                };

                                var findTransObj = {
                                    organizationId: transtype.organizationId,
                                    moduleId: transtyperesult.transtype._id,
                                    transactionTypeName: transtype.transactionTypeName,
                                    transactionTypeCode:transtype.transactionTypeCode,
                                }

                                transactionTypeModel.findByName(findTransObj).then((resultTrans) => {
                                    if(resultTrans.isError){
                                        onError(req, res, resultTrans.errors, 500);
                                    }else{
                                        transactionTypeModel.create(transtypeData).then((resultTransType) => {
                                            if (resultTransType.isError || (resultTransType.transtypes && resultTransType.transtypes._id)) {
                                                onError(req, res, resultTransType.errors, 500);
                                            } else {
                                                req.app.responseHelper.send(res, true, resultTransType.transtypeData, [], 200);
                                            }
                                        });
                                    }
                                })
                            }else {
                                    var module = {
                                        organizationId: transtype.organizationId,
                                        // Start - Priyanka Patil (SNA-I12) 19-05-2021
                                        departmentId: '111111111111111111111111',
                                        // End - Priyanka Patil (SNA-I12) 19-05-2021
                                        createdBy : transtype.createdBy,
                                        updatedBy : transtype.updatedBy,
                                        
                                        is_deleted: req.body.is_deleted,
                                        certificatePrint: req.body.certificatePrint,
                                        gpaCalculated: req.body.gpaCalculated,
                                        noOfTerms: req.body.noOfTerms,
                                        isActive: req.body.isActive,
                                        category: req.body.category,
                                        sub_category: req.body.sub_category,
                                        code: req.body.code,
                                        name: req.body.name
                                    };
                                    var findModulesObj ={
                                        organizationId: transtype.organizationId,
                                        code: req.body.code
                                    }
                                    moduleModel.findByCode(findModulesObj).then((resultModules) => {
                                        if(resultModules.isError || (resultModules.module && resultModules.module._id) ) {
                                            var transtypeData = {
                                                referenceId: transtype.referenceId,
                                                referenceCreatedBy: transtype.referenceCreatedBy,
                                                transactionTypeId: transtyperesult.transtype._id,
                                                organizationId: transtype.organizationId,
                                                // Start - Priyanka Patil (SNA-I12) 19-05-2021
                                                departmentId: '111111111111111111111111',
                                                // End - Priyanka Patil (SNA-I12) 19-05-2021
                                                moduleId: resultModules.module._id,
                                                transactionTypeName: transtype.transactionTypeName,
                                                // Start - Priyanka Patil (SNA-I12) 31-05-2021
                                                transactionTypeCode: transtype.transactionTypeCode,
                                                // End - Priyanka Patil (SNA-I12) 31-05-2021
                                                additionalDescription: transtype.additionalDescription,
                                                transactionTypePrefix: transtype.transactionTypePrefix,
                                                transactionTypeAutoNumber: transtype.transactionTypeAutoNumber,
                                                transactionAutoNumber: transtype.transactionTypePrefix+transtype.transactionTypeAutoNumber,
                                                // Start - Priyanka Patil (SNA-I23) 09-06-2021
                                                serialized: transtype.serialized,
                                                provenance: transtype.provenance,
                                                verifiable: transtype.verifiable,
                                                fromToEntity: transtype.fromToEntity,
                                                transaction: transtype.transaction,
                                                orderReference: transtype.orderReference,
                                                assetType: transtype.assetType,
                                                assetWithoutReference: transtype.assetWithoutReference,
                                                pdffield: transtype.pdffield,
                                                review: transtype.review,
                                                certify: transtype.certify,
                                                approve: transtype.approve,
                                                asset: transtype.asset,
                                                credImg: transtype.credImg,
                                                staticCredImg: transtype.staticCredImg,
                                                fields: transtype.fields,
                                                staticFields: transtype.staticFields,
                                                isPublic: transtype.isPublic,
                                                viewPDF: transtype.viewPDF,
                                                transRole: req.body.transRole,
                                                epr: transtype.epr,
                                                eprReceive: transtype.eprReceive,
                                                eprConsume: transtype.eprConsume,
                                                eprPrint: transtype.eprPrint,
                                                transRole: transtype.transRole,
                                                createdBy : transtype.createdBy,
                                                updatedBy : transtype.updatedBy,
                                                status : transtype.status,
                                                //============= Start Neha Mutke (SNA-I9) 10/06/2021 =============
                                                isExpiry: req.body.isExpiry,
                                                refModule: req.body.refModule,
                                                refTransType: req.body.refTransType,
                                                inputAsset: req.body.inputAsset,
                                                nft: req.body.nft
                                                //============= End Neha Mutke (SNA-I9) 10/06/2021 ============= 
                                            };
            
                                            var findTransObj = {
                                                organizationId: transtype.organizationId,
                                                moduleId: transtyperesult.transtype._id,
                                                transactionTypeName: transtype.transactionTypeName,
                                                transactionTypeCode:obj.transactionTypeCode,
                                            }
            
                                            transactionTypeModel.findByName(findTransObj).then((resultTrans) => {
                                                if(resultTrans.isError){
                                                    onError(req, res, resultTrans.errors, 500);
                                                }else{
                                                    transactionTypeModel.create(transtypeData).then((resultTransType) => {
                                                        if (resultTransType.isError || (resultTransType.transtypes && resultTransType.transtypes._id)) {
                                                            onError(req, res, resultTransType.errors, 500);
                                                        } else {
                                                            req.app.responseHelper.send(res, true, resultTransType.transtypeData, [], 200);
                                                        }
                                                    });
                                                }
                                            })
                                        }else{
                                            moduleModel.create(module).then((resultModule) => {
                                                if(resultModule.isError || !(resultModule.module && resultModule.module._id) ) {
                                                    onError(req, res, [], 500);
                                                } else {
                                                    var transtypeData = {
                                                        referenceId: transtype.referenceId,
                                                        referenceCreatedBy: transtype.referenceCreatedBy,
                                                        transactionTypeId: transtyperesult.transtype._id,
                                                        organizationId: transtype.organizationId,
                                                        // Start - Priyanka Patil (SNA-I12) 19-05-2021
                                                        departmentId: '111111111111111111111111',
                                                        // End - Priyanka Patil (SNA-I12) 19-05-2021
                                                        moduleId: resultModule.module._id,
                                                        transactionTypeName: transtype.transactionTypeName,
                                                        // Start - Priyanka Patil (SNA-I12) 31-05-2021
                                                        transactionTypeCode: transtype.transactionTypeCode,
                                                        // End - Priyanka Patil (SNA-I12) 31-05-2021
                                                        additionalDescription: transtype.additionalDescription,
                                                        transactionTypePrefix: transtype.transactionTypePrefix,
                                                        transactionTypeAutoNumber: transtype.transactionTypeAutoNumber,
                                                        transactionAutoNumber: transtype.transactionTypePrefix+transtype.transactionTypeAutoNumber,
                                                        // Start - Priyanka Patil (SNA-I23) 09-06-2021
                                                        serialized: transtype.serialized,
                                                        provenance: transtype.provenance,
                                                        verifiable: transtype.verifiable,
                                                        fromToEntity: transtype.fromToEntity,
                                                        transaction: transtype.transaction,
                                                        orderReference: transtype.orderReference,
                                                        assetType: transtype.assetType,
                                                        assetWithoutReference: transtype.assetWithoutReference,
                                                        pdffield: transtype.pdffield,
                                                        review: transtype.review,
                                                        certify: transtype.certify,
                                                        approve: transtype.approve,
                                                        asset: transtype.asset,
                                                        credImg: transtype.credImg,
                                                        staticCredImg: transtype.staticCredImg,
                                                        fields: transtype.fields,
                                                        staticFields: transtype.staticFields,
                                                        isPublic: transtype.isPublic,
                                                        viewPDF: transtype.viewPDF,
                                                        transRole: req.body.transRole,
                                                        epr: transtype.epr,
                                                        eprReceive: transtype.eprReceive,
                                                        eprConsume: transtype.eprConsume,
                                                        eprPrint: transtype.eprPrint,
                                                        transRole: transtype.transRole,
                                                        createdBy : transtype.createdBy,
                                                        updatedBy : transtype.updatedBy,
                                                        status : transtype.status,
                                                        //============= Start Neha Mutke (SNA-I9) 10/06/2021 =============
                                                        isExpiry: req.body.isExpiry,
                                                        refModule: req.body.refModule,
                                                        refTransType: req.body.refTransType,
                                                        inputAsset: req.body.inputAsset,
                                                        nft: req.body.nft
                                                        //============= End Neha Mutke (SNA-I9) 10/06/2021 =============
                                                    };
                                                    transactionTypeModel.create(transtypeData).then((resultTransType) => {
                                                        if (resultTransType.isError || (resultTransType.transtypes && resultTransType.transtypes._id)) {
                                                            onError(req, res, [], 500);
                                                        } else {
                                                            var bodystartdate = new Date();
                                                            var startyear = bodystartdate.getFullYear();
                                                            var batch = {
                                                                organizationId: transtype.organizationId,
                                                                departmentId: transtype.departmentId,
                                                                // Start - Priyanka Patil (SNA-17) 27-05-2021
                                                                moduleId: resultModule.module._id,
                                                                // End - Priyanka Patil (SNA-17) 27-05-2021
                                                                code: 'default',
                                                                year: startyear,
                                                                createdBy : req.body.createdBy,
                                                                updatedBy : req.body.updatedBy
                                                            };
                            
                                                            batchModel.create(batch).then((result) => {
                                                                if(result.isError  || !(result.batch && result.batch._id)) {
                                                                    onError(req, res, result.errors, 500);
                                                                } else {
                                                                    var batch = result.batch;
                                                                    req.app.responseHelper.send(res, true, batch, [], 200);
                                                                }
                                                            })
                                                    }
                                                });
                                                }
                                            });
                                        }
                                    })
                                   
                                }
                        })
                    }
                })
            }
        })
        // Start - Priyanka Patil (SNA-17) 20-05-2021
    };

    checkDuplicate(findObj);
});
// End - Priyanka Patil (SCI-I830) 05-04-2021

router.put("/:id", (req, res) => {

    var errors = validator.update(req);

    if (errors && errors.length) {
        onError(req, res, errors, 400);
        return false;
    }

    var id = req.params.id;
    var transtype = {};
    if (typeof req.body.credImg !== 'undefined' && req.body.credImg.length > 0) {
        transtype.credImg = req.body.credImg;
        // Start - Mayuri 24-03-2021 
        transtype.status = true;
    } else {
        // Start - Priyanka Patil 23-02-2021 (SCI-I681)
        transtype.status = req.body.status
        // End - Priyanka Patil 23-02-2021 (SCI-I681)
    }
    // End - Mayuri 24-03-2021 
    transtype.fields = req.body.certobject;
    //  Start- Mayuri, 23-01-2021, SCI-I618
    transtype.staticFields = req.body.scertobject;
    //  End- Mayuri, 23-01-2021, SCI-I618
    //  Start- Shubhangi, 05-02-2020, SCI-I749
    transtype.updatedBy = req.body.updatedBy;
    //  End- Shubhangi, 05-02-2020, SCI-I749

    model.update(id, transtype).then((result) => {
        if (result.isError && result.transtype) {
            onError(req, res, result.errors, 500);
        } else {
            //  Start- Mayuri, 23-01-2021, SCI-I618
            transactionTypeModel.updateByTransactionType(id, transtype).then((transactiontyperesult) => {
                if (result.isError && result.transtype) {
                    onError(req, res, result.errors, 500);
                } else {
                    var transtype = result.transtype;
                    // Start - Mayuri 24-03-2021  View co-ordinates PDF 
                    var newFunction = model.print(transtype);
                    if (!newFunction.isError) {
                        var path = '././././uploads/transactions/dynamic/' +'transaction_type-'+ transtype._id + '.pdf';
                        if (fs.existsSync(path)) {
                            transtype.dynamicPDFFlag = true;
                        } else {
                            transtype.dynamicPDFFlag = false;
                        }
                        req.app.responseHelper.send(res, true, transtype, [], 200);
                    } else {
                        onError(req, res, result.errors, 500);
                    }
                    // End - Mayuri 24-03-2021  View co-ordinates PDF 
                }
            });
            //  End- Mayuri, 23-01-2021, SCI-I618
        }
    });
});
// Start - Priyanka Patil 15-06-2021 (SCI-I40)
router.get('/Alllist', (req, res) => {

    var organizationId = req.query.organizationId;
    var transTypeId = req.query.transTypeId;
    var role = req.query.role;
    var filters = req.query.additionalDescription
    var obj = {};
  
    if (organizationId) {
        obj.organizationId = organizationId;
    }

    if (transTypeId) {
        obj.transTypeId = transTypeId;
    }

    if (role) {
        obj.role = role;
    }
    if (filters) {
        obj.filters = filters;
    }
    model.list(obj).then((result) => {
        if (result.isError || !(result.transtypes)) {
            onError(req, res, [], 500);
        } else {
            req.app.responseHelper.send(res, true, { result }, [], 200);
        }
    });
});
// End - Priyanka Patil 15-06-2021 (SCI-I40)
// Start - Priyanka Patil 18-12-2020 

router.get('/list', (req, res) => {

    var organizationId = req.query.organizationId;
    // var departmentId = req.query.departmentId;
    var transTypeId = req.query.transTypeId;
    var role = req.query.role;
    var filters = req.query
    //  Start- Mahalaxmi, 19-12-2020, SCI-I579
    const pageSize = +parseInt(req.query.pagesize);
    const currentPage = +parseInt(req.query.page);
    var skip = pageSize === undefined ? 0 : (pageSize * (currentPage - 1));
    var limit = pageSize === undefined ? 0 : pageSize;
    if (pageSize && currentPage) {
        var obj = {
            // Start - Priyanka Patil 18-06-2020
            skip: skip,
            limit: limit,
            // End - Priyanka Patil 18-06-2020
        };

    } else {
        var obj = {};
    }

    if (organizationId) {
        obj.organizationId = organizationId;
    }

    // if (departmentId) {
    //     obj.departmentId = departmentId;
    // }

    if (transTypeId) {
        obj.transTypeId = transTypeId;
    }

    if (role) {
        obj.role = role;
    }
    model.listNew(obj,filters).then((result) => {
        if (result.isError || !(result.transtypes)) {
            onError(req, res, [], 500);
        } else {
            req.app.responseHelper.send(res, true, { result }, [], 200);
        }
    });
    //  End- Mahalaxmi, 19-12-2020, SCI-I579
});

// End - Priyanka Patil 18-12-2020 

// Start - Priyanka Patil (SNA-I71) 19-06-2021
router.get('/selectedModuleId/:id', (req, res) => {
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
// End - Priyanka Patil (SNA-I71) 19-06-2021
router.get('/:id', (req, res) => {
    var transTypeId = req.params.id;
    var obj = {
        transTypeId: transTypeId
    }
    model.findById(obj).then((result) => {
        if (result.isError && !result.transtype) {
            onError(req, res, [], 500);
        } else {
            //  Start- Mayuri, 23-01-2021, SCI-I618
            organizationModel.findById(result.transType.organizationId).then((organizationRes) => {
                if (organizationRes.isError && !organizationRes.organization) {
                    onError(req, res, [], 500);
                } else {
                    var certRes = {};
                    certRes = result.transType;
                    certRes['organizationName'] = organizationRes.organization.name;
                    // Start -  Mayuri 23-03-2021 Dynamic Layout
                    var path = '././././uploads/transactions/dynamic/' +'transaction_type-'+ result.transType._id + '.pdf';
                        if (fs.existsSync(path)) {
                            var dynamicPDFFlag = true;
                            certRes['dynamicPDFFlag'] = true;
                        }else{
                            var dynamicPDFFlag = false;
                            certRes['dynamicPDFFlag'] = false;
                        }
                    req.app.responseHelper.send(res, true, {transType: result.transType, organizationName: organizationRes.organization.name, dynamicPDFFlag : dynamicPDFFlag } , [], 200);
                    // End -  Mayuri 23-03-2021 Dynamic Layout
                }
            })
            //  End- Mayuri, 23-01-2021, SCI-I618
        }
    });
});

router.get('/:moduleId/:id', (req, res) => {

    var obj = {
        transTypeId: req.query.id,
        moduleId: req.query.moduleId
    }

    model.findByModuleId(obj).then((result) => {
        if (result.isError && !result) {
            onError(req, res, [], 500);
        } else {
            req.app.responseHelper.send(res, true, { result }, [], 200);
        }
    });
});


router.post('/delete', (req, res) => {
    var draftIds = req.body.draftIds;
    var organizationId = req.body.organizationId;
    var deleteDrafts = (ids) => {
        model.deleteMany(ids).then((result) => {
            if (result.isError) {
                onError(req, res, result.errors, 500, {});
            } else {
                req.app.responseHelper.send(res, true, [], [], 200);
            }
        });
    };

    model.findDraftByIds(draftIds, organizationId).then((result) => {
        if (result.isError || !result.drafts.length) {
            onError(req, res, result.errors, 500, {});
        } else if (result.drafts.length == draftIds.length) {
            deleteDrafts(draftIds);
        }
    });
});

/*  Start- Name -Shubhangi, Date Of Code - 12-04-2021 zoho Task Number -SCI-I852*/
router.put("/:id/changeStatus", (req, res) => {
    var id = req.params.id;
    var obj = {
        transTypeId: id
    }
    model.findById(obj).then((result) => {
        if (result.isError) {
            var errors = result.errors;
            onError(req, res, errors, 500);
        } else {
            result.status = req.body.isActive;
            model.update(id, result).then((transType) => {
                if (transType.isError) {
                    onError(req, res, transType.errors, 500);
                } else {
                    transType.status = req.body.isActive;
                    transactionTypeSchema.findOne({ transactionTypeName: result.transType.transactionTypeName }, (err, Certresult) => {
                        if (Certresult) {
                            transactionTypeModel.update(Certresult._id, transType).then((result) => {
                                if (result.isError) {
                                    onError(req, res, result.errors, 500);
                                } else {
                                    req.app.responseHelper.send(res, true, transType, [], 200);
                                }
                            });
                        } else {

                        }
                    })
                }
            });
        }
    });
});
/*  End- Name -Shubhangi, Date Of Code - 13-04-2021 zoho Task Number -SCI-I852*/
//  Start- Shubhangi, 23-03-2021, SCI-I823
router.get('/transType/:transactionId', (req, res) => {
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
//  End- Shubhangi, 23-03-2021, SCI-I823

module.exports = router;