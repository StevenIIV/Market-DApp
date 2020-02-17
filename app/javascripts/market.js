import "../stylesheets/app.css";
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
    self.reloadArticles();
  },

  setStatus: function(message) {
    var status = document.getElementById("status");
    status.innerHTML = message;
  },

  reloadArticles: function() {
    if (App.loading) {
      return;
    }
    App.loading = true;
    var marketPlaceInstance;
    Market.deployed().then(function(instance) {
      marketPlaceInstance = instance;
      return marketPlaceInstance.getArticlesForSale();
    }).then(function(articleIds) {
      // Retrieve and clear the article placeholder
      var articlesRow = $('#articlesRow');
      articlesRow.empty();

      for (var i = 0; i < articleIds.length; i++) {
        var articleId = articleIds[i];
        marketPlaceInstance.articles(articleId.toNumber()).then(function(article) {
          App.displayArticle(
              article[0],
              article[1],
              article[3],
              article[4],
              article[5],
              article[6]
          );
        });
      }
      App.loading = false;
    }).catch(function(err) {
      console.log(err.message);
      App.loading = false;
    });
  },

  displayArticle: function(id, seller, photo, name, description, price) {
    // Retrieve the article placeholder
    var articlesRow = $('#articlesRow');

    var etherPrice = web3.fromWei(price, "ether");

    // Retrieve and fill the article template
    var articleTemplate = $('#articleTemplate');
    var photoHash = 'http://localhost:8080/ipfs/' + photo;
    articleTemplate.find('.photo-hash').attr('src',photoHash);
    articleTemplate.find('.panel-title').text(name);
    articleTemplate.find('.article-description').text(description);
    articleTemplate.find('.article-price').text(etherPrice + " ETH");
    articleTemplate.find('.article-display').attr('href',"productDetails.html?type=0&id="+id);
    articleTemplate.find('.btn-buy').attr('data-id', id);
    articleTemplate.find('.btn-buy').attr('data-value', etherPrice);

    // seller?
    if (seller == App.account) {
      articleTemplate.find('.article-seller').text("You");
      articleTemplate.find('.btn-buy').hide();
    } else {
      articleTemplate.find('.article-seller').text(seller);
      articleTemplate.find('.btn-buy').show();
    }

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

      if ((_article_name.trim() == '') || (_price == 0)) {
        // nothing to sell
        return false;
      }

      Market.deployed().then(function(instance) {
        return instance.sellArticle(_product_photo, _article_name, _description, _price, {
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

  // buyArticle: function() {
  //   event.preventDefault();
  //
  //   // retrieve the article price
  //   var _articleId = $(event.target).data('id');
  //   var _price = parseFloat($(event.target).data('value'));
  //
  //   Market.deployed().then(function(instance) {
  //     return instance.buyArticle(_articleId, {
  //       from: App.account,
  //       value: web3.toWei(_price, "ether"),
  //       gas: 500000
  //     });
  //   }).then(function(result) {
  //     setTimeout(function(){window.location.reload();},800);
  //   }).catch(function(err) {
  //     console.error(err);
  //   });
  // },

  //中文编码格式转换
  toUtf8: function(str) {
    var out, i, len, c;
    out = "";
    len = str.length;
    for(i = 0; i < len; i++) {
      c = str.charCodeAt(i);
      if ((c >= 0x0001) && (c <= 0x007F)) {
        out += str.charAt(i);
      } else if (c > 0x07FF) {
        out += String.fromCharCode(0xE0 | ((c >> 12) & 0x0F));
        out += String.fromCharCode(0x80 | ((c >>  6) & 0x3F));
        out += String.fromCharCode(0x80 | ((c >>  0) & 0x3F));
      } else {
        out += String.fromCharCode(0xC0 | ((c >>  6) & 0x1F));
        out += String.fromCharCode(0x80 | ((c >>  0) & 0x3F));
      }
    }
    return out;
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
