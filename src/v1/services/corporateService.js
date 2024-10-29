const userReference = require('../../../routes/v1/user/userRefSchema');
const userSchema = require('../../../routes/v1/user/schema');
const userModel = require('../../../routes/v1/user/model');
const partner = require('../../../routes/v1/invitepartner/schema');
const corporate = require('../../../routes/v1/corporate/schema');
var mongoose = require('mongoose');

const createUser = async (payloadData) => {
   
    const result = await userSchema.findOneAndUpdate(
        { companyCode: payloadData.code },
        {
            $set: payloadData
        },
        { new: true, useFindAndModify: false, upsert: true }
    );
     
    return result;
   
}

const createUserRef = async (payloadData,userDetails) => {
 
payloadData.userName = userDetails.firstName + ' ' + userDetails.lastName;

const result = await userReference.findOneAndUpdate(
    { userId: userDetails._id },
    {
        $set: payloadData
    },
    { new: true, useFindAndModify: false, upsert: true }
);
    return result;
}

const createOtp = async (userDetails) => {
    var fullName = userDetails.firstName+ " " +userDetails.lastName;
    var data = {
        email: userDetails.email,
        userId: userDetails._id,
        fullName: fullName
    };

    const result = await userModel.createOtp(data)
    return result;
};

const getDuplicateDetails = async (payloadData) => {
    var conditionObj ={}
  
    conditionObj.email = payloadData.email

    const result = await userSchema.findOne(conditionObj);
    return result
}

const findPartnerById = async (corporateId) => {
const result = await partner.findOneAndUpdate(
    { childEntity: mongoose.Types.ObjectId(corporateId) },
    {
        $set: {
            status : "signedUp",
            updatedAt: new Date(Date.now())
        }
    },
    { new: true, useFindAndModify: false, upsert: true }
);
return result;
}

const updateCorporate = async (payloadData) => {
    payloadData.updatedAt = new Date(Date.now());
    const result = await corporate.findOneAndUpdate(
        { _id: mongoose.Types.ObjectId(payloadData.corporateId) },
        {
            $set: {
                emailId : payloadData.email,
                companyName : payloadData.companyName,
                updatedAt: payloadData.updatedAt,
                phoneNumber: payloadData.phoneNumber
            }
        },
        { new: true, useFindAndModify: false, upsert: true }
    );
    return result;
}

const updatePartner = async (payloadData) => {
    payloadData.updatedAt = new Date(Date.now());
    const result = await partner.findOneAndUpdate(
        { childEntity: mongoose.Types.ObjectId(payloadData.corporateId) },
        {
            $set: {
                email : payloadData.email,
                entityName : payloadData.companyName,
                updatedAt: payloadData.updatedAt
            }
        },
        { new: true, useFindAndModify: false, upsert: true }
    );
    return result;
}

const findCorpDetails = async (payloadData) => {
    var conditionObj ={}

    conditionObj._id = mongoose.Types.ObjectId(payloadData.corporateId)
    conditionObj.companyName = payloadData.companyName,
    conditionObj.emailId = payloadData.email

    const result = await corporate.findOne(conditionObj);
    return result
}

module.exports = {
    createUser,
    createUserRef,
    getDuplicateDetails,
    createOtp,
    findPartnerById,
    updateCorporate,
    updatePartner,
    findCorpDetails
}
