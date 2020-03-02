// import "../stylesheets/app.css";
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
    self.reloadArticles(0);
    document.getElementById("cartNumber").innerText = JSON.parse(Cookies.get('cart-list')).length;
    document.getElementById("cartPrice").innerText = Cookies.get('cart-price')+" ETH";

  },

  searchArticleByName: function() {
    var name = document.getElementById("search-name").value;
    document.getElementById("articlesRow").innerHTML = "";
    for (var i=0;i<=6;i++){
      document.getElementById("pills-tab-"+i).className = 'nav-link';
    }
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
          if (article[6] > 0){
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
  },

  reloadArticles: function(type) {
    document.getElementById("articlesRow").innerHTML = "";
    var marketPlaceInstance;
    Market.deployed().then(function(instance) {
      marketPlaceInstance = instance;
      return marketPlaceInstance.findByType.call(type);
    }).then(function(ids){
      for (let articleId of ids){
        marketPlaceInstance.articles(articleId.toNumber()).then(function(article) {
          if (article[6] > 0){
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
    var ids = Cookies.get('cart-list');

    var totalPrice = Cookies.get('cart-price');

    if (ids == null && totalPrice == null){
      ids = new Array();
      totalPrice = 0;
    }else {
      totalPrice = parseInt(totalPrice);
      ids = JSON.parse(ids);
    }
    ids.push(article_id);
    Cookies.set('cart-list',ids);
    console.log(ids);
    document.getElementById("cartNumber").innerText = ids.length;
    Market.deployed().then(function (instance) {
      instance.articles(article_id).then(function (article) {
        var etherPrice = web3.fromWei(article[5], "ether");
        totalPrice += parseInt(etherPrice);
        document.getElementById("cartPrice").innerText = totalPrice+" ETH";
        Cookies.set('cart-price',totalPrice);
      })
    });

  }
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
