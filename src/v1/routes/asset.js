const express = require('express');
var router = express.Router();
const Joi = require('@hapi/joi');
const _ = require('lodash');
const assetService = require('../services/assetService');
const eprAssetService = require('../services/eprAssetService');
const { authenticateTransaction, validateAssetTransactionId } = require('../middleware/transaction');
const transactionService = require('../services/transactionServices');
const SUCCESSMSG = require("../lang/success");
const ERRORMSG = require("../lang/error");
// const {addAssetOnBlockchain,blockchainQuery} = require('../services/blockchainsrc')
const {addAssetOnBlockchain, blockchainTraceability} = require('../services/bcsrc')
const { addNft } = require('../services/nftService');
const constants = require("../lang/constant");
const Moralis = require("moralis/node");

router.post('/add_asset', authenticateTransaction, validateAssetTransactionId, async (req, res) => {
    // console.log('req.transactionData---',req.validTransactionIdData, '-------',req.transactionData.validTransactionEntityData)
    console.log('req--',req.user)
    const { error } = validateAddAsset(req.body.assets);
    if (error) return req.app.responseHelper.send(res, false, {}, [{ "msg": error.details[0].message}], 500);
    let payloadData = req.body;
    let consumedAsset = []
    if(payloadData.inputAssets){
        consumedAsset = await assetService.consumedAssets(req.validTransactionIdData, req.user, payloadData.inputAssets);        
    }
    let assetArray = await transactionService.producedAssets(req.validTransactionIdData, req.user, consumedAsset);
    const result = await assetService.addAsset(assetArray);
    var responseObj = {  
        'message': SUCCESSMSG[1001],
        result
    }
    if(req.transactionData.validTransactionEntityData.transtypes.epr){
        const eprPayloadData = transactionService.getEPRAssetData(payloadData, req.user);
        if(eprPayloadData.inputEprAssets){
        const eprassetQuantity = await eprAssetService.eprassetQuantity(eprPayloadData)
            // const eprresult = await eprAssetService.addEPRAsset(eprPayloadData);
            var responseObj = {  
                'message': SUCCESSMSG[1001],      
                eprassetQuantity
            }
        }
    }
    // NFT API call
    // let nftData =  await addNft(req.body.nft);
    // console.log('nftData---',nftData)
    // if(nftData){
    //     var responseObj = {  
    //         'message': SUCCESSMSG[1001],
    //         "TxHash": nftData.nft.TxHash,
    //         "Contract_Address":nftData.nft.Contract_Address,    
    //         result,            
    //     }
    // }

    if(responseObj.message =='Transaction added successfully.'){
        let promises=[]
        const fabricsetup = {
            username: req.user.email,
            orgName: req.transactionData.validTransactionEntityData.fabricOrgId
        }
        for(let i = 0;i < responseObj.result.length;i++){
            promises.push(addAssetOnBlockchain(responseObj.result[i], fabricsetup));
        }
       // bcresponse =await addAssetOnBlockchain(responseObj.result[0],fabricsetup);
    }
    return req.app.responseHelper.send(res, true, responseObj, [], 200);
        

    });

    // default get method
router.get('/', async (req, res) => {
    const assetType = req.query && req.query.assetType ? req.query.assetType.split(",") : [];
    req.query.assetType = assetType;
    const { error } = validateGetAssets(req.query);
    if (error) return req.app.responseHelper.send(res, false, {}, [{ "msg": error.details[0].message }], 500);
    req.query.isCorporate = req.user.entity && req.user.entity.toLowerCase() == "corporate";
    req.query.corporateId = req.user.reference.corporateId
    const result = await assetService.getAssets(req.query);
    let responseObj = result;
    responseObj['message'] = SUCCESSMSG[4001];
    
    return req.app.responseHelper.send(res, true, responseObj, [], 200);
}); //getEntityAssets

// router.post('/getQueryString', async(req,res)=>{
//     let fabricsetup = {
//         username: "Ashok",
//         orgName: "Org2"
//     }    
//     let bcresponse = await blockchainTraceability(req.body.selector.Acknowledgement,fabricsetup)
//     return req.app.responseHelper.send(res, true, bcresponse, [], 200);

// });


