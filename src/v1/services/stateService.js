const { State, ObjectId } = require('../models/state')

const getOneState = async (state) => {
    let conditionObj = {}
    conditionObj["$or"] = [
        { "stateCode": state },
        { "stateName": state }
    ]
    console.log('conditionObj',conditionObj)
    const aggregateArr = [
        {
            $match: conditionObj
        },
        {
            $project: {
                stateCode: 1
            }
        }
    ];

    const result = await State.aggregate(aggregateArr);
    return result[0];
}

const getState = async (payloadData) => {
    return await State.find();
}

const addState = async (payloadData) => {
    return await State.insertMany(payloadData);
}

module.exports = {
    getOneState,
    getState,
    addState
}