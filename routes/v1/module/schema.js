var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
    organizationId: {
        type: mongoose.Types.ObjectId,
        ref: 'organization'
    },
    departmentId: {
        type: mongoose.Types.ObjectId,
        ref: 'department'
    },
    type: {
        type: String
    },
    code: {
        type: String
    },
    name: {
        type: String
    },
    // ----Start Rohini Kamble (SCI-I771) 26/02/2021
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'categories'
    },
    sub_category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'subcategories'
    },
    specialization: {
        type: String
    },
    is_deleted: {
        type: Boolean,
        default: false
    },
    // ----End Rohini Kamble (SCI-I771) 26/02/2021
    transactionGenerate: {
        type: String
    },
    transactionPrint: {
        type: Boolean,
        default: true
    },
    gpaCalculated: {
        type: Boolean,
        default: true
    },
    subjectCredits: {
        type: String
    },
    duration: {
        type: Number
    },
    durationUnit: {
        type: String
    },
    termType: {
        type: String
    },
    noOfTerms: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    //  Start- Shubhangi, 05-02-2020, SCI-I749
    createdBy:{},//{firstName:'',lastName:'',email:''}
    updatedBy:{}//{firstName:'',lastName:'',email:''}
    //  End- Shubhangi, 05-02-2020, SCI-I749
},{
    timestamps: true
},

{strict: false})

//  Start- Shubhangi, 31-12-2020, SCI-I698
schema.index({ name: 1});
schema.index({ organizationId: 1,departmentId: 1,code: 1});
//  End- Shubhangi, 31-12-2020, SCI-I698

module.exports = mongoose.model('module', schema);