router.get('/get_entity_assets', async (req, res) => {
    console.log("req:", req.user);
    //const assetType = req.query && req.query.assetType ? req.query.assetType.split(",") : [];
    //req.query.assetType = assetType;
    const { error } = validateGetEntityAssets(req.query);
    if (error) return req.app.responseHelper.send(res, false, {}, [{ "msg": error.details[0].message }], 500);
    req.query.corporateId = req.user.reference.corporateId;
    req.query.entity = req.user.reference.entity;
    const result = await assetService.getEntityAssets(req.query);
    let responseObj = result;
    responseObj['message'] = SUCCESSMSG[4001];

    return req.app.responseHelper.send(res, true, responseObj, [], 200);
});

router.get('/get_assets_list', async (req, res) => {
    const { error } = validateGetAssetsList(req.query);
    if (error) return req.app.responseHelper.send(res, false, {}, [{ "msg": error.details[0].message }], 500);

    const result = await assetService.getAssetsList(req.query);
    let responseObj = result;
    responseObj['message'] = SUCCESSMSG[4001];

    return req.app.responseHelper.send(res, true, responseObj, [], 200);
});

router.get('/updateAsset', async (req, res) => {
    console.log("req.query",req.query)
    const { error } = validateGetAsset(req.query);
    if (error) return req.app.responseHelper.send(res, false, {}, [{ "msg": error.details[0].message }], 500);
    const result = await assetService.updateAssetFromProvenance(req.query);
    let responseObj = result;
    responseObj['message'] = SUCCESSMSG[4001];

    return req.app.responseHelper.send(res, true, responseObj, [], 200);
});



router.get('/:assetObjectId', async (req, res) => {
    req.query.assetObjectId = req.params.assetObjectId;
    req.query.isCorporate = req.user.entity && req.user.entity.toLowerCase() == "corporate";
    const result = await assetService.getAssetFullDetails(req.query);
    if (!result) {
        return req.app.responseHelper.send(res, false, {}, [{ "msg": ERRORMSG[40001] }], 404);
    }
    let responseObj = result;
    responseObj['message'] = SUCCESSMSG[4002];

    return req.app.responseHelper.send(res, true, responseObj, [], 200);
});

router.post('/edit',  async(req, res) => {
    var payloadData = req.body
    
    const result = await assetService.updateData(payloadData);
    if (!result) {
        let errors = [{
            "msg": "Something went wrong!"
        }];
        return req.app.responseHelper.send(res, false, errors, [], 500);
    }
    return req.app.responseHelper.send(res, true, {}, [], 200);

});

router.put('/revokeAsset', async (req, res) => {
    let payloadData = { };
    payloadData = req.body
    payloadData["transactionEntity"] = req.user.reference.code
    payloadData["transactionEntityBranch"] = req.user.reference.branch
    payloadData["assetType"] = { $nin: [constants[1], constants[3]] }
    payloadData["status"]= { $ne: constants[4] }
    const assetCount = await assetService.findAllAsset(payloadData)
    if(assetCount.length){
        let responseObj = {  
            'message': ERRORMSG[104],      
        }
        return req.app.responseHelper.send(res, false, responseObj, [], 200);        
    }
    else{
        payloadData["assetType"] = { $ne: constants[2] }
        let inputAssetDetails = await assetService.findAllAsset(payloadData)
        if(!inputAssetDetails[0].inputAssets){
            const assetresult = await assetService.updateAssetStatus(req.body)
            let responseObj = {  
                'message': SUCCESSMSG[4003],      
                assetresult
            }
            return req.app.responseHelper.send(res, true, responseObj, [], 200);            
        }else {
            const transactionidArr = [];
            const entityArr = inputAssetDetails[0].inputAssets.map((elem) => {
                const inputAssetObj = { "transactionid" : elem.inputAssetId, "entityAsset" : elem.entity_asset, "assetQuantity" : elem.inputAssetQuantity, "assetType" : constants[2], "entity" : payloadData.transactionEntity, "entityBranch" : payloadData.transactionEntityBranch }
                transactionidArr.push(inputAssetObj)
            })
            const assetDetails = await assetService.updateAssetStatus(payloadData)
            payloadData.assetType = { $eq : constants[2] }
            const assetRefDetails = await assetService.updateRefAsset(payloadData , transactionidArr)
            
            let responseObj = {  
                'message': SUCCESSMSG[4003],      
                assetRefDetails
            }
            return req.app.responseHelper.send(res, true, responseObj, [], 200);
        }
    }   
})

