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
const objectCategories = ["Clothing","Electronic","Book","Crafts","Others"];
window.App = {
    account: 0x0,
    start: function() {
        var self = this;
        ShareApp.setProvider(web3.currentProvider);
        Market.setProvider(web3.currentProvider);
        self.displayAccountInfo();
        self.getUserSoldRecordByETH();
    },

    chooseSection: function(section_id){
        $('#pills-tabContent').empty();
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
                    if (object[10] == false){
                        App.displayRentInfo(0,element,object[1],object[2],object[3],object[4],object[9],object[7],1582799231,object[5]);
                    }
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
                    if (article[8] == false){
                        App.displayTransactionInfo(0, article[0], article[2],article[3],article[5],article[7],1582799231,article[6]);
                    }
                })
            }
        })
    },

    getUserRentedRecordByETH: function(){
        var shareInstance;
        var idList;
        var timeList;
        ShareApp.deployed().then(function (instance) {
            shareInstance = instance;
            return shareInstance.getUserRented.call(App.account);
        }).then(function (ids) {
            idList = ids;
            return shareInstance.getUserRentedTime.call(App.account);
        }).then(async function(times){
            timeList = times;
            for(var i=0;i<idList.length;i++){
                await shareInstance.getObj(idList[i]).then(function (object) {
                    console.log(timeList[i] +" "+ object[6]);
                    var isOutdate = true;
                    if (parseInt(timeList[i]) == parseInt(object[6])){
                        isOutdate = false;
                    }
                    App.displayRentInfo(1,idList[i],object[1],object[2],object[3],object[4],object[9],object[7],object[6],object[5],isOutdate);
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
    
    displayRentInfo: function(target, objectId, objectPhoto, objectName, priceDaily, deposit, objectType, rented, createAt, renter, isOutdate){
        console.log(isOutdate);
        var objectsContent = $('#pills-tabContent');
        var etherPriceDaily = web3.fromWei(priceDaily, "ether");
        var etherDeposit = web3.fromWei(deposit, "ether");

        var objectTemplate = $('#object-record-template');
        objectTemplate.find('.user-avatar-xxl,.photo-hash').attr('src',ipfsURL + objectPhoto);
        objectTemplate.find('.object-href').attr('href',"objectDetails.html?id="+objectId);
        objectTemplate.find('.name').text(objectName);
        objectTemplate.find('.price_daily').text(etherPriceDaily);
        objectTemplate.find('.deposit').text(etherDeposit);
        objectTemplate.find('.type').text(objectCategories[objectType]);
        objectTemplate.find('.createAt').text((createAt==0)?"null":(new Date(createAt*1000)).toLocaleDateString());

        if (target == 0 && rented == false){
            objectTemplate.find('.btn,.btn-primary,.object-edit').attr("onclick"," App.fillInEditData_object("+objectId+")");
            objectTemplate.find('.object-delete').attr("onclick","App.deleteObject("+objectId+")");
            objectTemplate.find('.object-list-button').attr("style","display:inline");
        } else if (target == 0 && rented == true){
            objectTemplate.find('.renting').attr("style","display:inline");
            objectTemplate.find('.renter').text(renter);
        } else if (target == 1 && renter == App.account && isOutdate == false){
            objectTemplate.find('.to-be-return').attr("style","display:inline");
            objectTemplate.find('.btn,.btn-success,.returnButton').attr('onclick',"App.returnObj("+objectId+")");
        } else if(target == 1 && isOutdate == true){
            objectTemplate.find('.returned').attr("style","display:inline");
        }
        objectsContent.append(objectTemplate.html());
        objectTemplate.find('.object-list-button').attr("style","display:none");
        objectTemplate.find('.renting').attr("style","display:none");
        objectTemplate.find('.to-be-return').attr("style","display:none");
        objectTemplate.find('.returned').attr("style","display:none");
    },
    
    displayTransactionInfo: function(target, articleId, articlePhoto, articleName, price, articleType, createAt, number){
        var articlesContent = $('#pills-tabContent');
        var etherPrice = web3.fromWei(price, "ether");

        var articleTemplate = $('#article-record-template');
        articleTemplate.find('.user-avatar-xxl,.photo-hash').attr('src',ipfsURL + articlePhoto);
        articleTemplate.find('.article-href').attr('href',"productDetails.html?id="+articleId);
        articleTemplate.find('.name').text(articleName);
        articleTemplate.find('.price').text(etherPrice);
        articleTemplate.find('.type').text(articleCategories[articleType]);
        articleTemplate.find('.createAt').text((createAt==0)?"null":(new Date(createAt*1000)).toLocaleDateString());

        if (target == 0 && number > 0){
            articleTemplate.find('.btn,.btn-primary,.article-edit').attr("onclick","App.fillInEditData_article("+articleId+")");
            articleTemplate.find('.article-delete').attr("onclick","App.deleteArticle("+articleId+")");
            articleTemplate.find('.article-list-button').attr("style","display:inline");

        } else if(target ==0 && number ==0 ){
            articleTemplate.find('.sold-out').attr("style","display:inline");
        }
        articlesContent.append(articleTemplate.html());
        articleTemplate.find('.article-list-button').attr("style","display:none");
        articleTemplate.find('.sold-out').attr("style","display:none");
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

    fillInEditData_article: function(articleId){
        Market.deployed().then(function (instance) {
            return instance.articles(articleId).then(function (article) {
                document.getElementById("article_id").value = articleId;
                document.getElementById("article_name").value = article[3];
                document.getElementById("article_price").value = web3.fromWei(article[5],'ether');
                document.getElementById("article_Number").value = article[6];
                document.getElementById("article_Type").value = article[7];
                document.getElementById("article_description").value = article[4];
            })
        })
    },

    fillInEditData_object: function(objectId){
        ShareApp.deployed().then(function (instance) {
            return instance.getObj(objectId);
        }).then(function (object) {
            document.getElementById("object_id").value = objectId;
            document.getElementById("objectName").value = object[2];
            document.getElementById("objectPriceDaily").value =  web3.fromWei(object[3],'ether');
            document.getElementById("objectDeposit").value =  web3.fromWei(object[4],'ether');
            document.getElementById("objectDetail").value = object[8];
            document.getElementById("objectType").value = object[9];
        })
    },

    returnObj: function(objectID){
        var mainInstance;
        ShareApp.deployed().then(function(instance){
            mainInstance = instance;
            return mainInstance.returnObj(objectID,{from:App.account});
        }).then(function(tx){
            window.location.reload();
            console.log(tx);
        }).catch(function(e){
            console.log(e);
        });
    },

    modifyArticle: function(){
        var articleId = document.getElementById("article_id").value;
        var articleName = document.getElementById("article_name").value;
        var articlePrice = document.getElementById("article_price").value;
        var price = web3.toWei(parseFloat(articlePrice || 0), "ether");
        var articleNumber = document.getElementById("article_Number").value;
        var articleDescription = document.getElementById("article_description").value;
        var articleType = document.getElementById("article_Type").value;
        console.log(articleName);
        console.log(articleId);
        console.log(articlePrice);
        console.log(articleNumber);
        console.log(articleDescription);
        console.log(articleType);
        Market.deployed().then(function (instance) {
            return instance.modifyArticle(articleId,articleName,articleDescription,price,articleNumber,articleType,{
                from: App.account,
                gas: 500000
            });
        }).then(function (res) {
            App.chooseSection(1);
        }).catch(function (err) {
            console.log(err);
        })
    },

    deleteArticle: function(articleId){
        Market.deployed().then(function (instance) {
            return instance.deleteArticle(articleId,0,{
                from: App.account,
                gas: 500000
            });
        }).then(function (res) {
            App.chooseSection(1);
        }).catch(function (err) {
            console.log(err);
        })
    },

    modifyObject: function(){
        var object_id =  document.getElementById("object_id").value;
        var objectName = document.getElementById("objectName").value;
        var objectPriceDaily = document.getElementById("objectPriceDaily").value;
        var priceDaily = web3.toWei(parseFloat(objectPriceDaily || 0), "ether");
        var objectDeposit = document.getElementById("objectDeposit").value;
        var deposit = web3.toWei(parseFloat(objectDeposit || 0), "ether");
        var objectDetail = document.getElementById("objectDetail").value;
        var objectType = document.getElementById("objectType").value;

        ShareApp.deployed().then(function (instance) {
            instance.modifyObject(object_id,objectName,priceDaily,deposit,objectDetail,objectType,{
                from: App.account,
                gas: 500000
            }).then(function (res) {
                App.chooseSection(3);
            }).catch(function (err) {
                console.log(err);
            })
        })
    },

    deleteObject: function(objectId){
        ShareApp.deployed().then(function (instance) {
            return instance.deleteObject(objectId,{
                from: App.account,
                gas: 500000
            });
        }).then(function (res) {
            App.chooseSection(3);
        }).catch(function (err) {
            console.log(err);
        })
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
