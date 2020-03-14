// Import libraries we need.
//import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract'
import ShareApp_artifacts from '../../build/contracts/ShareApp.json'
import Market_artifacts from '../../build/contracts/MarketPlace.json'
import Comment_artifacts from '../../build/contracts/Comment.json'
import User_artifacts from '../../build/contracts/UserApp.json'
var Market = contract(Market_artifacts);
var ShareApp = contract(ShareApp_artifacts);
var Comment = contract(Comment_artifacts);
var User = contract(User_artifacts);
const categories = ["Clothing","Food","Electronic","Book","Jewellery","Crafts","Others"];
window.App = {
  account: 0x0,
  start: function() {
    var self = this;
    ShareApp.setProvider(web3.currentProvider);
    Market.setProvider(web3.currentProvider);
    Comment.setProvider(web3.currentProvider);
    User.setProvider(web3.currentProvider);
    self.displayAccountInfo();
    self.setCookies();
  },

  postObjectForRent: function(_objID){
    ShareApp.deployed().then(function (instance) {
      instance.getObj(_objID).then(function (object) {
        if(App.account == object[0]){
          document.getElementById("rentButton").style.display = "none";
          document.getElementById("returnButton").style.display = "none";
        } else if(object[7] == false){
          document.getElementById("rentButton").style.display = "inline";
          document.getElementById("returnButton").style.display = "none";
        } else if (object[7] == true){
          if (App.account != object[5]){
            document.getElementById("rentButton").style.display = "none";
            document.getElementById("returnButton").style.display = "none";
          }else{
            document.getElementById("returnButton").style.display = "inline";
            document.getElementById("rentButton").style.display = "none";
          }
        }
        document.getElementById("objPhoto").src = 'http://localhost:8080/ipfs/' + object[1];
        document.getElementById("objName").innerHTML = object[2];
        document.getElementById("objCreator").innerHTML = object[0];
        document.getElementById("objPriceDaily").innerHTML = web3.fromWei(object[3],'ether') + " ETH";
        document.getElementById("objDeposit").innerHTML = web3.fromWei(object[4],'ether') + " ETH";
        document.getElementById("objRenterAddress").innerHTML = (object[5] == "0x0000000000000000000000000000000000000000")?"no renter":object[5];
        document.getElementById("objRenterSince").innerHTML = (object[6]==0)?"null":(new Date(object[6]*1000)).toLocaleDateString();
        document.getElementById("objRented").innerHTML = object[7];
        document.getElementById("objDetail").innerHTML = object[8];
        document.getElementById("_objDetail").innerText = object[8];
      });
    });
  },

  postObjectForSell: function(_objID){
    var marketPlaceInstance;
    Market.deployed().then(function(instance) {
      marketPlaceInstance = instance;
      marketPlaceInstance.articles(_objID).then(function (article) {
        var objPhoto = 'http://localhost:8080/ipfs/' + article[2];
        document.getElementById("_objName").innerHTML = article[3];
        for (var i=1;i<=4;i++){
          document.getElementById("side-photo-"+i).src = objPhoto;
          document.getElementById("main-photo-"+i).src = objPhoto;
        }
        document.getElementById("_objPrice").innerHTML = web3.fromWei(article[5],'ether') + " ETH";
        document.getElementById("_objCreator").innerHTML = article[1];
        document.getElementById("_objDetail").innerHTML = article[4];
        document.getElementById("_objNumber").innerHTML = article[6];
        if (article[6] == 0){
          document.getElementById("article-buy").style.display = 'none';
          document.getElementById("article-cart").style.display = 'none';
          document.getElementById("out-of-stock").style.display = 'inline';
        }
      })
    })
  },

  rentObj: function(objectID){
    console.log(App.account);
    var mainInstance;
    ShareApp.deployed().then(function(instance) {
      mainInstance = instance;
      return mainInstance.getObjectDeposit(objectID);
    }).then(function(price){
      return mainInstance.rentObj(objectID,{from:App.account,value:parseInt(price), gas:500000});
    }).then(function(tx){
      window.location.reload();
      console.log(tx);
    }).catch(function(e){
      console.log(e);
    });
  },

  returnObj:function(objectID){
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

  buyArticle: function(_articleId) {
    var marketInstance;
    Market.deployed().then(function(instance) {
      marketInstance = instance;
      marketInstance.articles(_articleId).then(function (article) {
        return article[5];
      }).then(function (_price) {
        return marketInstance.buyArticle(_articleId, 1, {
          from: App.account,
          value: _price,
          gas: 500000
        });
      }).then(function (result) {
        window.location.href="productDetails.html?id="+_articleId;
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
    var commentInstance;
    Comment.deployed().then(function (instance) {
      commentInstance = instance;
      return instance.getArticleCommentsLength.call(articleId);
    }).then(async function (size) {
      for (var i = size - 1; i >= 0; i--) {
        await commentInstance.getArticleComment(articleId, i).then(function (article) {
          Market.deployed().then(function (marketInstance) {
            return marketInstance.isBuyer(articleId, article[1]);
          }).then(function (isBuyer) {
            var as = "";
            if (isBuyer) {
              as = " (buyer)";
            }
            User.deployed().then(function (userInstance) {
              return userInstance.getUserName(article[1]);
            }).then(function (userName) {
              App.displayComment(article[0], userName + as, article[2], article[3]);
            }).catch(function (err) {
              App.displayComment(article[0], article[1] + as, article[2], article[3]);
            })
          })
        });
      }
    });
  },

  getArticleCommentLength: function(articleId) {
    Comment.deployed().then(function (instance) {
      instance.getArticleCommentsLength.call(articleId).then(function (res) {
        document.getElementById("comment-length").innerText = res;
      })
    })
  },

  getObjectCommentLength: function(objectId) {
    Comment.deployed().then(function (instance) {
      instance.getObjectCommentsLength.call(objectId).then(function (res) {
        document.getElementById("comment-length").innerText = res;
      })
    })
  },

  getObjectComment: function (objectId) {
    var commentInstance;
    Comment.deployed().then(function (instance) {
      commentInstance = instance;
      return instance.getObjectCommentsLength.call(objectId);
    }).then(async function (size) {
      for (var i=size-1;i>=0;i--){
        await commentInstance.getObjectComment(objectId,i).then(function (object) {
          User.deployed().then(function (userInstance) {
            return userInstance.getUserName(object[1]);
          }).then(function (userName) {
            App.displayComment(object[0],userName,object[2],object[3]);
          }).catch(function (err) {
            App.displayComment(object[0],object[1],object[2],object[3]);
          })
        })
      }
    });
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
    Market.deployed().then(function (marketIntance) {
      return marketIntance.isBuyer(_articleId,App.account);
    }).then(function (res) {
      if (res){
        User.deployed().then(function (userInstance) {
          var address = document.getElementById("_objCreator").innerHTML;
          userInstance.modifyUserCredit(stars,address,{
            from:App.account
          });
        })
      }
      Comment.deployed().then(function (instance) {
        return instance.addArticleComment(_articleId,stars,comment,{from:App.account});
      }).then(function (res) {
        window.location.href="productDetails.html?id="+_articleId;
      }).catch(function (err) {
        console.log(err);
      })
    });

  },

  addObjectComment: function (_objectId) {
    var stars = document.getElementById("selectStars").value;
    var comment = document.getElementById("commentContent").value;

    Comment.deployed().then(function (instance) {
      return instance.addObjectComment(_objectId,stars,comment,{from:App.account,gas:500000});
    }).then(function (res) {
      window.location.href="objectDetails.html?id="+_objectId;
    }).catch(function (err) {
      console.log(err);
    })
  },

  addToCart: function (article_id) {
    var ids = Cookies.get('cart-map');
    var ids_size = Cookies.get('cart-size');
    var totalPrice = Cookies.get('cart-price');

    ids = (ids == null)?(new Map()):(_objToStrMap(JSON.parse(ids)));
    totalPrice = (totalPrice == null)?0:parseInt(totalPrice);
    ids_size = (ids_size == null)?0:parseInt(ids_size);

    if (ids.get("article"+article_id) == null){
      ids.set("article"+article_id,1);
    }else {
      var num = parseInt(ids.get("article"+article_id));
      num++;
      ids.set("article"+article_id,num);
    }
    Cookies.set('cart-map',JSON.stringify(_strMapToObj(ids)));
    console.log(ids);//
    ids_size++;
    Cookies.set('cart-size',ids_size);
    document.getElementById("cartNumber").innerText = ids_size;
    Market.deployed().then(function (instance) {
      instance.articles(article_id).then(function (article) {
        var etherPrice = web3.fromWei(article[5], "ether");
        totalPrice += parseInt(etherPrice);
        document.getElementById("cartPrice").innerText = totalPrice+" ETH";
        Cookies.set('cart-price',totalPrice);
      })
    });
  },

  setCookies: function(){
    var ids = Cookies.get('cart-map');
    var ids_size = Cookies.get('cart-size');
    var totalPrice = Cookies.get('cart-price');

    ids = (ids == null)?(new Map()):(_objToStrMap(JSON.parse(ids)));
    totalPrice = (totalPrice == null)?0:parseInt(totalPrice);
    ids_size = (ids_size == null)?0:parseInt(ids_size);

    ids.forEach(function (value, key) {
      console.log(key,value);
      if(value == 0){
        ids.delete(key);
      }
    });
    Cookies.set('cart-map',JSON.stringify(_strMapToObj(ids)));
    document.getElementById("cartNumber").innerText = ids_size;
    document.getElementById("cartPrice").innerText = totalPrice+" ETH";
  }
};

function _strMapToObj(strMap){
  let obj= Object.create(null);
  for (let[k,v] of strMap) {
    obj[k] = v;
  }
  return obj;
}

function _objToStrMap(obj){
  let strMap = new Map();
  for (let k of Object.keys(obj)) {
    strMap.set(k,obj[k]);
  }
  return strMap;
}

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
