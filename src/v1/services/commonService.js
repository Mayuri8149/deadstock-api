const AWS = require('aws-sdk');
const assetCategoryService = require('../services/assetCategoryService');
const assetService = require('../services/assetService');
const organizationModel= require("../../../routes/v1/organization/model")
const {blockchainTraceability} = require('../services/bcsrc');
const moment = require('moment-timezone');



const getFileOnS3 = async (bucketName,keyName) =>{
    AWS.config.update({
        accessKeyId: global.config.awsDetails.accessKeyId,
        secretAccessKey: global.config.awsDetails.secretAccessKey,
        region: global.config.awsDetails.region,
        signatureVersion: global.config.awsDetails.signatureVersion
    });

    var s3 = new AWS.S3();
    const signedUrlExpireSeconds = 60 * 5

    var options = {
        Bucket: bucketName,
        Key:keyName
    };
    return new Promise((resolve, reject) => {
        var file = s3.getObject(options,async function (err, data) {
            if (err) {
                reject(err)  
            return
            } else {
                resolve(data)
            }
      })
    });
}
const uploadFileOnS3 = async (bucketName,keyName,fileContent, contentType) =>{
    let s3bucket = new AWS.S3({
        accessKeyId: global.config.awsDetails.accessKeyId,
        secretAccessKey: global.config.awsDetails.secretAccessKey,
        region: global.config.awsDetails.region,
        signatureVersion: global.config.awsDetails.signatureVersion
    });
    return await new Promise((resolve, reject) => {
            var params = {
                Bucket: bucketName,
                Key: keyName,
                Body:fileContent,    
                ACL: 'public-read',
                ContentEncoding: 'base64',
                region: global.config.awsDetails.region,
                ContentDisposition:"inline",
                ContentType : contentType,
            };
            s3bucket.upload(params, function (err, data) {
                console.log("data",data)
                if (err) {
                    reject(err)  
                    return
                }else{
                    resolve(data)
                }
            });  
    });    
}

