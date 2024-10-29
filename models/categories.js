// ------------Start Rohini kamble (SCI-I771) 19/02/2021
const mongoose = require('mongoose');
const { getIncrementalCode } = require('../models/counters');

const categoriesSchema = new mongoose.Schema({
    code: {
        type: String,
        unique: true
    },
    name: {
        type: String,
        // Start - Priyanka Patil (SNA-I48) 25-06-2021
        required: true
        // End - Priyanka Patil (SNA-I48) 25-06-2021
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

categoriesSchema.pre('save', async (next) => {
    let doc = this;
    let categoryId = await getIncrementalCode('categories');
    doc.code = categoryId;
    next();
});


const Categories = mongoose.model('categories', categoriesSchema);

module.exports = {
    Categories,
    ObjectId: mongoose.Types.ObjectId
}
// ------------End Rohini kamble (SCI-I771) 19/02/2021