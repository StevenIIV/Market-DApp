const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose.Promise = global.Promise;

const RentingSchema = new Schema({
    objectId: Number,
    creator: String,
    renter: String,
    objectPhoto: String,
    objectName: String,
    priceDaily: Number,
    deposit: Number,
    rented: Boolean,
    createAt: Number
});

const RentingModel = mongoose.model('RentingModel', RentingSchema);

module.exports = RentingModel;