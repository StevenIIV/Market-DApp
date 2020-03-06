import { default as contract } from 'truffle-contract'
import Comment_artifacts from '../../build/contracts/Comment.json'
var Comment = contract(Comment_artifacts);
import User_artifacts from '../../build/contracts/UserApp.json'
var UserApp = contract(User_artifacts);
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
        Comment.setProvider(web3.currentProvider);
        UserApp.setProvider(web3.currentProvider);
        web3.eth.getCoinbase(function(err, account) {
            App.account = account;
        });
        $("#user-image").change(function(event) {
            const file = event.target.files[0]
            reader = new window.FileReader()
            reader.readAsArrayBuffer(file)
        });
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

    addUser: function () {
        saveImageOnIpfs(reader).then(function (hash) {
            var _product_photo = hash;
            var name = document.getElementById("name").value;
            var sex = document.getElementById("sex").value;
            var email = document.getElementById("email").value;
            var age = document.getElementById("age").value;
            UserApp.deployed().then(function (instace) {
                return instace.addNewUser(name,_product_photo,email,age,sex,{
                    from: App.account,
                    gas: 500000
                })
            }).catch(function (err) {
                console.log(err);
            })
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