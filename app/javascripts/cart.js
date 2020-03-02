import { default as contract } from 'truffle-contract'
import Market_artifacts from '../../build/contracts/MarketPlace.json'
var Market = contract(Market_artifacts);
const categories = ["Clothing","Food","Electronic","Book","Jewellery","Crafts","Others"];
window.App = {
    account: 0x0,
    start: function() {
        var self = this;
        Market.setProvider(web3.currentProvider);
        self.displayAccountInfo();
        document.getElementById("cartNumber").innerText = JSON.parse(Cookies.get('cart-list')).length;
        document.getElementById("cartPrice").innerText = Cookies.get('cart-price')+" ETH";
        App.getAndShowCartInfo();
    },

    getAndShowCartInfo: function(){
        var ids = Cookies.get('cart-list');
        var totalPrice = Cookies.get('cart-price');
        if (ids == null && totalPrice == null){
            ids = new Array();
            totalPrice = 0;
        }else {
            totalPrice = parseInt(totalPrice);
            ids = JSON.parse(ids);
        }
        document.getElementById("total-amount").innerText = totalPrice+" ETH";
        var  cartIdMap = new Map();
        for (var i=0;i<ids.length;i++){
            var num = 0;
            if (cartIdMap.get(ids[i]) != null){
                num = parseInt(cartIdMap.get(ids[i]));
            }
            num++;
            cartIdMap.set(ids[i],num)
        }

        cartIdMap.forEach(function (value,key) {
            console.log(key+" "+value);
            Market.deployed().then(function (instance) {
                instance.articles(key).then(function (article) {
                    App.displayCartList(article[0],article[2],article[3],article[5],value,article[7]);
                })
            })
        })
    },

    displayCartList: function (id,photo,name,price,number,category) {
        var etherPrice = web3.fromWei(price, "ether");
        var photoHash = 'http://localhost:8080/ipfs/' + photo;
        var template = "";

        template += "<tr>" +
            "<th scope='row'><img src='" + photoHash + "' alt='img' width='80px' height='80px'></th>" +
            "<td colspan='1' class='item-name' width='390px'>" + name + "</td>" +
            "<td class='price'>" + categories[category] + "</td>" +
            "<td class='price'>" + etherPrice + " ETH</td>" +
            "<td class='table-quantity'>" +
                "<form>" +
                    "<div class='quantity buttons_added'>" +
                        "<input type='button' value='-' class='minus'>" +
                        "<input type='number' class='input-text qty text' step='1' min='1' max='10000' name='quantity' value=" + number + ">" +
                        "<input type='button' value='+' class='plus'>" +
                    "</div>" +
                "</form>" +
            "</td>" +
            "<td class='price'>" + etherPrice * number + " ETH</td>" +
            "<td class='table-close-btn'><i class='fa fa-close'></i></td>"
        document.getElementById("cartTable").innerHTML += template;
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
