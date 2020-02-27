// import { default as contract } from 'truffle-contract'
// import { default as Web3} from 'web3';
// import ShareApp_artifacts from './build/contracts/ShareApp.json';
// import Market_artifacts from './build/contracts/MarketPlace.json';
const contract = require('truffle-contract');
const Web3 = require('web3');
const ShareApp_artifacts = require('./build/contracts/ShareApp.json');
const Market_artifacts = require('./build/contracts/MarketPlace.json');
const express = require('express')();
const mongoose = require('mongoose');
const provider = new Web3.providers.HttpProvider('http://localhost:8545');
var Market = contract(Market_artifacts);
var ShareApp = contract(ShareApp_artifacts);
Market.setProvider(provider);
ShareApp.setProvider(provider);
if (typeof Market.currentProvider.sendAsync !== "function") {
    Market.currentProvider.sendAsync = function() {
        return Market.currentProvider.send.apply(
            Market.currentProvider,
            arguments
        );
    };
}
if (typeof ShareApp.currentProvider.sendAsync !== "function") {
    ShareApp.currentProvider.sendAsync = function() {
        return ShareApp.currentProvider.send.apply(
            ShareApp.currentProvider,
            arguments
        );
    };
}
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/market',{useNewUrlParser:true, useUnifiedTopology: true});     //连接本地数据库blog
express.listen(3000); //监听3000端口，默认localhost: 127.0.0.1 || 0.0.0.0
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
});

express.get('/RentRecords', function (req, res) {
    RentingModel.find({},function (err, records) {
        res.send(records);
    })
});

express.get('/getRentRecords', function (req, res) {
    var query = {
        'renter': req.query._renter
    };
    RentingModel.find(query, function (err, records) {
        res.send(records);
    })
});

express.get('/getTransactionRecords', function (req, res) {
    var query = {
        'buyer': req.query._buyer
    };
    TransactionModel.find(query, function (err, records) {
        res.send(records);
    })
});

function rentEventListener() {
    let rentEvent;
    ShareApp.deployed().then(function (instance) {
        rentEvent = instance.NewRent({
            fromBlock: 0,
            toBlock: 'latest'
        });
        rentEvent.watch(function (err, result) {
            if (err){
                console.log(err);
                return;
            }
            saveRentRecord(result.args);
        })
    })
}

function returnEventListener() {
    let returnEvent;
    ShareApp.deployed().then(function (instance) {
        returnEvent = instance.NewReturn({
            fromBlock: 0,
            toBlock: 'latest'
        });
        returnEvent.watch(function (err, result) {
            if (err){
                console.log(err);
                return;
            }
            saveRentChangeStatus(result.args);
        })
    })
}

function TransactionEventListener() {
    let transactionEvent;
    Market.deployed().then(function (instance) {
        transactionEvent = instance.buyArticleEvent({
            fromBlock: 0,
            toBlock: 'latest'
        });
        transactionEvent.watch(function (err, result) {
            if (err){
                console.log(err);
                return;
            }
            saveTransaction(result.args);
        })
    })
}

function saveRentRecord(obj) {
    RentingModel.findOne({
        'objectId': obj._objID.toLocaleString(),
        'renter': obj._renter.toLocaleString()
    },function (err, result) {
        if (result != null){
            saveRentChangeStatus(obj);
            return
        }
        var rentRecord = new RentingModel({
            objectId: obj._objID,
            creator: obj._creator,
            renter: obj._renter,
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
                console.log('rent success');
                RentingModel.count({}, function (err, count) {
                    console.log('count is '+count);
                })
            }
        })
        }
    )
}

function saveRentChangeStatus(obj) {
    var whereStr = {
        'objectId': obj._objID.toLocaleString(),
        'renter': obj._renter.toLocaleString()
    };
    var updateStr = {
        'rented': obj._rented
    };
    console.log(whereStr);
    console.log(updateStr);
    RentingModel.updateOne(whereStr, updateStr, function (err, result) {
        if (err){
            console.log(err);
        }else {
            console.log('change status success --'+obj._rented);
        }
    })
}

function saveTransaction(article) {
    TransactionModel.findOne({
            'articleId': article._id.toLocaleString()
        },function (err, result) {
            if (result != null){
                return
            }
            var transactionRecord = new TransactionModel({
                articleId: article._id,
                seller: article._seller,
                buyer: article._buyer,
                articlePhoto: article._photo,
                articleName: article._name,
                price: article._price,
                createAt: article._createAt
            });
            transactionRecord.save(function (err) {
                if (err){
                    handleError(err)
                }else {
                    console.log('buy success');
                    TransactionModel.count({}, function (err, count) {
                        console.log('count is '+count);
                    })
                }
            })
        }
    )
}

rentEventListener();
returnEventListener();
TransactionEventListener();