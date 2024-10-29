// ------------Start Rohini kamble (SCI-I771) 19/02/2021
const mongoose = require('mongoose');

const CounterSchema = new mongoose.Schema(
    {
        collection_name: {
            type: String,
            unique: true,
            required: true
        },
        prefix: {
            type: String,
            required: true
        },
        seq: {
            type: Number,
            default: 0
        }
    }
);

const Counter = mongoose.model('counters', CounterSchema);

const getIncrementalCode = async (collection_name) => {
    const result = await Counter.findOneAndUpdate({ collection_name }, { $inc: { seq: 1 } }, { new: true });
    return `${result.prefix}${result.seq}`;
}

module.exports = {
    getIncrementalCode
}
// ------------End Rohini kamble (SCI-I771) 19/02/2021