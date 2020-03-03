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
        self.setCookies();
        App.getAndShowCartInfo();
    },

    getAndShowCartInfo: function(){
        document.getElementById("cartTable").innerHTML = "";
        this.setCookies();
        var ids = Cookies.get('cart-map');
        var ids_size = Cookies.get('cart-size');
        var totalPrice = Cookies.get('cart-price');

        ids = (ids == null)?(new Map()):(_objToStrMap(JSON.parse(ids)));
        totalPrice = (totalPrice == null)?0:parseInt(totalPrice);
        ids_size = (ids_size == null)?0:parseInt(ids_size);

        document.getElementById("total-amount").innerText = totalPrice+" ETH";


        ids.forEach(function (value,key) {
            console.log(key+" "+value);
            Market.deployed().then(function (instance) {
                instance.articles(key.substring(7,key.length)).then(function (article) {
                    App.displayCartList(article[0],article[2],article[3],article[5],value,article[7]);
                })
            })
        })
    },

    displayCartList: function (article_id,photo,name,price,number,category) {
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
                        "<input type='button' onclick='App.quantityMinus("+etherPrice+","+article_id+")' value='-' class='minus'>" +
                        "<input type='number' id='quantity_"+article_id+"' class='input-text qty text' step='1' min='1' max='10000' name='quantity' value=" + number + ">" +
                        "<input type='button' onclick='App.quantityPlus("+etherPrice+","+article_id+")' value='+' class='plus'>" +
                    "</div>" +
                "</form>" +
            "</td>" +
            "<td class='price' id='total-price_"+article_id+"'>" + etherPrice * number + " ETH</td>" +
            "<td class='table-close-btn'><i class='fa fa-close'></i></td>"
        document.getElementById("cartTable").innerHTML += template;
    },

    quantityMinus: function(unitPrice,article_id){
        var ids = Cookies.get('cart-map');
        var ids_size = parseInt(Cookies.get('cart-size'));
        var totalPrice = parseInt(Cookies.get('cart-price'));
        ids = _objToStrMap(JSON.parse(ids));
        var num = parseInt(ids.get("article"+article_id));
        num--;
        ids.set("article"+article_id,num);
        ids_size--;
        totalPrice-=parseInt(unitPrice);
        Cookies.set('cart-map',JSON.stringify(_strMapToObj(ids)));
        Cookies.set('cart-size',ids_size);
        Cookies.set('cart-price',totalPrice);
        document.getElementById("cartNumber").innerText = ids_size;
        document.getElementById("cartPrice").innerText = totalPrice+" ETH";
        document.getElementById("total-price_"+article_id).innerText = num * parseInt(unitPrice) + " ETH";
        if (num == 0){
            App.getAndShowCartInfo();
        }
    },

    quantityPlus: function(unitPrice,article_id){
        var ids = Cookies.get('cart-map');
        var ids_size = parseInt(Cookies.get('cart-size'));
        var totalPrice = parseInt(Cookies.get('cart-price'));
        ids = _objToStrMap(JSON.parse(ids));
        var num = parseInt(ids.get("article"+article_id));
        num++;
        ids.set("article"+article_id,num);
        ids_size++;
        totalPrice+=parseInt(unitPrice);
        Cookies.set('cart-map',JSON.stringify(_strMapToObj(ids)));
        Cookies.set('cart-size',ids_size);
        Cookies.set('cart-price',totalPrice);
        document.getElementById("cartNumber").innerText = ids_size;
        document.getElementById("cartPrice").innerText = totalPrice+" ETH";
        document.getElementById("total-price_"+article_id).innerText = num * parseInt(unitPrice) + " ETH";
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
