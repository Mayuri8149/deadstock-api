const { Nft, ObjectId } = require('../models/nftdetail');

    const addNftDetails = async (payloadData) => {
        payloadData.created_on = payloadData.modified_on = new Date(Date.now());
 
        const result = await Nft.findOneAndUpdate(
            { tokenId: payloadData.tokenId },
            {
                $set: payloadData
            },
            { new: true, useFindAndModify: false, upsert: true }
        );
        return result;
    }

    const findnft = async (payloadData) => {
        const result = await Nft.findOne(
            { assetId: payloadData.assetId }
        );
    
        return result;
    }
    const findnftOwner = async (payloadData) => {
        var conditionObj={}
        payloadData.nft_sale.map( (elem) => {
            conditionObj["nft_sale.owner"] =  elem.owner 
        })
        const result2 = await Nft.findOne(
            conditionObj
        );
    
        return result2;
    }

    const updateNftDetails = async (payloadData,result1) => {
        payloadData.modified_on = new Date(Date.now());
        var conditionObj = {};
        var updateSet = {};
        var assetArr = [];
        if(payloadData.assetId) { conditionObj.assetId =  result1.assetId }
        var checkDuplicate = await findnftOwner(payloadData)
        
        if(!checkDuplicate && "material_received" in payloadData && payloadData.material_received && payloadData.material_received == 'true'){
            payloadData.nft_sale.map( (orderitem) => {
                const orderObj =  {
                    "owner": orderitem.owner,
                    "ownerName": orderitem.ownerName,
                    "ownedCopies": orderitem.ownedCopies,
                    "sale_copies": orderitem.sale_copies,
                    "fixedPrice": orderitem.fixedPrice,
                    "fixedFlag": orderitem.fixedFlag,
                    "previous_owner": orderitem.previous_owner,
                    "trx_hash": orderitem.trx_hash
                }
                assetArr.push(orderObj)
            })

            assetArr.map( (elem) => {                
                // conditionObj["nft_sale.owner"] =  elem.owner 
                // updateSet["nft_sale.$.ownerName"] =  elem.ownerName
                updateSet['nft_sale'] = [...result1.nft_sale,elem]
            })
            const result = await Nft.findOneAndUpdate(conditionObj,
                {
                    $set: updateSet
                },
            );
            var conditionObj2 = { }
            var updateSet2 = { }
            var incrementSet2 = {}
            conditionObj2.assetId = payloadData.assetId      
            payloadData.nft_sale.map( (orderitem) => {  
                conditionObj2["nft_sale.owner"] = orderitem.previous_owner
                incrementSet2["nft_sale.$.sale_copies"] = - orderitem.ownedCopies
                incrementSet2["nft_sale.$.ownedCopies"] =  - orderitem.ownedCopies
            })
                const result12 = await Nft.updateMany(conditionObj2,
                    {                
                        $set: updateSet2,
                        $inc: incrementSet2
                    }     
                );
                return result12;
        }else if(checkDuplicate && "material_received" in payloadData && payloadData.material_received && payloadData.material_received == 'true'){
        
            var conditionObj2 = { }
            var updateSet2 = { }
            var incrementSet2 = {}
            conditionObj2.assetId = payloadData.assetId      
            payloadData.nft_sale.map( (orderitem) => {  
                conditionObj2["nft_sale.owner"] = orderitem.owner
                incrementSet2["nft_sale.$.ownedCopies"] =  + orderitem.ownedCopies
            })
                const result13 = await Nft.updateMany(conditionObj2,
                    {                
                        $set: updateSet2,
                        $inc: incrementSet2
                    }     
                );

                var conditionObj3 = { }
                var updateSet3 = { }
                var incrementSet3 = {}

                payloadData.nft_sale.map( (orderitem) => {  
                    conditionObj3["nft_sale.owner"] = orderitem.previous_owner
                    incrementSet3["nft_sale.$.ownedCopies"] =  - orderitem.ownedCopies
                    incrementSet3["nft_sale.$.sale_copies"] =  - orderitem.ownedCopies  
                })
                    const result14 = await Nft.updateMany(conditionObj3,
                        {                
                            $set: updateSet3,
                            $inc: incrementSet3
                        }     
                    );

                return result14;
        }else if("sale_copies" in payloadData && payloadData.sale_copies && payloadData.sale_copies == 'true'){
            var conditionObj1 = { }
            var updateSet1 = { }
            var incrementSet = {}
            conditionObj1.assetId = payloadData.assetId      
            payloadData.nft_sale.map( (orderitem) => {  
                conditionObj1["nft_sale.owner"] = orderitem.owner
                updateSet1["nft_sale.$.fixedPrice"] = orderitem.fixedPrice
                incrementSet["nft_sale.$.sale_copies"] =  orderitem.sale_copies
            })
                const result = await Nft.updateMany(conditionObj1,
                    {                
                        $set: updateSet1,
                        $inc : incrementSet
                    }     
                );
                return result;
     }
    }

    const getNftFullDetails = async (payloadData) => {
        console.log("payloadData:",payloadData)
        const conditionObj = {
            _id: ObjectId(payloadData.nftObjectId)
        }
        const result = await Nft.aggregate(
            [
                {
                    $match: conditionObj
                }
            ]
        );
        return result && result.length ? result[0] : null;
    }

    const getNftDetails = async (payloadData) => {
        const conditionObj = {};
        
        if (payloadData.tokenId) {
            conditionObj.tokenId = payloadData.tokenId
        }
        if (payloadData.token_address) {
            conditionObj.token_address = payloadData.token_address
        }
        
        const aggregateArr = [
             {
                $match: conditionObj
            }
        ];
        if ("allFields" in payloadData && payloadData.allFields && payloadData.allFields == 'true') {
            aggregateArr.push(
                {$unwind: "$nft_sale"},
                    {
                        $match: {
                            $expr: { $ne: ['$nft_sale.sale_copies', 0] }
                        }
                    },
            )   
        }  
        if ("ownerFields" in payloadData && payloadData.ownerFields && payloadData.ownerFields == 'true') {
            aggregateArr.push(
                {$unwind: "$nft_sale"},
                    {
                        $match: {
                            $expr: { $eq: ['$nft_sale.owner', payloadData.owner] }
                        }
                    },
            )   
        }  
        let sortKey = "modified_on";
        let sortnft = -1;
        if ("sortKey" in payloadData && "sortnft" in payloadData && payloadData.sortKey && payloadData.sortnft) {
            sortKey = payloadData.sortKey;
            sortnft = payloadData.sortnft.toLowerCase() == "desc" ? -1 : 1;
        }
        aggregateArr.push(
            {
                $sort: {
                    [sortKey]: sortnft
                }
            }
        )
        var { startIndex, limit } = payloadData;
        startIndex = startIndex ? parseInt(startIndex) : 0;
        limit = limit ? parseInt(limit) : 10;
        const paginationArr = [];
        paginationArr.push({ $skip: startIndex });
    
        if (limit)
            paginationArr.push({ $limit: limit });
    
        aggregateArr.push({
            $facet: {
                paginatedResults: paginationArr,
                totalCount: [
                    {
                        $count: 'count'
                    }
                ]
            }
        });
        var nftDetails = await Nft.aggregate(aggregateArr);
        const responseObj = {
            'totalCount': nftDetails[0]['totalCount'] && nftDetails[0]['totalCount'].length ? nftDetails[0]['totalCount'][0]['count'] : 0,
            'result': nftDetails[0]['paginatedResults']
        };
        return responseObj;
    }

module.exports = {
    addNftDetails,
    getNftFullDetails,
    getNftDetails,
    findnft,
    updateNftDetails,
    findnftOwner
}
