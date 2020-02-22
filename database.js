const express = require('express')();
const mongoose = require('mongoose');
const contract = require('truffle-contract');
const Web3 = require('Web3');
const provider = new Web3.providers.HttpProvider('http://localhost:8545');
import ShareApp_artifacts from './build/contracts/ShareApp.json'
import Market_artifacts from './build/contracts/MarketPlace.json'
var Market = contract(Market_artifacts);
var ShareApp = contract(ShareApp_artifacts);
Market.setProvider(provider);
ShareApp.setProvider(provider);
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/login')     //连接本地数据库blog
express.listen(3000) //监听3000端口，默认localhost: 127.0.0.1 || 0.0.0.0
var db = mongoose.connection;
// 连接成功
db.on('open', function(){
    console.log('MongoDB Connection Successed');
});
// 连接失败
db.on('error', function(){
    console.log('MongoDB Connection Error');
});

const RentingModel = require('./models/renting');
const TransactionModel = require('./models/transaction');


express.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

express.get('/',(req,res) => {
    // 成功接收后，发起回调参数。
    res.send('Hello World')
})

function rentEventListener() {
    let rentEvent;
    ShareApp.deployed().then(function (instance) {
        rentEvent = instance.NewRent({
            fromBlock: 0,
            toBlock: 'latest'
        })
        rentEvent.watch(function (err, result) {
            if (err){
                console.log(err);
                return;
            }
            saveRentRecord(result.args);
        })
    })
}
function saveRentRecord(obj) {
    RentingModel.findOne({
        'blockchainId': obj._objId.toLocaleString()
    },function (err, result) {
        if (result != null){
            return
        }
        var rentRecord = new RentingModel({
            objectId: obj._objId,
            creator: obj._creator,
            objectPhoto: obj._photo,
            objectName: obj._name,
            priceDaily: obj._priceDaily,
            deposit: obj._deposit,
            rented: obj._rented
        });
        rentRecord.save(function (err) {
            if (err){
                handleError(err)
            }else {
                RentingModel.count({}, function (err, count) {
                    console.log('count is ${count}');
                })
            }
        })
        }
    )
}