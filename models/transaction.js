const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose.Promise = global.Promise;

const TransactionSchema = new Schema({
    articleId: Number,
    articleName: String,
    seller: String,
    articlePhoto: String,
    price: Number
})

const TransactionModel = mongoose.model('TransactionModel', TransactionSchema);
module.exports = TransactionSchema;