const replaceStrValues = async (read_and_edit_me,payLoad,awsPath,traceabilityResult,filteredTransTypeSetupDetails) =>{
       const awsImgPath= "https://tracechain.s3.ap-south-1.amazonaws.com/";
       const payLoadObj = {
           organizationId: payLoad.organizationId,
           limit:'2000'
       }
       const resultAssetCategory = await assetCategoryService.getAssets(payLoadObj);
       let assetCatListArr = [];
       for (var i = 0; i < resultAssetCategory.result.length; i++) {
         if(resultAssetCategory.result[i].assetCategory!=undefined){
           assetCatListArr[resultAssetCategory.result[i]._id]=resultAssetCategory.result[i];
         }            
       }
       //BOF-Header Part---------------------------------
       const resultOrg = await organizationModel.findOrganizationById(payLoad.organizationId);
       let strReplaceAssetLogo;
       if(resultOrg.logo!=undefined){
          // strReplaceAssetLogo =  awsImgPath+"Logo/"+resultOrg.logo;
          strReplaceAssetLogo =  '<img src="'+awsImgPath+"Logo/"+resultOrg.logo+'" class="d-inline-block align-top header-logo" alt="" style="height: 40px !important;"></img>'
       }else{
           strReplaceAssetLogo =  "";
       }
       const strReplaceWithAssetLogo= "_@_logo_@_";   
       read_and_edit_me = read_and_edit_me.replace(strReplaceWithAssetLogo, strReplaceAssetLogo);
       let strReplaceAssetImg;
       if(payLoad.assetDetails.upload_file!=undefined){        
               const uploadStaticHeaderSplit= payLoad.assetDetails.upload_file.split(".")[1];
               const headerPath =  awsImgPath+"transactions/static-media/"+payLoad.assetDetails.upload_file;
               if(uploadStaticHeaderSplit=="pdf"){
                   strReplaceAssetImg ='<iframe src="'+headerPath+'" frameBorder="0" scrolling="auto" height="100%" width="100%"></iframe>';
               }else{
                   strReplaceAssetImg ='<img src="'+headerPath+'" alt="'+payLoad.assetDetails.upload_file+'" style="width: 100%;"></img>';
               }
          // strReplaceAssetImg =  awsImgPath+"transactions/static-media/"+payLoad.assetDetails.upload_file;
       }else{
          // const headerPath =  awsPath+"/static-media/oliveoil_bottles.png";
           //strReplaceAssetImg = '<img src="'+headerPath+'" alt="" style="width: 90px;"></img>';
           strReplaceAssetImg = '';
       }
       
       const strReplaceWithAssetImg= "_@_imgHeader_@_";                                     
       read_and_edit_me = read_and_edit_me.replace(strReplaceWithAssetImg, strReplaceAssetImg);
   
       const strReplaceAssetImgName =  payLoad.assetDetails.assetName;
       const strReplaceWithAssetImgName= "_@_imgNameHeader__@";                                     
       read_and_edit_me = read_and_edit_me.replace(strReplaceWithAssetImgName, strReplaceAssetImgName);
       
       const strReplaceAssName =  payLoad.assetDetails.assetName;
       const strReplaceWithAssName= "_@_assName_@_";                                     
       read_and_edit_me = read_and_edit_me.replace(strReplaceWithAssName, strReplaceAssName);
       
       const strReplaceAssetName =  payLoad.assetDetails.assetName;
       const strReplaceWithAssetName= "_@_assetName_@_";                                     
       read_and_edit_me = read_and_edit_me.replace(strReplaceWithAssetName, strReplaceAssetName);
       
       const strReplaceAssetId =  payLoad.assetDetails.assetId;
       const strReplaceWithAssetId= "_@_assetId_@_";                                     
       read_and_edit_me = read_and_edit_me.replace(strReplaceWithAssetId, strReplaceAssetId);

         
       const strReplaceTransactionEntity =  payLoad.assetDetails.transactionEntityDetails.name;
       const strReplaceWithTransactionEntity= "_@_transactionEntity_@_";                                     
       read_and_edit_me = read_and_edit_me.replace(strReplaceWithTransactionEntity, strReplaceTransactionEntity);
   
       const strReplaceAssetLocation = payLoad.assetDetails.location?payLoad.assetDetails.location:'-';
       const strReplaceWithAssetLocation= "_@_assetLocation_@_";                                     
       read_and_edit_me = read_and_edit_me.replace(strReplaceWithAssetLocation, strReplaceAssetLocation);
   
       let isEffectiveDateFlag=false;
       let isExpiryDateFlag=false;
       if(filteredTransTypeSetupDetails!=undefined){
        filteredTransTypeSetupDetails.map( async (ele,index) => { 
          
            if(ele.transactionTypeCode==payLoad.assetDetails.transtypeCode){
                if(ele.isEffectiveDate==undefined || ele.isEffectiveDate==false){
                    isEffectiveDateFlag=false
                }else{
                    isEffectiveDateFlag=true
                }
                if(ele.isExpiryDate===undefined || ele.isExpiryDate==false){
                    isExpiryDateFlag=false
                }else{
                    isExpiryDateFlag=true
                }
            }  

        });
       }
                       
       let effDate;
       let effDateSplit;
       if(payLoad.assetDetails.effectiveDate!=undefined){
           effDate =payLoad.assetDetails.effectiveDate;
           const effDateSplit1=effDate.toISOString().split('T')[0]
           const effDateSplitSplit=effDateSplit1.split('-')
           const effDateSplitSplitNew=effDateSplitSplit[2]+"/"+effDateSplitSplit[1]+"/"+effDateSplitSplit[0];
           effDate="Manufacturing Date - "+effDateSplitSplitNew;
       }
       const strReplaceEffectiveDate =  effDate && isEffectiveDateFlag==true?effDate:'';
       const strReplaceWithEffectiveDate= "_@_effectiveDate_@_"; 
       read_and_edit_me = read_and_edit_me.replace(strReplaceWithEffectiveDate, strReplaceEffectiveDate);
   
       let exDate;
       let exDateSplit;
       if(payLoad.assetDetails.expiryDate!=undefined){
           const exDate1 =payLoad.assetDetails.expiryDate;
           exDateSplit=exDate1.toISOString().split('T')[0]
           const exDateSplitSplit=exDateSplit.split('-')
           const exDateSplitSplitNew=exDateSplitSplit[2]+"/"+exDateSplitSplit[1]+"/"+exDateSplitSplit[0];
           exDate="Expiry Date - "+exDateSplitSplitNew;
        }
       const strReplaceExpiryDate =  exDate && isExpiryDateFlag==true?exDate:'';
       const strReplaceWithExpiryDate= "_@_expiryDate_@_";                                     
       read_and_edit_me = read_and_edit_me.replace(strReplaceWithExpiryDate, strReplaceExpiryDate);

        let fieldArrHtml = []
        if(payLoad.assetDetails.fields!=undefined){
            const keysValue = Object.keys(payLoad.assetDetails.fields);
            const valueObj = Object.values(payLoad.assetDetails.fields);
            keysValue.map( async(eleField, indexField) => { 
                fieldArrHtml[indexField]="";
                fieldArrHtml[indexField]=fieldArrHtml[indexField]+'<p class="intro-text-two">'+keysValue[indexField]+' - '+valueObj[indexField]+'</p>';
            }) 
        }
        const strReplaceHeaderDynamic =  fieldArrHtml.join("");
        const strReplaceWithHeaderDynamic= "_@_dynamicFields_@_";                                     
        read_and_edit_me = read_and_edit_me.replace(strReplaceWithHeaderDynamic, strReplaceHeaderDynamic);
       //EOF-Header Part---------------------------------
       
       //BOF-JS CSS Images Part---------------------------------
       
       const strReplaceCSS =  awsPath+"/main.css";
       const strReplaceWithCSS= "main.css";                                     
       read_and_edit_me = read_and_edit_me.replace(strReplaceWithCSS, strReplaceCSS);
   
       const strReplaceJS =  awsPath+"/main.js";
       const strReplaceWithJS= "main.js";                                     
       read_and_edit_me = read_and_edit_me.replace(strReplaceWithJS, strReplaceJS);
   
       const search = "assets/"
       const replacer = new RegExp(search, 'g')
       read_and_edit_me = read_and_edit_me.replace(replacer, awsPath+"/assets/");
       //EOF-JS CSS Images Part---------------------------------
   
       //BOF-Traceability
   
   
       let selectedTransactArr = [];
       let selectedArr = [];
       let tracebilityPortion=[];
       let tracebilityCert=[];
       let inputAssNameArr=[];
       let inputAssetShowArr=[];
       let inputAssArr=[];
       let tracebilityLoc = [];
       let tracebilityGeoLoc= [];
       let tracebilityQty = [];
       let finalSqArr = [];
       let newArr= [];
       let tracebilityCreated=[];
       let extrafieldArr= [];
       let displayMediaArr=[];
       const resultAssetList = await assetService.getAssetsList(payLoadObj);
       resultAssetList.map( async(eleAsset, indexAsset) => { 
           inputAssNameArr[eleAsset.entityAsset]=eleAsset;
       });
       if(traceabilityResult!=null){
              traceabilityResult.map( async(eleTrans, indexTrans) => { 
                    if(eleTrans.assetType=="Produce Asset"){
                        tracebilityCreated[eleTrans.transtypeCode]=eleTrans.created_on
                    }else{
                        tracebilityCreated[eleTrans.transtypeCode]=eleTrans.created_on
                    }

                    if(eleTrans.extrainfo_fields!=undefined){
                        const keysValue = Object.keys(eleTrans.extrainfo_fields);
                        const valueObj = Object.values(eleTrans.extrainfo_fields);
                        let dynField= [];
                        let dynFieldText= [];
                        for(var i = 0; i < keysValue.length; i++) {
                          if(valueObj[i]!=undefined){
                           let fileNameDb = valueObj[i];
                           if(fileNameDb!=undefined){
                            dynFieldText[keysValue[i]]=valueObj[i];
                            extrafieldArr[eleTrans.transtypeCode]=dynFieldText;
                            const fileNameDbSplits=fileNameDb.toString().split('___')[1];
                            if(fileNameDbSplits!=undefined){
                              const fileNameDbSplit= fileNameDbSplits.toString().split(".")[1];
                                if(fileNameDbSplit=='pdf' || fileNameDbSplit=='png' || fileNameDbSplit=='jpg' || fileNameDbSplit=='jpeg'){
                                  dynField[keysValue[i]]=valueObj[i];
                                  displayMediaArr[eleTrans.transtypeCode]=dynField;
                                }else{
                                }
                            }else{
                              dynFieldText[keysValue[i]]=valueObj[i];
                              extrafieldArr[eleTrans.transtypeCode]=dynFieldText;
                            }
                          }
                         
                          }
                          
                        }
                      }


                   if(eleTrans.upload_cert!=''){
                       tracebilityCert[eleTrans.transtypeCode]=eleTrans.upload_cert
                   }

                   if(eleTrans.location!=''){
                       tracebilityLoc[eleTrans.transtypeCode]=eleTrans.location
                       tracebilityGeoLoc[eleTrans.transtypeCode]=eleTrans.geolocation
                   }
                 
                   if(eleTrans.inputAssets!=null && eleTrans.inputAssets!==undefined && eleTrans.inputAssets.length>0){
                        eleTrans.inputAssets.transtypeCode=eleTrans.transtypeCode;
                        inputAssetShowArr[eleTrans.transtypeCode]=eleTrans.inputAssets;
                        tracebilityQty[eleTrans.transtypeCode]=eleTrans.quantity
                   }else if(eleTrans.assetType=="Produce Asset"){
                        tracebilityQty[eleTrans.transtypeCode]=eleTrans.quantity
                    }
                   
               }); 
                //    if(inputAssetShowArr!==undefined){ 
                //        inputAssetShowArr.forEach(async (inputEle,indexInput) => { 
                //            if(inputAssNameArr[inputEle.inputAssetId]!=undefined){
                //                inputEle.inputAssetId=inputAssNameArr[inputEle.inputAssetId].assetName;
                //            } 
                //            inputAssArr[inputAssetShowArr.transtypeCode]=inputEle;
                //            inputAssNameArr.push(inputEle);
                //        });
                //    }
                if(inputAssetShowArr!==undefined){ 
                    const keysTrasactionCode = Object.keys(inputAssetShowArr);
                    keysTrasactionCode.forEach(async (transactionCode,index) => { 
                      inputAssetShowArr[transactionCode].forEach(async (inputEle,indexInput) => { 
                        if(inputAssNameArr[inputEle.inputAssetId]!=undefined){
                            inputEle.inputAssetId=inputAssNameArr[inputEle.inputAssetId].assetName;
                        } 
                          inputAssArr[inputAssetShowArr[transactionCode].transtypeCode]=inputEle;
                          inputAssNameArr[transactionCode]=inputEle
                          //inputAssNameArr.push(inputElement);
                      });
                    });
                   
                  }
       }
      if(filteredTransTypeSetupDetails!=undefined){
            filteredTransTypeSetupDetails.map( async (element,ind) => {                       
                if(traceabilityResult!=null && traceabilityResult!==undefined){
                    traceabilityResult.map((elm, index) => {  
                        if(elm.transtypeCode==element.transactionTypeCode){
                            if(extrafieldArr[elm.transtypeCode]!=undefined){
                                elm.extrainfo_fields=extrafieldArr[elm.transtypeCode]
                            }
                            let index1 = traceabilityResult.findIndex(x => x.transtypeCode === element.transactionTypeCode && element.label!='');
                            if(index1!=-1){
                                newArr.push(index1);
                                selectedTransactArr[index1] = elm;
                            }
                            selectedArr[elm.transtypeCode] = {
                                transactionTypeCode:element.transactionTypeCode,
                                label :element.label===undefined?"":element.label,
                                isAssetCategory :element.isAssetCategory===undefined?false:element.isAssetCategory,
                                isAssetName :element.isAssetName===undefined?false:element.isAssetName,
                                isAssetLocation:element.isAssetLocation===undefined?false:element.isAssetLocation,
                                isEffectiveDate: element.isEffectiveDate===undefined?false:element.isEffectiveDate,
                                isExpiryDate: element.isExpiryDate===undefined?false:element.isExpiryDate,
                                isBranch: element.isBranch===undefined?false:element.isBranch,
                                isQuantity: element.isQuantity===undefined?false:element.isQuantity,
                                isUom: element.isUom===undefined?false:element.isUom,
                                fields:element.fields,
                                isTransactionType:element.isTransactionType===undefined?false:element.isTransactionType,
                                isInputAsset:element.isInputAsset===undefined?false:element.isInputAsset,
                                isCert:true,
                            };         
                        
                        }               
                    });
                }
        });
      }
       
      newArr = newArr.filter((el, i, a) => i === a.indexOf(el))
      newArr.map(async(elmA, indexA)=>{
        if(selectedTransactArr[elmA]!=undefined){
          finalSqArr[indexA]=selectedTransactArr[elmA]
        }
      });
       let mapHtml=[];
       finalSqArr.forEach( async (item,index) => { 
            if(tracebilityGeoLoc[item.transtypeCode]!=undefined && tracebilityGeoLoc[item.transtypeCode].longitude!=undefined && tracebilityGeoLoc[item.transtypeCode].latitude!=undefined && tracebilityGeoLoc[item.transtypeCode].formattedAddress!=undefined){
                    mapHtml[index]="";
                    mapHtml[index]=mapHtml[index]+' <input type="text" class="class_longitude" value="'+tracebilityGeoLoc[item.transtypeCode].longitude+'" hidden>';
                    mapHtml[index]=mapHtml[index]+' <input type="text" class="class_latitude" value="'+tracebilityGeoLoc[item.transtypeCode].latitude+'" hidden>';
                    mapHtml[index]=mapHtml[index]+' <input type="text" class="class_assetLocation" value="'+tracebilityGeoLoc[item.transtypeCode].formattedAddress+'" hidden>';
            }
               tracebilityPortion[index]="";
               tracebilityPortion[index]=tracebilityPortion[index]+'<div class="info-boxes"><div class="circle"></div><div class="sourcing-info box arrow-left"><div class="head"><p class="box-title">'+selectedArr[item.transtypeCode].label+'</p></div>';
               tracebilityPortion[index]=tracebilityPortion[index]+'<div class="info-box"><hr>';
               if(selectedArr[item.transtypeCode].isAssetCategory){
                   if(assetCatListArr[item.assetCategory]!=undefined)
                       tracebilityPortion[index]=tracebilityPortion[index]+'<div class="row details_row"><div class="col-lg-6 col-md-6 col-sm-6 product_lbl">Asset Category:</div><div class="col-lg-6 col-md-6 col-sm-6 text-right product_desc">'+assetCatListArr[item.assetCategory].assetCategory+'</div></div>';
                   else
                       tracebilityPortion[index]=tracebilityPortion[index]+'<div class="row details_row"><div class="col-lg-6 col-md-6 col-sm-6 product_lbl">Asset Category:</div><div class="col-lg-6 col-md-6 col-sm-6 text-right product_desc">-</div></div>';
               }   
               if(selectedArr[item.transtypeCode].isAssetName)
                   tracebilityPortion[index]=tracebilityPortion[index]+'<div class="row details_row"><div class="col-lg-6 col-md-6 col-sm-6 product_lbl">Asset Name:</div><div class="col-lg-6 col-md-6 col-sm-6 text-right product_desc">'+item.assetName+' - '+item.assetId+'</div></div>';
               if(selectedArr[item.transtypeCode].isBranch){
                   if(item.corporateDetails[0]!=undefined){
                        tracebilityPortion[index]=tracebilityPortion[index]+'<div class="row details_row"><div class="col-lg-6 col-md-6 col-sm-6 product_lbl">Entity Name:</div><div class="col-lg-6 col-md-6 col-sm-6 text-right product_desc">'+item.corporateDetails[0].companyName+'</div></div>';
                   }else{
                        tracebilityPortion[index]=tracebilityPortion[index]+'<div class="row details_row"><div class="col-lg-6 col-md-6 col-sm-6 product_lbl">Entity,Branch Name:</div><div class="col-lg-6 col-md-6 col-sm-6 text-right product_desc">'+item.organizations_details[0].name+','+item.branchDetails[0].branch_location+'</div></div>';
                   }
                }
                   
               if(selectedArr[item.transtypeCode].isEffectiveDate){
                   let effDateTrace;
                   if(item.effectiveDate!=undefined){
                       effDateTrace=item.effectiveDate;
                       const convertedEffectiveDate=moment(effDateTrace);	
                       const effDateTraceSplitNew = convertedEffectiveDate.tz("UTC").format('DD/MM/YYYY');
                       tracebilityPortion[index]=tracebilityPortion[index]+'<div class="row details_row"><div class="col-lg-6 col-md-6 col-sm-6 product_lbl">Manufacturing Date:</div><div class="col-lg-6 col-md-6 col-sm-6 text-right product_desc">'+effDateTraceSplitNew+'</div></div>';
                   }else{
                       tracebilityPortion[index]=tracebilityPortion[index]+'<div class="row details_row"><div class="col-lg-6 col-md-6 col-sm-6 product_lbl">Manufacturing Date:</div><div class="col-lg-6 col-md-6 col-sm-6 text-right product_desc">-</div></div>';
                   }
               }
                   
               if(selectedArr[item.transtypeCode].isExpiryDate){
                   let expDateTrace;
                   if(item.expiryDate!=undefined){
                       expDateTrace=item.expiryDate;
                       const convertedExpDate=moment(expDateTrace);	
                       const expDateTraceNew = convertedExpDate.tz("UTC").format('DD/MM/YYYY');
                       tracebilityPortion[index]=tracebilityPortion[index]+'<div class="row details_row"><div class="col-lg-6 col-md-6 col-sm-6 product_lbl">Expiry Date:</div><div class="col-lg-6 col-md-6 col-sm-6 text-right product_desc">'+expDateTraceNew+'</div></div>';
                   }else{
                       tracebilityPortion[index]=tracebilityPortion[index]+'<div class="row details_row"><div class="col-lg-6 col-md-6 col-sm-6 product_lbl">Expiry Date:</div><div class="col-lg-6 col-md-6 col-sm-6 text-right product_desc">-</div></div>';
                   }
               }
               
               if(selectedArr[item.transtypeCode].isAssetLocation){
                   if(tracebilityLoc[item.transtypeCode]){
                       tracebilityPortion[index]=tracebilityPortion[index]+'<div class="row details_row"><div class="col-lg-6 col-md-6 col-sm-6 product_lbl">Asset Location:</div><div class="col-lg-6 col-md-6 col-sm-6 text-right product_desc">'+tracebilityLoc[item.transtypeCode]+'</div></div>';
                   }else{
                       tracebilityPortion[index]=tracebilityPortion[index]+'<div class="row details_row"><div class="col-lg-6 col-md-6 col-sm-6 product_lbl">Asset Location:</div><div class="col-lg-6 col-md-6 col-sm-6 text-right product_desc">-</div></div>';
                   }
                   
               }
                   
               if(selectedArr[item.transtypeCode].isQuantity){
                   if(tracebilityQty[item.transtypeCode]!=undefined){
                       tracebilityPortion[index]=tracebilityPortion[index]+'<div class="row details_row"><div class="col-lg-6 col-md-6 col-sm-6 product_lbl">Quantity:</div><div class="col-lg-6 col-md-6 col-sm-6 text-right product_desc">'+tracebilityQty[item.transtypeCode]+'</div></div>';
                   }else{
                       tracebilityPortion[index]=tracebilityPortion[index]+'<div class="row details_row"><div class="col-lg-6 col-md-6 col-sm-6 product_lbl">Quantity:</div><div class="col-lg-6 col-md-6 col-sm-6 text-right product_desc">'+item.quantity+'</div></div>';
                   }
                  // tracebilityPortion[index]=tracebilityPortion[index]+'<div class="row details_row"><div class="col-lg-6 col-md-6 col-sm-6 product_lbl">Quantity:</div><div class="col-lg-6 col-md-6 col-sm-6 text-right product_desc">'+item.quantity+'</div></div>';
               }
                   
               if(selectedArr[item.transtypeCode].isUom)
                   tracebilityPortion[index]=tracebilityPortion[index]+'<div class="row details_row"><div class="col-lg-6 col-md-6 col-sm-6 product_lbl">UOM:</div><div class="col-lg-6 col-md-6 col-sm-6 text-right product_desc">'+item.uom+'</div></div>';
               if(selectedArr[item.transtypeCode].isTransactionType){
                   if(item.transtype[0]!=undefined)
                       tracebilityPortion[index]=tracebilityPortion[index]+'<div class="row details_row"><div class="col-lg-6 col-md-6 col-sm-6 product_lbl">Transaction Type Name:</div><div class="col-lg-6 col-md-6 col-sm-6 text-right product_desc">'+item.transtype[0].transactionTypeName+'</div></div>';
                   else
                       tracebilityPortion[index]=tracebilityPortion[index]+'<div class="row details_row"><div class="col-lg-6 col-md-6 col-sm-6 product_lbl">Transaction Type Name:</div><div class="col-lg-6 col-md-6 col-sm-6 text-right product_desc">-</div></div>';
               }
   
               if(selectedArr[item.transtypeCode].isInputAsset){
                   if(inputAssArr[item.transtypeCode]!=undefined){
                       tracebilityPortion[index]=tracebilityPortion[index]+'<div class="row details_row"><div class="col-lg-6 col-md-6 col-sm-6 product_lbl">Input Asset Name:</div><div class="col-lg-6 col-md-6 col-sm-6 text-right product_desc">';
                       tracebilityPortion[index]=tracebilityPortion[index]+'<div class="tooltip inputAssetTooltip"><i class="fa fa-ellipsis-v" title="I/p Asset Name"></i><span class="tooltiptext"><ul>';
                       let tracebilityPortion1 = [];
                       inputAssetShowArr[item.transtypeCode].forEach( async (inputEle,index) => { 
                           if(inputEle!=undefined){
                               tracebilityPortion1[index]="";
                               tracebilityPortion1[index]=tracebilityPortion1[index]+'<li>'+inputEle.inputAssetId;
                               if(selectedArr[item.transtypeCode].isQuantity)
                                    tracebilityPortion1[index]=tracebilityPortion1[index]+'-Qty('+inputEle.inputAssetQuantity+'),';
                               if(selectedArr[item.transtypeCode].isUom)
                                    tracebilityPortion1[index]=tracebilityPortion1[index]+'UOM('+inputEle.inputAssetUom+')';
                               tracebilityPortion1[index]=tracebilityPortion1[index]+'</li>';
                           }
                       });
                       tracebilityPortion[index]=tracebilityPortion[index]+tracebilityPortion1;
                       tracebilityPortion[index]=tracebilityPortion[index]+'</ul></div></div></div>';
                   }else{
                       tracebilityPortion[index]=tracebilityPortion[index]+'<div class="row details_row"><div class="col-lg-6 col-md-6 col-sm-6 product_lbl">Input Asset Name:</div><div class="col-lg-6 col-md-6 col-sm-6 text-right product_desc">-</div></div>';
                   }
               }
                  
               if(selectedArr[item.transtypeCode].fields !==undefined){
                   selectedArr[item.transtypeCode].fields.forEach( async (subItem,ind) => { 
                       let dynamicValue;
                       if(subItem!=undefined && item.extrainfo_fields!=undefined && item.extrainfo_fields[subItem.key]!="" ){
                           dynamicValue=item.extrainfo_fields[subItem.key];
                       }else{
                           dynamicValue='-';
                       }
                       if(dynamicValue!=undefined && subItem!=undefined){
                            tracebilityPortion[index]=tracebilityPortion[index]+'<div class="row details_row"><div class="col-lg-6 col-md-6 col-sm-6 product_lbl">'+subItem.key+':</div><div class="col-lg-6 col-md-6 col-sm-6 text-right product_desc">'+dynamicValue+'</div></div>'; 
                       }else if(subItem!=undefined){
                            tracebilityPortion[index]=tracebilityPortion[index]+'<div class="row details_row"><div class="col-lg-6 col-md-6 col-sm-6 product_lbl">'+subItem.key+':</div><div class="col-lg-6 col-md-6 col-sm-6 text-right product_desc"> - </div></div>';
                       }
                       
                   })
               }  
               
            //    if(item.created_on!=undefined){
            //       var event = new Date(item.created_on);
            //      timeDateTrace=item.created_on;
            //      const convertedCreatedDate=moment(timeDateTrace);	
            //      const dateNew = convertedCreatedDate.tz("UTC").format('DD/MM/YYYY hh:mm:ss A');
            //      tracebilityPortion[index]=tracebilityPortion[index]+'<div class="row details_row"><div class="col-lg-6 col-md-6 col-sm-6 product_lbl">Transaction Date:</div><div class="col-lg-6 col-md-6 col-sm-6 text-right product_desc">'+dateNew+'</div></div>';
            //    }else{
            //        tracebilityPortion[index]=tracebilityPortion[index]+'<div class="row details_row"><div class="col-lg-6 col-md-6 col-sm-6 product_lbl">Transaction Date:</div><div class="col-lg-6 col-md-6 col-sm-6 text-right product_desc">-</div></div>';
            //    } 
            
            if(tracebilityCreated[item.transtypeCode]!=undefined){
                var event = new Date(tracebilityCreated[item.transtypeCode]);
                timeDateTrace=tracebilityCreated[item.transtypeCode];
                const convertedCreatedDate=moment(timeDateTrace);	
                const dateNew = convertedCreatedDate.tz("UTC").format('DD/MM/YYYY hh:mm:ss A');
                tracebilityPortion[index]=tracebilityPortion[index]+'<div class="row details_row"><div class="col-lg-6 col-md-6 col-sm-6 product_lbl">Transaction Date:</div><div class="col-lg-6 col-md-6 col-sm-6 text-right product_desc">'+dateNew+'</div></div>';
             }else{
                tracebilityPortion[index]=tracebilityPortion[index]+'<div class="row details_row"><div class="col-lg-6 col-md-6 col-sm-6 product_lbl">Transaction Date:</div><div class="col-lg-6 col-md-6 col-sm-6 text-right product_desc">-</div></div>';
             }
                   if(tracebilityCert[item.transtypeCode]!=undefined){
                       const uploadCertSplit= tracebilityCert[item.transtypeCode].split(".")[1];
                    //   const pathCert=awsImgPath+"transactions/certificates/"+tracebilityCert[item.transtypeCode]+"#toolbar=0";
                   
                        if(uploadCertSplit=="pdf" && tracebilityCert[item.transtypeCode]!=undefined){
                           const pathCert=awsImgPath+"transactions/certificates/"+tracebilityCert[item.transtypeCode]+"#toolbar=0";
                          // const pathCert="https://drive.google.com/viewerng/viewer?embedded=true&url="+awsImgPath+"transactions/certificates/"+tracebilityCert[item.transtypeCode]+"#toolbar=0";
                          // tracebilityPortion[index]=tracebilityPortion[index]+'<object data="'+pathCert+'" type="application/pdf" width="100%" height="400px"><iframe src="'+pathCert+'" id="iframe'+index+'" frameBorder="0" style="border:none !important;" scrolling="auto" height="400px" width="100%"></iframe></object>';
                          tracebilityPortion[index]=tracebilityPortion[index]+'<embed src="'+pathCert+'" width="100%" height="400px"></embed>';
                       }else if(tracebilityCert[item.transtypeCode]!=""){
                           const pathCert=awsImgPath+"transactions/certificates/"+tracebilityCert[item.transtypeCode];
                           tracebilityPortion[index]=tracebilityPortion[index]+'<div class="row details_row"><img src="'+pathCert+'" class="imgPlaceholder" style="width: 100%;"></div>';
                       }
                   }
               //}
               tracebilityPortion[index]=tracebilityPortion[index]+'</div></div></div>';
        });
       const strReplaceTrace =  tracebilityPortion.join("");
       const strReplaceWithtrace= "_@_traceability_@_";                                     
       read_and_edit_me = read_and_edit_me.replace(strReplaceWithtrace, strReplaceTrace);
        const strReplaceMap =  mapHtml.join("");
        const strReplaceWithMap= "_@_inputhidden_@_";                                     
        read_and_edit_me = read_and_edit_me.replace(strReplaceWithMap, strReplaceMap);
    //EOF-Map Part---------------------------------
       //EOF-Traceability
       return await read_and_edit_me;
   }
   

