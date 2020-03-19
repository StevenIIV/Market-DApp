const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose.Promise = global.Promise;

const ObjectSchema = new Schema({
    objectId: Number,
    objectPhoto: String,
    objectName: String,
    priceDaily: Number,
    deposit: Number,
    rented: Boolean,
    categories:Number
});

const ObjectModel = mongoose.model('ObjectModel', ObjectSchema);

module.exports = ObjectModel;