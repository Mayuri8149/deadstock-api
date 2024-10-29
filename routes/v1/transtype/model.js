var schema = require('./schema');
var mongoose = require('mongoose');
var moduleSchema = require('../module/schema');
const PDFDocument = require('pdfkit');
var fs = require("fs");

var create = (transtype) => {
    var promise = new Promise((resolve, reject) => {
        var document = new schema(transtype);
        document.save().then((result) => {
            var response = { isError: false, transtype: result, errors: [] };
            resolve(response);
        }).catch((error) => {
            var response = { isError: true, transtype: {}, errors: [] };
            resolve(response);
        });
    });

    return promise;
}

var createTransactionType = async (transtype) => {
transtype.createdAt = transtype.updatedAt = new Date(Date.now());
let conditionObj = { organizationId: transtype.organizationId }
if(transtype.transactionTypeCode){ conditionObj.transactionTypeCode= transtype.transactionTypeCode }
if(transtype.moduleId){ conditionObj.moduleId= transtype.moduleId }

    const result = await schema.findOneAndUpdate(
        conditionObj,
        {
            $set: transtype
        },
        { new: true, useFindAndModify: false, upsert: true }
    );
     return result;
}

var findByName = (obj) => {
    var promise = new Promise((resolve, reject) => {
// ------------Start Rohini Kamble (SCI-I816) 06/03/2021-------------------
        var data = {
            organizationId: obj.organizationId,
            transactionTypeCode: obj.transactionTypeCode,
            moduleId: obj.moduleId
        };

        var nameData = {
            organizationId: obj.organizationId,
            transactionTypeName: obj.transactionTypeName,
            moduleId: obj.moduleId
        };
    
        schema.find(data, (err, result) => {
            if(!err && result && result.length) {               
                var response = { isError: false, errors: [{msg: "Transaction Type ID already available!"}], transtypes: result};
                resolve(response);
            } 
            else{
                var response = {isError: false, transType: result, errors: []};
                resolve(response);
            }
        });
    });
// ------------End Rohini Kamble (SCI-I816) 06/03/2021-------------------
    return promise; 
}

var findById = (obj) => {
   var promise = new Promise((resolve, reject) => {
        var data = {
            _id: mongoose.Types.ObjectId(obj.transTypeId)
        };
        
        schema.findOne(data, (err, result) => {
            if(!err && result) {
                var response = {isError: false, transType: result, errors: []};
                resolve(response);
            } else {
                var response = { isError: true, errors: [{msg: "Transaction Type not available!"}], transType: []};
                resolve(response);
            }
        })
    });

    return promise;

}

var findByModuleId = (obj) => {
        var promise = new Promise((resolve, reject) => {
    
            var filter = [];
            var matchQuery = {};
    
             var data = {
                 _id: mongoose.Types.ObjectId(obj.transTypeId)
             };
                
            if (obj.moduleId) {
                data.moduleId = mongoose.Types.ObjectId(obj.moduleId);
            };
           
             schema.findOne(data, (err, result) => {               
                if(!err && result) {                    
                    moduleSchema.findOne(data.moduleId, (err, res) => {
                        if(!err && res) {
                            result.moduleData = res.name;
                            var response = {isError: false, moduleData: res, transType: result,  errors: []};
                            resolve(response);
                        } else {
                            var response = { isError: true, errors: [{msg: "Transaction Type Data not available!"}], transType: []};
                            resolve(response);
                        }
                    })
                } else {
                     var response = { isError: true, errors: [{msg: "Transaction Type Data not available!"}], transType: []};
                     resolve(response);
                 }
             })
    
            
         });

        return promise;
    };

