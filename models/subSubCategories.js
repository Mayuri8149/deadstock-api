// ------------Start Rohini kamble (SCI-I771) 19/02/2021
const mongoose = require('mongoose');
const { getIncrementalCode } = require('../models/counters');

const subSubCategoriesSchema = new mongoose.Schema({
    code: {
        type: String,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'categories',
        required: true
    },
    sub_category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'subcategories',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    is_deleted: {
        type: Boolean,
        default: false
    },
    created_on: {
        type: Date,
        default: Date.now()
    },
    modified_on: {
        type: Date,
        default: null
    }
});

subSubCategoriesSchema.pre('save', async (next) => {
    let doc = this;
    let subSubCategoryId = await getIncrementalCode('subsubcategories');
    doc.code = subSubCategoryId;
    next();
});


const SubSubCategories = mongoose.model('subsubcategories', subSubCategoriesSchema);

module.exports = {
    SubSubCategories
}
// ------------End Rohini kamble (SCI-I771) 19/02/2021