import { default as contract } from 'truffle-contract'
import Market_artifacts from '../../build/contracts/MarketPlace.json'
var Market = contract(Market_artifacts);
const ipfsAPI = require('ipfs-api');
const ipfs = ipfsAPI({
  host: 'localhost',
  port: '5001',
  protocol: 'http'
});
var reader;
const categories = ["Clothing","Food","Electronic","Book","Jewellery","Crafts","Others"];
const offchainServer = "http://localhost:3000";
window.App = {
  account: 0x0,
  start: function() {
    var self = this;
    Market.setProvider(web3.currentProvider);
    $("#product-image").change(function(event) {
      const file = event.target.files[0]
      reader = new window.FileReader()
      reader.readAsArrayBuffer(file)
    });
    self.displayAccountInfo();
    self.reloadAllArticles();
    self.setCookies();
  },

  searchArticleByName: function() {
    var name = document.getElementById("search-name").value;
    document.getElementById("articlesRow").innerHTML = "";
    for (var i=0;i<=6;i++){
      document.getElementById("pills-tab-"+i).className = 'nav-link';
    }
    $.ajax({
      url: offchainServer + '/getArticleByName',
      type:'get',
      contentType: "application/json; charset=utf-8",
      data: {
        _name: name
      }
    }).done(function (response) {
      console.log(response.length);
      if (response.length == 0){
        console.log('No records found');
      }
      while (response.length > 0){
        let chunks = response.splice(0,8);
        chunks.forEach(function (value) {
          App.displayArticle(
              value.articleId,
              value.articlePhoto,
              value.articleName,
              value.price,
              value.categories
          );
        })
      }
    }).fail(function (err) {
      var ids;
      var marketPlaceInstance;
      Market.deployed().then(function(instance){
        marketPlaceInstance = instance;
        return instance.findByNames.call(name);
      }).then(function (res) {
        ids = res;
        for (let element of ids){
          let id = element.toNumber();
          marketPlaceInstance.articles(id).then(function (article) {
            if (article[6] > 0 && article[8] == false){
              App.displayArticle(
                  article[0],
                  article[2],
                  article[3],
                  article[5],
                  article[7]
              );
            }
          })
        }
      })
    });
  },

  reloadAllArticles:function(){
    document.getElementById("articlesRow").innerHTML = "";
    $.ajax({
      url: offchainServer + '/getAllArticles',
      type:'get',
      contentType: "application/json; charset=utf-8"
    }).done(function (response) {
      console.log(response.length);
      if (response.length == 0){
        console.log('No records found');
      }
      while (response.length > 0){
        let chunks = response.splice(0,8);
        chunks.forEach(function (value) {
          App.displayArticle(
              value.articleId,
              value.articlePhoto,
              value.articleName,
              value.price,
              value.categories
          );
        })
      }
    }).fail(function (err) {
      var marketPlaceInstance;
      Market.deployed().then(function(instance) {
        marketPlaceInstance = instance;
        return marketPlaceInstance.getNumberOfArticles();
      }).then(async function(size){
        for (var i=1;i<=size;i++){
          await marketPlaceInstance.articles(i).then(function(article) {
            if (article[6] > 0 && article[8] == false){
              App.displayArticle(
                  article[0],
                  article[2],
                  article[3],
                  article[5],
                  article[7]
              );
            }
          });
        }
      }).catch(function(err) {
        console.log(err.message);
        App.loading = false;
      });
    });

  },

  reloadArticles: function(type) {
    document.getElementById("articlesRow").innerHTML = "";
    $.ajax({
      url: offchainServer + '/getArticleByType',
      type:'get',
      contentType: "application/json; charset=utf-8",
      data: {
        _type: type
      }
    }).done(function (response) {
      console.log(response.length);
      if (response.length == 0){
        console.log('No records found');
      }
      while (response.length > 0){
        let chunks = response.splice(0,8);
        chunks.forEach(function (value) {
          App.displayArticle(
              value.articleId,
              value.articlePhoto,
              value.articleName,
              value.price,
              value.categories
          );
        })
      }
    }).fail(function (err) {
      var marketPlaceInstance;
      Market.deployed().then(function(instance) {
        marketPlaceInstance = instance;
        return marketPlaceInstance.findByType.call(type);
      }).then(function(ids){
        for (let articleId of ids){
          marketPlaceInstance.articles(articleId.toNumber()).then(function(article) {
            if (article[6] > 0 && article[8] == false){
              App.displayArticle(
                  article[0],
                  article[2],
                  article[3],
                  article[5],
                  article[7]
              );
            }
          });
        }
      }).catch(function(err) {
        console.log(err.message);
        App.loading = false;
      });
    });
  },

  displayArticle: function(id, photo, name, price, type) {
    // Retrieve the article placeholder
    var articlesRow = $('#articlesRow');
    var etherPrice = web3.fromWei(price, "ether");

    // Retrieve and fill the article template
    var articleTemplate = $('#article-template');
    var photoHash = 'http://localhost:8080/ipfs/' + photo;
    articleTemplate.find('.photo-hash').attr('src',photoHash);
    articleTemplate.find('.article-name').text(name);
    articleTemplate.find('.article-price').text(etherPrice + " ETH");
    articleTemplate.find('.article-display').attr('href',"productDetails.html?id="+id);
    articleTemplate.find('.article-type').text(categories[type]);
    articleTemplate.find('.addCart').attr('onclick','App.addToCart('+id+')');
    // add this new article
    articlesRow.append(articleTemplate.html());
  },

  sellArticle: function() {
    saveImageOnIpfs(reader).then(function (hash) {
      var _product_photo = hash;
      console.log(_product_photo);
      var _article_name = $("#article_name").val();
      var _description = $("#article_description").val();
      var _price = web3.toWei(parseFloat($("#article_price").val() || 0), "ether");
      var _number = document.getElementById("article_Number").value;
      var _type = document.getElementById("article_Type").value;
      if ((_article_name.trim() == '') || (_price == 0)) {
        // nothing to sell
        return false;
      }

      Market.deployed().then(function(instance) {
        return instance.sellArticle(_product_photo, _article_name, _description, _price, _number, _type, {
          from: App.account,
          gas: 500000
        });
      }).then(function(result) {
        setTimeout(function(){window.location.reload();},800);
      }).catch(function(err) {
        console.error(err);
      });
    });
  },

  displayAccountInfo: function() {
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        console.log(account);
        $("#account").text(account);
        web3.eth.getBalance(account, function(err, balance) {
          if (err === null) {
            $("#accountBalance").text(web3.fromWei(balance, "ether") + " ETH");
          }
        });
      }
    });
  },

  addToCart: function (article_id) {
    var ids = Cookies.get('cart-map');
    var ids_size = Cookies.get('cart-size');
    var totalPrice = Cookies.get('cart-price');

    ids = (ids == null)?(new Map()):(_objToStrMap(JSON.parse(ids)));
    totalPrice = (totalPrice == null)?0:parseFloat(totalPrice);
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
        console.log(etherPrice);
        totalPrice += parseFloat(etherPrice);
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
    totalPrice = (totalPrice == null)?0:parseFloat(totalPrice);
    ids_size = (ids_size == null)?0:parseInt(ids_size);
    console.log(ids);
    console.log(ids_size);
    console.log(totalPrice);
    ids.forEach(function (value, key) {
      if(value == 0){
        delete ids[key];
      }
    });

    document.getElementById("cartNumber").innerText = ids_size;
    document.getElementById("cartPrice").innerText = totalPrice+" ETH";
  },
};

function saveImageOnIpfs(file) {
  return new Promise(function(resolve, reject) {
    const buffer = Buffer.from(file.result);
    ipfs.add(buffer)
        .then((response) => {
          resolve(response[0].hash);
        }).catch((err) => {
      console.error(err)
      reject(err);
    })
  })
}

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
  // Checking if Web3 has been injected by the browser (Mist/MetaMaskus)
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
