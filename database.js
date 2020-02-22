const express = require('express')()
const mongoose = require('mongoose');

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
