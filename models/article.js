const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose.Promise = global.Promise;

const ArticleSchema = new Schema({
    articleId: Number,
    articlePhoto: String,
    articleName: String,
    price: Number,
    categories:Number
});

const ArticleModel = mongoose.model('ArticleModel', ArticleSchema);

module.exports = ArticleModel;