var findDraftByIds = (ids, organizationId) => {
    var promise = new Promise((resolve, reject) => {

        for(var i=0; i < ids.length; i++) {
            ids[i] = mongoose.Types.ObjectId(ids[i]);
        }

        var data = {
            _id: { "$in" : ids }
        };

        if(organizationId) {
            data.organizationId = mongoose.Types.ObjectId(organizationId);
        }

        schema.find(data, (err, result) => {
            if(!err && result && result.length) {
                var response = {isError: false, drafts: result, errors: []};
                resolve(response);
            } else {
                var response = {isError: true, drafts: [], errors: [{msg: "Invalid Transaction Type ids"}]};
                resolve(response);
            }
        });
    });

    return promise;
};

var deleteMany = (ids) => {
    var promise = new Promise((resolve, reject) => {
        schema.deleteMany({ '_id' : { $in : ids }}).then((result) => {
            var response = { isError: false, drafts: result, errors: [] };
            resolve(response);
        }).catch((err) => {
            var response = { isError: true, drafts: {}, errors: [] };
            resolve(response);
        }); 
    });
    return promise;
};

// Start - Priyanka Patil 18-12-2020 
var list = (data) => {
    var promise = new Promise((resolve, reject) => {

        var filter = [];

        var matchQuery = {};
        if(data.organizationId) {
            matchQuery.organizationId = mongoose.Types.ObjectId(data.organizationId);  
        }

        if(data.moduleId) {
            matchQuery.moduleId = mongoose.Types.ObjectId(data.moduleId)  
        }

        if(data.transTypeId){
            matchQuery._id = mongoose.Types.ObjectId(data.transTypeId)  
        }

        if(data.batchId){
            matchQuery._id = mongoose.Types.ObjectId(data.batchId)  
        }
        if (data.filters) {
            matchQuery['$and'] = [{
                $or: [
                    { 'transactionTypeCode': { $regex: `${data.filters}`, $options: "i" } },
                    { 'additionalDescription': { $regex: `${data.filters}`, $options: "i" } }
                ]
            }]
        }
        // Start - Priyanka Patil 15-06-2021 (SCI-I40)
        filter.push({ $match: matchQuery }, { $sort: { updatedAt: -1 }});
        // End - Priyanka Patil 15-06-2021 (SCI-I40)

        filter.push({
            "$lookup": {
                from: "organizations",
                localField: "organizationId",
                foreignField: "_id",
                as: "organization"
            }
        });

        filter.push({
            $unwind: {
                "path": "$organization",
                "preserveNullAndEmptyArrays": true
            }
        });

        filter.push({
            "$lookup": {
                from: "departments",
                localField: "departmentId",
                foreignField: "_id",
                as: "department"
            }
        });

        filter.push({
            $unwind: {
                "path": "$department",
                "preserveNullAndEmptyArrays": true
            }
        });

        filter.push({
            "$lookup": {
                from: "modules",
                localField: "moduleId",
                foreignField: "_id",
                as: "module"
            }
        });

        filter.push({
            $unwind: {
                "path": "$module",
                "preserveNullAndEmptyArrays": true
            }
        });

         filter.push({
            "$lookup": {
                from: "batches",
                localField: "batchId",
                foreignField: "_id",
                as: "batch"
            }
        });

        filter.push({
            $unwind: {
                "path": "$batch",
                "preserveNullAndEmptyArrays": true
            }
        });

        var query = schema.aggregate(filter);

        query.exec((err, records) => {
            if (!err || records) {
                var transtypes = [];
                for(var i=0; i < records.length; i++) {
                    var record = records[i];
                    if(record) {
                      
                        var transtype = record;

                        if(data.role == 'admin'){
                            transtype.organization = record.organization;
                            transtype.department = record.department;
                            transtypes.push(transtype);
                        }else if(transtype.organization == record.organization && transtype.departmentId == data.departmentId || records[i].departmentId =='111111111111111111111111'){
                            transtypes.push(transtype);
                        }else{
                        }

                    }
                }
                var response = { isError: false, transtypes: transtypes };
                resolve(response);
            } else {
                var response = { isError: true, transtypes: [] };
                resolve(response);
            }
        });
    });

    return promise;
};
// End - Priyanka Patil 18-12-2020 