router.put('/updateAsset', async (req, res) => {
    let payloadData = { };
    payloadData = req.body
    payloadData["transactionEntity"] = req.user.reference.code
    payloadData["transactionEntityBranch"] = req.user.reference.branch
    payloadData["assetType"] = { $nin: [constants[1], constants[3]] }
    payloadData["status"]= { $ne: constants[4] }
    const assetCount = await assetService.findAllAsset(payloadData)
    if(assetCount.length){
        let responseObj = {  
            'message': ERRORMSG[106],      
        }
        return req.app.responseHelper.send(res, false, responseObj, [], 200);        
    }
    else{
        payloadData["assetType"] = { $in: [constants[1], constants[3]] }
        let inputAssetDetails = await assetService.findAllAsset(payloadData)
        payloadData.status = ""
        const assetresult = await assetService.updateAssetStatus(req.body)
        let responseObj = {};
        if(!inputAssetDetails[0].inputAssets || inputAssetDetails[0].inputAssets.length){
            responseObj = {  
                'message': SUCCESSMSG[4006],      
                assetresult
            }          
        }else{
            const transactionidArr = [];
            const entityArr = payloadData.inputAssets.map((elem) => {
                const inputAssetObj = { "transactionid" : elem.inputAssetId, "entityAsset" : elem.entity_asset, "assetQuantity" : elem.inputAssetQuantity, "assetType" : constants[2], "entity" : payloadData.transactionEntity, "entityBranch" : payloadData.transactionEntityBranch }
                transactionidArr.push(inputAssetObj)
            })
            payloadData.status = ""
            payloadData.assetType = { $eq : constants[2] }
            const assetRefDetails = await assetService.updateRefAsset(payloadData , transactionidArr)            
            responseObj = {  
                'message': SUCCESSMSG[4006],      
                assetRefDetails
            }
        }
        return req.app.responseHelper.send(res, true, responseObj, [], 200);

    }   
})

function validateAddAsset(payloadData) {
    const inputAssetSchema = Joi.object().keys({
        inputAssetId: Joi.string().required().error(() => {
            return {
                message: 'Input asset required',
            }
        }),
        entity_asset: Joi.string().required().error(() => {
            return {
                message: 'Entity asset required',
            }
        }),
        inputAssetQuantity: Joi.number().required().error(() => {
            return {
                message: 'Input asset quantity required',
            }
        }),
        inputAssetUom: Joi.string().required().error(() => {
            return {
                message: 'Input asset Uom required',
            }
        }),
        line_level_fields: Joi.object()
    });
    const schema = Joi.array().items(
        Joi.object({
            assetCategory :Joi.string().required(),
            organizationId: Joi.string().required(),
            moduleCode: Joi.string().required(),
            transtypeCode: Joi.string().required(),
            transactionEntity: Joi.string().required(),
            transactionEntityBranch: Joi.string(),
            transactionEntityType: Joi.string().required().valid(['Organization', 'Partner']),
            refEntity: Joi.string().required(),
            refEntityBranch: Joi.string(),
            refEntityType: Joi.string().required().valid(['Organization', 'Partner']),
            assetName: Joi.string().required(),
            assetId: Joi.string(),
            entityAsset: Joi.string(),
            transactionid: Joi.string(),
            location: Joi.string(),
            geolocation: Joi.object(),
            assetType: Joi.string(),
            inputAssets: Joi.array().items(inputAssetSchema),
            assetQuantity: Joi.number().required(),
            assetUom: Joi.string().required(),
            expiryDate: Joi.string(),
            effectiveDate: Joi.string(),
            provenance:Joi.boolean(),
            fields: Joi.object(),
            upload_file: Joi.string(),
            upload_certificate: Joi.string(),
            status: Joi.string().required().valid(['New','Revoked'])
        }).required(),
        Joi.array().items(
            Joi.object({
                inputAssets: Joi.array().items(inputAssetSchema),
            })
        )
    )
    return Joi.validate(payloadData, schema);
}

