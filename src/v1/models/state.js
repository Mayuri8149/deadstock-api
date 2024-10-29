const mongoose =  require("mongoose")

const stateSchema = new mongoose.Schema({

    stateCode : {
        type : String,
        required :true
    },
    stateName: {
        type: String,
        required : true
    }
});

const State = mongoose.model('state', stateSchema);
module.exports = {
    State,
    ObjectId : mongoose.Types.ObjectId
}