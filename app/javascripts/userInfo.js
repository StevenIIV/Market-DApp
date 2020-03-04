import { default as contract } from 'truffle-contract'
import ShareApp_artifacts from '../../build/contracts/ShareApp.json'
import Market_artifacts from '../../build/contracts/MarketPlace.json'
import UserApp_artifacts from  '../../build/contracts/UserApp.json'
var Market = contract(Market_artifacts);
var ShareApp = contract(ShareApp_artifacts);
var UserApp = contract(UserApp_artifacts);
const offchainServer = "http://localhost:3000";
const ipfsURL = "http://localhost:8080/ipfs/";
const articleCategories = ["Clothing","Food","Electronic","Book","Jewellery","Crafts","Others"];
window.App = {
    account: 0x0,
    start: function() {
        var self = this;
        ShareApp.setProvider(web3.currentProvider);
        Market.setProvider(web3.currentProvider);
        self.displayAccountInfo();
        self.getUserSoldRecordByETH();
        self.getUserBoughtRecordByETH();
    },

    chooseSection: function(section_id){
        $('#pills-tabContent').innerHTML = "";
        var self = this;
        switch (section_id) {
            case 1:
                self.getUserSoldRecordByETH();
                break;
            case 2:
                self.getUserBoughtRecordByETH();
                break;
            case 3:
                self.getUserRentRecordByETH();
                break;
            case 4:
                self.getUserRentedRecordByETH();
                break;
        }
    },

    getUserRentRecordByETH: function(){
        var shareInstance;
        ShareApp.deployed().then(function (instance) {
            shareInstance = instance;
            return shareInstance.getUserRent.call(App.account);
        }).then(function (ids) {
            for (let element of ids){
                shareInstance.getObj(element).then(function (object) {
                    App.displayRentInfo(element,object[1],object[2],object[3],object[4],object[7],1582799231);
                })
            }
        })
    },

    getUserSoldRecordByETH: function(){
        var marketInstance;
        Market.deployed().then(function (instance) {
           marketInstance = instance;
           return marketInstance.getUserSold.call(App.account);
        }).then(function (ids) {
            for (let element of ids){
                marketInstance.articles(element).then(function (article) {
                    App.displayTransactionInfo(0, article[0], article[2],article[3],article[5],article[7],1582799231,article[6]);
                })
            }
        })
    },

    getUserRentedRecordByETH: function(){
        var shareInstance;
        ShareApp.deployed().then(function (instance) {
            shareInstance = instance;
            return shareInstance.getUserRented.call(App.account);
        }).then(function (ids) {
            for(let element of ids){
                shareInstance.getObj(element).then(function (object) {

                })
            }
        })
    },

    getUserBoughtRecordByETH: function(){
        var marketInstance;
        Market.deployed().then(function (instance) {
            marketInstance = instance;
            return marketInstance.getUserBought.call(App.account);
        }).then(function (ids) {
            for(let element of ids){
                marketInstance.articles(element).then(function (article) {
                    App.displayTransactionInfo(1, article[0], article[2],article[3],article[5],article[7],1582799231,1);
                })
            }
        })
    },
    
    displayRentInfo: function(objectId, objectPhoto, objectName, priceDaily, deposit, rented, createAt){
        var row = document.getElementById("rentHistory").insertRow(0);
        var cell0 = row.insertCell(0);   //photo
        var cell1 = row.insertCell(1);  //id
        var cell2 = row.insertCell(2);  //name
        var cell3 = row.insertCell(3);  //priceDaily
        var cell4 = row.insertCell(4);  //deposit
        var cell5 = row.insertCell(5);  //rented
        var cell6 = row.insertCell(6);  //time
        cell0.innerHTML = "<img src='"+ipfsURL+objectPhoto+"'>";
        cell1.innerHTML = objectId;
        cell2.innerHTML = objectName;
        cell3.innerHTML = priceDaily;
        cell4.innerHTML = deposit;
        cell5.innerHTML = rented;
        cell6.innerHTML = (new Date(createAt*1000)).toLocaleDateString();
    },
    
    displayTransactionInfo: function(target, articleId, articlePhoto, articleName, price, articleType, createAt, number){
        var articlesContent = $('#pills-tabContent');
        var etherPrice = web3.fromWei(price, "ether");

        var articleTemplate = $('#article-record-template');
        articleTemplate.find('.user-avatar-xxl,.photo-hash').attr('src',ipfsURL + articlePhoto);
        articleTemplate.find('.name').text(articleName);
        articleTemplate.find('.price').text(etherPrice);
        articleTemplate.find('.type').text(articleCategories[articleType]);
        articleTemplate.find('.createAt').text((new Date(createAt*1000)).toLocaleDateString());

        if (target == 0 && number > 0){
            articleTemplate.find('.list-button').attr("style","display:inline");
        }
        articlesContent.append(articleTemplate.html());
    },

    getUserRentRecordByMongo: function() {
        web3.eth.getCoinbase(function(err, account) {
            var acc = account;
            $.ajax({
                url: offchainServer + '/getRentRecords',
                type:'get',
                contentType: "application/json; charset=utf-8",
                data: {
                    _renter: acc
                }
            }).done(function (response) {
                console.log(response.length);
                if (response.length == 0){
                    document.getElementById("rentHistory").innerHTML = 'No records found';
                }

                while (response.length > 0){
                    let chunks = response.splice(0,8);
                    chunks.forEach(function (value) {
                        this.displayRentInfo(value.objectId,value.objectPhoto,value.objectName,value.priceDaily,value.deposit,value.rented,value.createAt);
                    })
                }
            })
        });
    },

    getUserTransactionRecordByMongo: function() {
        web3.eth.getCoinbase(function(err, account) {
            var acc = account;
            $.ajax({
                url: offchainServer + '/getTransactionRecords',
                type: 'get',
                contentType: "application/json; charset=utf-8",
                data: {
                    _buyer: acc
                }
            }).done(function (response) {
                console.log(response.length);
                if (response.length == 0){
                    document.getElementById("transactionHistory").innerHTML = 'No records found';
                }
                while (response.length > 0){
                    let chunks = response.splice(0,6);
                    chunks.forEach(function (value) {
                        this.displayTransactionInfo(value.articleId,value.articlePhoto,value.articleName,value.seller,value.price,value.createAt);
                    })
                }
            })
        });
    },

    displayAccountInfo: function() {
        web3.eth.getCoinbase(function(err, account) {
            if (err === null) {
                App.account = account;
                $("#account").text(account);
                web3.eth.getBalance(account, function(err, balance) {
                    if (err === null) {
                        $("#accountBalance").text(web3.fromWei(balance, "ether") + " ETH");
                    }
                });
            }
        });
    }
};

window.addEventListener('load', function() {
    // Checking if Web3 has been injected by the browser (Mist/MetaMask)
    if (typeof web3 !== 'undefined') {
        console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 MetaCoin, ensure you've configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask")
        // Use Mist/MetaMask's provider
        window.web3 = new Web3(web3.currentProvider);
    } else {
        console.warn("No web3 detected. Falling back to http://localhost:8545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
        // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
        window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
        // window.web3 = new Web3(new Web3.providers.HttpProvider("219.216.65.127:8545"));
    }
    // account = web3.eth.coinbase;
    App.start();
});
