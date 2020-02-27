import "../stylesheets/app.css";
import { default as contract } from 'truffle-contract'
import Comment_artifacts from '../../build/contracts/Comment.json'
var Comment = contract(Comment_artifacts);

window.App = {
    account: 0x0,
    start: function() {
        var self = this;
        Comment.setProvider(web3.currentProvider);
        web3.eth.getCoinbase(function(err, account) {
            App.account = account;
        });
    },
    addComment: function () {
        var objectId = document.getElementById("objectId").value;
        var rating = document.getElementById("rating").value;
        var comment = document.getElementById("comment").value;
        Comment.deployed().then(function (instance) {
            return instance.addArticleComment(objectId, rating, comment,{from:App.account,gas:500000});
        }).then(function (res) {
            console.log(res);
        }).catch(function (err) {
            console.log(err);
        })
    },
    getLength: function() {
        Comment.deployed().then(function (instance) {
            return instance.getArticleCommentsLength.call(1)
        }).then(function (res) {
            document.getElementById("show").innerText = res;
            return res;
        })
    },
    getComment: function () {
        var articleId = document.getElementById("queryArticleId").value;
        Comment.deployed().then(function (instance) {
            return instance.getArticleCommentsLength.call(articleId);
        }).then(function (size) {
            Comment.deployed().then(function (instance) {
                for (var i=0;i<size;i++){
                    instance.getArticleComment(articleId,i).then(function (article) {
                        App.displayComment(article[0],article[1],article[2],article[3]);
                    })
                }
            });
        })

    },

    displayComment: function (time, sender, rating, comment) {
        var articlesRow = $('#articlesRow');
        var commentTemplate = $('#commentTemplate');
        commentTemplate.find('.createTime').text(time);
        commentTemplate.find('.creator').text(sender);
        commentTemplate.find('.rating').text(rating);
        commentTemplate.find('.comment').text(comment);
        articlesRow.append(commentTemplate.html());
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