var listNew = async(data,filters={}) => {

        var whereObj = {};

        if(data.organizationId) {
            whereObj.organizationId = mongoose.Types.ObjectId(data.organizationId);  
        }
        if (filters.transactionTypeName) {
            whereObj["transactionTypeName"] = { $regex: `${filters.transactionTypeName}`, $options: "i" }
        }
        if (filters.transactionTypeCode) {
            whereObj["transactionTypeCode"] = { $regex: `${filters.transactionTypeCode}`, $options: "i" }
        }
        if (filters.transTypeDescription) {
            whereObj["additionalDescription"] = { $regex: `${filters.transTypeDescription}`, $options: "i" }
        }
        if ("searchKey" in filters && filters.searchKey) {
            whereObj['$and'] = [{
                $or: [
                    { 'transactionTypeName': { $regex: `${filters.searchKey}`, $options: "i" } },
                    { 'transactionTypeCode': { $regex: `${filters.searchKey}`, $options: "i" } },
                    { 'additionalDescription': { $regex: `${filters.searchKey}`, $options: "i" } }
                ]
            }]
        }
        // if(data.moduleId) {
        //     whereObj.moduleId = mongoose.Types.ObjectId(data.moduleId)  
        // }

        if(data.transTypeId){
            whereObj._id = mongoose.Types.ObjectId(data.transTypeId)  
        }

        // if(data.batchId){
        //     whereObj._id = mongoose.Types.ObjectId(data.batchId)  
        // }
        const aggregateArr = [
            {
                $match: whereObj
            },
            {
                $sort: {
                    updatedAt: -1
                }
            }
        ];
    
        //pagination code
        let paginationResultArr = [];
        paginationResultArr.push({ $skip: data.skip || 0 });
    
        if (data.limit)
            paginationResultArr.push({ $limit: data.limit });
    
        aggregateArr.push({
            $facet: {
                paginatedResults: paginationResultArr,
                totalCount: [
                    {
                        $count: 'count'
                    }
                ]
            }
        });
        const categoriesResultArr = await schema.aggregate(aggregateArr).allowDiskUse(true);
        const responseObj = {
            'totalCount': categoriesResultArr[0]['totalCount'] && categoriesResultArr[0]['totalCount'].length ? categoriesResultArr[0]['totalCount'][0]['count'] : 0,
            'transtypes': categoriesResultArr[0]['paginatedResults']
        };

        return responseObj;    
};

var findType = (typeName) => {
    var promise = new Promise((resolve, reject) => {
        schema.findOne({
            transactionTypeName: typeName
        }, (err, type) => {
            if(!err && (type && type._id) ){
                var response = {isError: false, type: type, errors: []};
                resolve(response);
            } else {
                var response = {isError: true, type: {}, errors: [{msg: "Invalid type ID"}]};
                resolve(response);
            }            
        })
    });

    return promise;
}

var update = (id, transtype) => {
    var promise = new Promise((resolve, reject) => {
        schema.findOneAndUpdate({ '_id': id }, { $set : transtype }, { new : true }, (error, result) =>{
            if(error) {
                var response = { isError: true, transtype: {}, errors: [{"msg": "Failed to update transaction image!"}] };
                resolve(response);
            } else {
                var response = { isError: false, transtype: result, errors: [] };
                resolve(response);
            }
        })
    });
    return promise;
};

// const  updateTrans = async (id, transtype) => {  
//     const result =await schema.findOneAndUpdate({ '_id': id }, { $set : transtype }, { new : true , useFindAndModify: false, upsert: true }) 
//     return result;
// };

const updateManyTransType = async (transtype) => {
    if (!transtype.transactionTypeCode) {
        return false;
    }
    let whereObj = {};
    if(transtype.transactionTypeCode){
        whereObj.transactionTypeCode = transtype.transactionTypeCode;
    }
    
    return await schema.updateMany(whereObj, { $set: transtype });
}