router.get('/nft/viewNFT', async (req, res) => {
   const tokenID= req.query.token_id;
   console.log("tokenID:",tokenID);
    const serverUrl = "https://eqxugfz0wz58.usemoralis.com:2053/server";
    const appId = "2Jzu9dpAnThpkrdwcfC6FlSNDKS6wq2rNzN5CEWQ";
    const moralisSecret = "T1dQqV7bq4vkhgJNd6XJZ6M91UwHav7a8sUIcTtGnS8CmaVjRJxmaniirES4GiVO";
    
   
      await Moralis.start({ serverUrl, appId, moralisSecret });
    
    //   const price = await Moralis.Web3API.token.getTokenPrice({
    //     address: "0xe9e7cea3dedca5984780bafc599bd69add087d56",
    //     chain: "bsc",
    //   });

    const options = {
        address: "0x4B61FB7b4a09ccED53aE1BAAebBDF4B612b5a97d",
        token_id: tokenID,
        chain: "mumbai",
      };
    //   const tokenIdOwners = await Moralis.Web3API.token.getTokenIdOwners(options);
      const tokenIdOwners = await Moralis.Web3API.token.getWalletTokenIdTransfers(options);
      
      console.log("tokenIdOwners:",tokenIdOwners);  
    //   return tokenIdOwners;
    return req.app.responseHelper.send(res, true, tokenIdOwners, [], 200);

});

function validateGetAssets(payloadData) {
    const schema = {
        transactionEntity: Joi.string().required(),
        transactionid: Joi.string(),
        organizationId: Joi.string(),
        transactionTypeCode: Joi.string(),
        startIndex: Joi.string(),
        limit: Joi.string(),
        assetType: Joi.array().items(Joi.string()),
        allFields: Joi.boolean(),
        assetId: Joi.string().allow(''),
        assetName: Joi.string().allow(''),
        moduleId: Joi.string().allow(''),
        moduleName: Joi.string().allow(''),
        transactionTypeName: Joi.string().allow(''),
        transactionTypeCode: Joi.string().allow(''),
        assetLocation: Joi.string(),
        assetTransactionId: Joi.string(),
        branchLocation: Joi.string(),
        assetCategory: Joi.string(),
        inputAssetFlag: Joi.string(),
        status: Joi.string(),
        searchKey: Joi.string(),
        sortKey: Joi.string().allow(''),
        sortOrder: Joi.string().valid(["ASC", "DESC", ""]).insensitive(),
        statusFlag: Joi.string().allow(''),

    }
    return Joi.validate(payloadData, schema);
}

function validateGetEntityAssets(payloadData) {
    const schema = {
        _id: Joi.string(),
        transactionEntity: Joi.string().required(),
        transactionEntityBranch: Joi.string(),
        organizationId: Joi.string(),
        assetCategory: Joi.string(),
        assetCategoryId: Joi.string(),
        startIndex: Joi.string(),
        limit: Joi.string(),
       // assetType: Joi.array().items(Joi.string()),
        allFields: Joi.boolean(),
        assetId: Joi.string().allow(''),
        assetName: Joi.string().allow(''),
        transactionEntityName: Joi.string().allow(''),
        assetType: Joi.string().allow(''),
        assetTransactionId: Joi.string(),
        assetLocation: Joi.string(),
        searchKey: Joi.string(),
        sortKey: Joi.string().allow(''),
        sortOrder: Joi.string().valid(["ASC", "DESC", ""]).insensitive(),
        getAllBalancedQuantity: Joi.boolean(),
        assetStatus: Joi.string(),
        provenance: Joi.string(),
        inputAssetSearch_key: Joi.string(),
        nftFlag:Joi.string(),
    }
    return Joi.validate(payloadData, schema);
}

function validateGetAssetsList(payloadData) {
    const schema = {
        _id: Joi.string(),
        transactionEntity: Joi.string(),
        organizationId: Joi.string(),
        startIndex: Joi.string(),
        limit: Joi.string(),
       // assetType: Joi.array().items(Joi.string()),
        allFields: Joi.boolean(),
        assetId: Joi.string().allow(''),
        assetName: Joi.string().allow(''),
        transactionEntityName: Joi.string().allow(''),
        assetType: Joi.string().allow(''),
        assetTransactionId: Joi.string(),
        assetLocation: Joi.string(),
        sortKey: Joi.string().allow(''),
        sortOrder: Joi.string().valid(["ASC", "DESC", ""]).insensitive(),
        getAllBalancedQuantity: Joi.boolean()
    }
    return Joi.validate(payloadData, schema);
}

function validateGetAsset(payloadData) {
    const schema = {
        transactionId: Joi.string(),
        nft_status: Joi.string(),
        nftDetails: Joi.string().allow(''),
    }
    return Joi.validate(payloadData, schema);
}


module.exports = router;