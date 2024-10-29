var request = require('request')

const addNft = async (payloadData) => {
    var res;
    console.log("payloadData",payloadData)
    const data = {
      // attributes: [
      //   {
      //     color: payloadData.color,
      //     value: payloadData.value,
      //   },
      // ],
      // description: payloadData.description,
      // image: payloadData.image,
      // name: payloadData.name,

        assetName : payloadData.assetName,
        assetQuantity : payloadData.assetQuantity,
        assetUom : payloadData.assetUom,
        expiryDate : payloadData.expiryDate,
        effectiveDate : payloadData.effectiveDate,
        //description : payloadData.description,
        Url : payloadData.Url,
        provinance_hash:payloadData.hash
    };
    console.log(data,"Data");
    var promise = new Promise((resolve, reject) => {
        request.post({
            url: 'http://localhost:8000/mintnft',
            dataType: 'json',
            json : true,
            body: data,

        },(err, result)=>{
        console.log("result",result);
        console.log("TxHash",result.body.TxHash);
        res = result;
        if (!result.body.error) {
            var response = { isError: false, nft: result.body, err: [] };
            resolve(response);
        } else {
            var response = { isError: true, status: result.body.statusMessage, err: [{ 'msg': result.body.statusMessage }] };
            resolve(response);
        }
            // return result.body;
       
        })
    })
    // console.log('mintRequest---',mintRequest)
    console.log('res-----',res)
    return promise;
    }

    const transferNft = async (assetName) => {
        var res;
        console.log("assetName",assetName)
        const data = {
            to: "0x7c187B4EB0Cb81397401dFc952914D2c108099DD",
            assetName: assetName
        };
        console.log(data,"Data");
        var promise = new Promise((resolve, reject) => {
            request.post({
                url: 'http://localhost:8000/transfernft',
                dataType: 'json',
                json : true,
                body: data,
    
            },(err, result)=>{
            console.log("result",result);
            res = result;
            if (!result.body.error) {
                var response = { isError: false, nft: result.body, err: [] };
                resolve(response);
            } else {
                var response = { isError: true, status: result.body.statusMessage, err: [{ 'msg': result.body.statusMessage }] };
                resolve(response);
            }
                // return result.body;
           
            })
        })
        return promise;
    }
    

module.exports = {
    addNft,
    transferNft
}