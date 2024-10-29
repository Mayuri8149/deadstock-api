// ------------Start Rohini kamble (SCI-I771) 19/02/2021
const mongoose = require('mongoose');
const { getIncrementalCode } = require('../models/counters');

const subCategoriesSchema = new mongoose.Schema({
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

subCategoriesSchema.pre('save', async (next) => {
    let doc = this;
    let subCategoryId = await getIncrementalCode('subcategories');
    doc.code = subCategoryId;
    next();
});


const SubCategories = mongoose.model('subcategories', subCategoriesSchema);

module.exports = {
    SubCategories
}
// ------------End Rohini kamble (SCI-I771) 19/02/2021