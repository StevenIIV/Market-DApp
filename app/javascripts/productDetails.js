//import "../stylesheets/app.css";
// Import libraries we need.
//import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract'
import ShareApp_artifacts from '../../build/contracts/ShareApp.json'
import Market_artifacts from '../../build/contracts/MarketPlace.json'
import Comment_artifacts from '../../build/contracts/Comment.json'
var Market = contract(Market_artifacts);
var ShareApp = contract(ShareApp_artifacts);
var Comment = contract(Comment_artifacts);
const categories = ["Clothing","Food","Electronic","Book","Jewellery","Crafts","Others"];
window.App = {
  account: 0x0,
  start: function() {
    var self = this;
    ShareApp.setProvider(web3.currentProvider);
    Market.setProvider(web3.currentProvider);
    Comment.setProvider(web3.currentProvider);
    self.displayAccountInfo();
  },

  setStatus: function(message) {
    var status = document.getElementById("status");
    status.innerHTML = message;
  },

  postObjectForRent: function(_objID){
    var mainInstance;
    var numObjects;
    var _objPhoto;
    var _objName;
    var _objCreator;
    var _objPriceDaily;
    var _objDeposit;
    var _objRenterAddress;
    var _objRenterSince;
    var _objRented;
    var _objDetail;
    var _objType;
    ShareApp.deployed().then(function(instance){
      mainInstance = instance;
      return instance.getNumObjects.call();
    }).then(function(result){
      numObjects = result.toNumber();
      return mainInstance.getObjectName.call(_objID);
    }).then(function(objName){
      _objName = objName;
      return mainInstance.getObjectPhoto.call(_objID);
    }).then(function(objPhoto){
      _objPhoto = 'http://localhost:8080/ipfs/' + objPhoto;
      return mainInstance.getObjectCreator.call(_objID);
    }).then(function(objCreator){
      _objCreator = objCreator;
      return mainInstance.getObjectPriceDaily.call(_objID);
    }).then(function(objPriceDaily){
      _objPriceDaily = objPriceDaily.toNumber();
      return mainInstance.getObjectDeposit.call(_objID);
    }).then(function(objDeposit){
      _objDeposit = objDeposit.valueOf();
      return mainInstance.getObjectRenterAddress.call(_objID);
    }).then(function(objRenterAddress){
      _objRenterAddress = (objRenterAddress == "0x0000000000000000000000000000000000000000")?"no renter":objRenterAddress;
      return mainInstance.getObjectRenterSince.call(_objID);
    }).then(function(objRenterSince){
      _objRenterSince = objRenterSince.valueOf();
      return mainInstance.objectIsRented.call(_objID);
    }).then(function(objRented){
      _objRented = objRented;
      return mainInstance.getObjectDetail.call(_objID);
    }).then(function(objDetail){
      _objDetail = objDetail;
      return mainInstance.getObjectCategories.call(_objID);
    }).then(function (objType) {
      _objType = objType;
      if(_objID < numObjects && _objID >= 0){

        if(App.account == _objCreator){
          document.getElementById("rentButton").style.display = "none";
          document.getElementById("returnButton").style.display = "none";
        } else if(_objRented == false){
          document.getElementById("rentButton").style.display = "inline";
          document.getElementById("returnButton").style.display = "none";
        } else if (_objRented == true){
          if (App.account != _objRenterAddress){
            document.getElementById("rentButton").style.display = "none";
            document.getElementById("returnButton").style.display = "none";
          }else{
            document.getElementById("returnButton").style.display = "inline";
            document.getElementById("rentButton").style.display = "none";
          }
        }

        document.getElementById("objPhoto").src = _objPhoto;
        document.getElementById("objName").innerHTML = _objName;
        document.getElementById("objCreator").innerHTML = _objCreator;
        document.getElementById("objPriceDaily").innerHTML = _objPriceDaily;
        document.getElementById("objDeposit").innerHTML = _objDeposit;
        document.getElementById("objRenterAddress").innerHTML = _objRenterAddress;
        document.getElementById("objRenterSince").innerHTML = (new Date(_objRenterSince*1000)).toLocaleDateString();;
        document.getElementById("objRented").innerHTML = _objRented;
        document.getElementById("objDetail").innerHTML = _objDetail;
        //document.getElementById("objType").innerHTML = categories[_objType];
      }else{
        alert("There is no object with id " + id); // error message
      }
    })
  },

  postObjectForSell: function(_objID){
    var marketPlaceInstance;
    Market.deployed().then(function(instance) {
      marketPlaceInstance = instance;
      marketPlaceInstance.articles(_objID).then(function (article) {
        var objPhoto = 'http://localhost:8080/ipfs/' + article[3];
        document.getElementById("_objName").innerHTML = article[4];
        //document.getElementById("_objPhoto").innerHTML = "<img src='"+objPhoto+"'>";
        document.getElementById("_objPrice").innerHTML = article[6];
        document.getElementById("_objCreator").innerHTML = article[1];
        document.getElementById("_objDetail").innerHTML = article[5];
        document.getElementById("_objNumber").innerHTML = article[7];
        //document.getElementById("_objType").innerHTML = categories[article[8]];
      })
    })
  },

  rentObj: function(){
    console.log(App.account);
    var mainInstance;

    var objectID = parseInt(document.getElementById("objID").innerHTML);
    // console.log(objectID+1);
    ShareApp.deployed().then(function(instance){
      mainInstance = instance;
      return mainInstance.rentObj(objectID,{from:App.account,value:10000000000000, gas:500000});
    }).then(function(tx){
      window.location.reload();
      console.log(tx);
    }).catch(function(e){
      console.log(e);
    });
  },

  returnObj:function(){
    var mainInstance;

    var objectID = parseInt(document.getElementById("objID").innerHTML);
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

  remove: function(){
    var self = this;

    var meta;
    ShareApp.deployed().then(function(instance){
      meta = instance;
      return meta.remove({from:APP.account});
      }).then(function(){
        self.setStatus("remove success!");
      }).catch(function(e){
        console.log(e);
        self.setStatus("Error remove;see log.");
      });
  },

  buyArticle: function(_articleId) {
    Market.deployed().then(function(instance) {
          instance.articles(_articleId).then(function (article) {
            return article[6];
          }).then(function (_price) {
            return instance.buyArticle(_articleId, {
              from: App.account,
              value: _price,
              gas: 500000
            });
          }).then(function (result) {
            window.location.href="market.html";
          }).catch(function (err) {
            console.error(err);
          });
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
  },

  getArticleComment: function (articleId) {
    Comment.deployed().then(function (instance) {
      return instance.getArticleCommentsLength.call(articleId);
    }).then(function (size) {
      Comment.deployed().then(function (instance) {
        for (var i=size-1;i>=0;i--){
          instance.getArticleComment(articleId,i).then(function (article) {
            App.displayComment(article[0],article[1],article[2],article[3]);
          })
        }
      });
    })
  },

  getObjectComment: function (objectId) {
    Comment.deployed().then(function (instance) {
      return instance.getObjectCommentsLength.call(objectId);
    }).then(function (size) {
      Comment.deployed().then(function (instance) {
        for (var i=size-1;i>=0;i--){
          instance.getObjectComment(objectId,i).then(function (article) {
            App.displayComment(article[0],article[1],article[2],article[3]);
          })
        }
      });
    })
  },

  displayComment: function (time, sender, rating, comment) {
    var commentPanel = $('#displayComment');
    var commentTemplate = $('#commentTemplate');
    commentTemplate.find('.createTime').text(new Date(time*1000).toLocaleDateString()+""+new Date(time*1000).toLocaleTimeString());
    commentTemplate.find('.creator').text(sender);
    commentTemplate.find('.comment').text(comment);
    for (var j=1;j<=rating;j++){
      commentTemplate.find('.rating').append(" <div class='rating-left'><img src='assets/img/star-.png' alt='' class='img-responsive'></div>")
    }
    for (var j=1;j<=5-rating;j++){
      commentTemplate.find('.rating').append(" <div class='rating-left'><img src='assets/img/star.png' alt='' class='img-responsive'></div>")
    }
    commentPanel.append(commentTemplate.html());
    commentTemplate.find('.rating').empty();
  },

  addArticleComment: function (_articleId) {
    var stars = document.getElementById("selectStars").value;
    var comment = document.getElementById("commentContent").value;

    Comment.deployed().then(function (instance) {
      return instance.addArticleComment(_articleId,stars,comment,{from:App.account,gas:500000});
    }).then(function (res) {
      window.location.href="productDetails.html?id="+_articleId;
    }).catch(function (err) {
      console.log(err);
    })
  },

  addObjectComment: function () {

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