var findTypeModule = (typeName, module) => {
    var promise = new Promise((resolve, reject) => {
        schema.findOne({
            transactionTypeName: typeName,
            moduleId: module
        }, (err, type) => {
            if(!err && (type && type._id) ){
                var response = {isError: false, type: type, errors: []};
                resolve(response);
            } else {
                var response = {isError: true, type: {}, errors: [{msg: "Invalid type ID"}]};
                resolve(response);
            }            
        })
    });

    return promise;
}

//  Start- Shubhangi, 23-03-2021, SCI-I823
var findTransactionById = (obj) => {
    var promise = new Promise((resolve, reject) => {
         var data = {
             _id: obj.transTypeId
         };
         
         schema.findOne(data, (err, result) => {
            
             if(!err && result) {
                 var response = {isError: false, transType: result, errors: []};
                 resolve(response);
             } else {
                 var response = { isError: true, errors: [{msg: "Transaction Type not available!"}], transType: []};
                 resolve(response);
             }
         })
     });
 
     return promise;
 
 }

 //  End- Shubhangi, 23-03-2021, SCI-I823
// Start Mayuri , 23-03-2021, PDFKIT package
var print = (transactions) => {
    
    var allKeys = [];
    var allValues = [];
    var transtypes = [];
    var xcoordinates = [];
    var ycoordinates = [];
    var valuearray = [];

    var length = transactions.fields.length;

    var singleArray = transactions.fields.map(([x]) => ({ "key": x.key, "transactionid": x.transactionid, "value": x.value, "xcor": x.xcor, "ycor": x.ycor, "fontsize": x.fontsize, "color": x.color }))
    var fieldsArray = JSON.stringify(singleArray);
    var staticSingleArray = transactions.staticFields.map(([x]) => ({ "key": x.key, "value": x.value, "xcor": x.xcor, "ycor": x.ycor, "fontsize": x.fontsize, "color": x.color }))

    for (var iLoop = 0; iLoop < length; iLoop++) {
        var field = transactions.fields[iLoop][0].key;
        var xcor = transactions.fields[iLoop][0].xcor;
        var ycor = transactions.fields[iLoop][0].ycor;
        if (xcor == '') {
            xcor = '0px';
        } else {
            xcor = transactions.fields[iLoop][0].xcor;
        }

        if (ycor == '') {
            ycor = '0px';
        } else {
            ycor = transactions.fields[iLoop][0].ycor;
        }

        transtypes.push(field);
        xcoordinates.push(xcor);
        ycoordinates.push(ycor);
    }

    allKeys = Object.keys(transactions);

    allValues = Object.values(transactions);
    var obj = {};
    var staticObj = {};
    var singleValueArray = [];
    var staticSingleValueArray = [];
    // for (let jLoop = 0; jLoop < allKeys.length; jLoop++) {
        for (let iLoop = 0; iLoop < singleArray.length; iLoop++) {
            // if (singleArray[iLoop].key == allKeys[jLoop]) {

                obj.name = singleArray[iLoop].key;
                obj.xcor = singleArray[iLoop].xcor;
                obj.ycor = singleArray[iLoop].ycor;
                obj.fontsize = singleArray[iLoop].fontsize;
                var str = singleArray[iLoop].color;
                var removed = str.replace(/["']/g, "");
                obj.color = removed;
                singleValueArray.push(obj);
                obj = {};
            // } else {
            // }
        }
    // }

    for (let jLoop = 0; jLoop < transactions.staticFields.length; jLoop++) {
        
        if (transactions.staticFields[jLoop][0].key == 'Organization Name') {
            staticObj.name = transactions.staticFields[jLoop][0].key;            
            staticObj.xcor = transactions.staticFields[jLoop][0].xcor;        
            staticObj.ycor = transactions.staticFields[jLoop][0].ycor;            
            staticObj.fontsize = transactions.staticFields[jLoop][0].fontsize;
        }

        if (transactions.staticFields[jLoop][0].key == 'Module Name') {
            staticObj.name = transactions.staticFields[jLoop][0].key;           
            staticObj.xcor = transactions.staticFields[jLoop][0].xcor;        
            staticObj.ycor = transactions.staticFields[jLoop][0].ycor;            
            staticObj.fontsize = transactions.staticFields[jLoop][0].fontsize;
        }

        if (transactions.staticFields[jLoop][0].key == 'Transaction Type') {
            staticObj.name = transactions.staticFields[jLoop][0].key;            
            staticObj.xcor = transactions.staticFields[jLoop][0].xcor;        
            staticObj.ycor = transactions.staticFields[jLoop][0].ycor;            
            staticObj.fontsize = transactions.staticFields[jLoop][0].fontsize;
        }

        if (transactions.staticFields[jLoop][0].key == 'Transaction ID') {
            staticObj.name = transactions.staticFields[jLoop][0].key;           
            staticObj.xcor = transactions.staticFields[jLoop][0].xcor;        
            staticObj.ycor = transactions.staticFields[jLoop][0].ycor;           
            staticObj.fontsize = transactions.staticFields[jLoop][0].fontsize;
        }
        if (transactions.staticFields[jLoop][0].key == 'QR Code') {
            staticObj.name = transactions.staticFields[jLoop][0].key;            
            staticObj.xcor = transactions.staticFields[jLoop][0].xcor;        
            staticObj.ycor = transactions.staticFields[jLoop][0].ycor;           
            staticObj.fontsize = transactions.staticFields[jLoop][0].fontsize;
        }
        if (transactions.staticFields[jLoop][0].key == 'Partner Name') {
            staticObj.name = transactions.staticFields[jLoop][0].key;            
            staticObj.xcor = transactions.staticFields[jLoop][0].xcor;        
            staticObj.ycor = transactions.staticFields[jLoop][0].ycor;           
            staticObj.fontsize = transactions.staticFields[jLoop][0].fontsize;
        }
        staticSingleValueArray.push(staticObj);
        staticObj = {};
    }


    run().catch(err => console.log('Run', err));

    async function run() {
        // if (!transactions._id) {
        //     for (kLoop = 0; kLoop < transactions.length; kLoop++) {
        //         var credFile = transactions[kLoop]._id + '.pdf';
        //         var partnerData = transactions[kLoop].partner;
        //         var moduleData = transactions[kLoop].moduleData;
        //     }
        // } else {
        //     var credFile = transactions._id + '.pdf';
        //     var partnerData = transactions.partner;
        //     var moduleData = transactions.moduleData;

        //     var partnerFullName = partnerData.firstName + " " + partnerData.lastName;
        //     var moduleName = moduleData.name;
        // }

        // Create a new document and add a new page = layout: "landscape",
        let pdfDoc = new PDFDocument(
        // Start-Mayuri, 17-04-2021, SCI-I12 
            { 
                layout: transactions.credFileType
            });
        // End-Mayuri, 17-04-2021, SCI-I12 
        var transTypeName = transactions.transactionTypeName;
        var transTypeID = transactions._id;
        var text = transactions.transactionid;
            //For template image printing
            // Start-Mayuri, 17-04-2021, SCI-I12 


            if(parseInt(transactions.credFileHeight) > parseInt(transactions.credFileWidth)){
                // let pdfDoc = new PDFDocument({layout: 'portrait'});
                pdfDoc.image('./uploads/'+transactions.credImg, 0, 0, { width: 620, height: 800});  
                    
            }else if(parseInt(transactions.credFileHeight) < parseInt(transactions.credFileWidth)){
                // let pdfDoc = new PDFDocument({ layout: 'landscape'});
                pdfDoc.image('./uploads/'+transactions.credImg, 0, 0, { width: 800,
                        height: 620});   
                        
            }else if(parseInt(transactions.credFileHeight) == 0 || parseInt(transactions.credFileWidth) == 0){
                var error = [{
                    'msg': 'Please upload your file again!!!'
                }];
                onError(req, res, error, 500, {});
                return;
            }else{
                // 800, 620
                // let pdfDoc = new PDFDocument({ layout: 'portrait'});
                pdfDoc.image('./uploads/'+transactions.credImg, 0, 0, { width: 620,
                        height: 620});
            }

            // End-Mayuri, 17-04-2021, SCI-I12
            // For dynamic Fields
            for (let i = 0; i < singleValueArray.length; i++) {
                if (typeof singleValueArray[i].name == 'number') {
                    singleValueArray[i].name = (singleValueArray[i].name).toString();
                    pdfDoc.text(singleValueArray[i].name, singleValueArray[i].xcor,singleValueArray[i].ycor);
                } else {
                    if(singleValueArray[i].xcor == '') {
                    }else {
                    singleValueArray[i].name = singleValueArray[i].name;
                    pdfDoc.text(singleValueArray[i].name, singleValueArray[i].xcor,singleValueArray[i].ycor);
                    }
                }
                
                
            }

            // For Static Fields
            for (let i = 0; i < staticSingleValueArray.length; i++) {
                
                let str = staticSingleValueArray[i].name;
                let res = str.substr(0, 11);

                // Draw the QR         

                if (res == 'data:image/' && staticSingleValueArray[i].xcor != '') {
                    var abc = new Buffer(transactions.generatedqrcode.replace('data:image/png;base64,',''), 'base64')
                    
                    pdfDoc.image(abc, staticSingleValueArray[i].xcor, staticSingleValueArray[i].ycor, {
                        width: 50,
                        height: 50
                    })

                } else {
                    if (staticSingleValueArray[i].xcor == '') {
                        
                    } else {
                        
                        pdfDoc.text(staticSingleValueArray[i].name, staticSingleValueArray[i].xcor,staticSingleValueArray[i].ycor);
                    }
                }
            }

            pdfDoc.pipe(fs.createWriteStream('././././uploads/transactions/dynamic/' +'transaction_type-'+ transTypeID + '.pdf'));
            pdfDoc.end();
            
    }
    var response = {
        isError: false,
        transactions: transactions,
        errors: []
    };
    return response;
};
// Start - Priyanka Patil (SNA-I71) 19-06-2021
var findModuleId = (obj) => {
    var promise = new Promise((resolve, reject) => {
         var data = {
             moduleId: obj.moduleId
         };
         schema.find(data, (err, result) => {
             if(!err && result) {
                 var response = {isError: false, transType: result, errors: []};
                 resolve(response);
             } else {
                 var response = { isError: true, errors: [{msg: "Transaction Type not available!"}], transType: []};
                 resolve(response);
             }
         })
     });
     return promise;
 }
 // End - Priyanka Patil (SNA-I71) 19-06-2021
 var listAll = async(data) => {

    var whereObj = {};

    if(data.organizationId) {
        whereObj.organizationId = mongoose.Types.ObjectId(data.organizationId);  
    }

    const aggregateArr = [
        {
            $match: whereObj
        },
        {
            $sort: {
                _id: -1
            }
        }
    ];
    let projectObj = {
        _id: 1,
        transactionTypeCode: 1
    };

    aggregateArr.push({ $project: projectObj });

    const ResultArr = await schema.aggregate(aggregateArr).allowDiskUse(true);
    const responseObj = {
        'transtypes': ResultArr
    };

    return responseObj;    
};
module.exports = {
    findByName,
    create,
    update,
    list,
    findById,
    findByModuleId,
    findDraftByIds,
    deleteMany,
    findType,
    findTypeModule,
    listNew,
    //  Start- Shubhangi, 23-03-2021, SCI-I823
    findTransactionById,
    //  End- Shubhangi, 23-03-2021, SCI-I823
    print,
    // Start - Priyanka Patil (SNA-I71) 19-06-2021
    findModuleId,
    // End - Priyanka Patil (SNA-I71) 19-06-2021
    updateManyTransType,
    listAll,
    createTransactionType
}