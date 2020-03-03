import "../stylesheets/app.css";
import { default as contract } from 'truffle-contract'
import Comment_artifacts from '../../build/contracts/Comment.json'
var Comment = contract(Comment_artifacts);

window.App = {
    account: 0x0,
    start: function() {
        var self = this;
        this.testButton();
        Comment.setProvider(web3.currentProvider);
        web3.eth.getCoinbase(function(err, account) {
            App.account = account;
        });
    },
    addComment: function () {
        var type = document.getElementById("select").value;
        var objectId = document.getElementById("objectId").value;
        var rating = document.getElementById("rating").value;
        var comment = document.getElementById("comment").value;
        Comment.deployed().then(function (instance) {
            if (type == 1){
                return instance.addObjectComment(objectId, rating, comment,{from:App.account,gas:500000});
            } else if (type == 0){
                return instance.addArticleComment(objectId, rating, comment,{from:App.account,gas:500000});
            }
        }).then(function (res) {
            console.log(res);
        }).catch(function (err) {
            console.log(err);
        });
    },
    getLength: function() {
        var type = document.getElementById("select").value;
        Comment.deployed().then(function (instance) {
            if (type == 1){
                return instance.getObjectCommentsLength.call(1)
            } else if (type == 0){
                return instance.getArticleCommentsLength.call(1)
            }
        }).then(function (res) {
            document.getElementById("show").innerText = res;
            return res;
        })
    },
    getComment: function () {
        document.getElementById("articlesRow").innerHTML = "";
        var type = document.getElementById("select").value;
        var id = document.getElementById("queryArticleId").value;
        Comment.deployed().then(function (instance) {
            if (type == 1){
                return instance.getObjectCommentsLength.call(id);
            } else if (type == 0){
                return instance.getArticleCommentsLength.call(id);
            }
        }).then(function (size) {
            Comment.deployed().then(function (instance) {
                for (var i=0;i<size;i++){
                    if (type == 1){
                        instance.getObjectComment(id,i).then(function (object) {
                            App.displayComment(object[0],object[1],object[2],object[3]);
                        })
                    } else if(type == 0){
                        instance.getArticleComment(id,i).then(function (article) {
                            App.displayComment(article[0],article[1],article[2],article[3]);
                        })
                    }
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
    },

    setCookie: function () {
        Cookies.remove('cart-map');
        Cookies.remove('cart-size');
        Cookies.remove('cart-price');
    },

    displayCookies: function () {
        var ids = Cookies.get('cart-map');
        var ids_size = Cookies.get('cart-size');
        var totalPrice = Cookies.get('cart-price');
        ids = _objToStrMap(JSON.parse(ids));
        console.log(ids);
        console.log(ids_size);
        console.log(totalPrice);
    },

    testButton: function () {
        var s = new Map();
        s.set('1',1);
        s.set('2',2);
        s.forEach(function (value, key) {
            console.log(key+" "+value);
            s.delete(key);
        })
    }

};

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