const createPayload = async (reqBody,assetTraceSetupDetails) =>{
    let transactionCode= []
    if(assetTraceSetupDetails!=null){
        for(var i = 0; i < assetTraceSetupDetails.assetProvenanceField.length; i++) {
            transactionCode[i]=assetTraceSetupDetails.assetProvenanceField[i].transactionTypeCode;
        }
    }
    
   
    const assetDetails = await assetService.getAssetFullDetails(reqBody);
    let inputAssetIdArr=[];
    if(assetDetails.inputAssets!=null){
        for(var i = 0; i < assetDetails.inputAssets.length; i++) {   
            if(assetDetails.inputAssets[i]!=undefined){
                inputAssetIdArr[i] = assetDetails.inputAssets[i].inputAssetId;
            }  
        }
    }
    const combineInputAssetIDArr = [assetDetails._id.entityAsset].concat(inputAssetIdArr);

    
    const payLoad={
        organizationId:reqBody.organizationId,
        inputAssetArr:combineInputAssetIDArr,
        transactionCode:transactionCode,
        assetDetails:assetDetails._id
    }
    return await payLoad;
}

const getTraceabilityBC= async (fabricsetup,reqBody)=>{
    let assetArray = reqBody.inputAssetArr // Need to map array from front end
    let promises = []
    for(let i = 0;i < assetArray.length;i++){
        promises.push(blockchainTraceability(assetArray[i],fabricsetup));
    }
    const results = await Promise.all(promises)
    let arrBc=[];
    results.forEach(element => {
        if(element.transaction.result!=null && element.transaction.result.result!='[]'){
            arrBc.push(JSON.parse(element.transaction.result.result))
        }
    });
    const bcResult = Array.prototype.concat.apply([], arrBc); //flatten array of arrays
    return bcResult;
}



module.exports = {
    uploadFileOnS3,
    getFileOnS3,
    replaceStrValues,
    createPayload,
    getTraceabilityBC
}