import "../stylesheets/app.css";
import { default as contract } from 'truffle-contract'
import ShareApp_artifacts from '../../build/contracts/ShareApp.json'
import Market_artifacts from '../../build/contracts/MarketPlace.json'
var Market = contract(Market_artifacts);
var ShareApp = contract(ShareApp_artifacts);

const offchainServer = "http://localhost:3000";
const ipfsURL = "http://localhost:8080/ipfs/";
window.App = {
    account: 0x0,
    start: function() {
        var self = this;
        ShareApp.setProvider(web3.currentProvider);
        Market.setProvider(web3.currentProvider);
        self.displayAccountInfo();
        self.showUserRentRecord();
        self.showUserTransactionRecord();
    },

    showUserRentRecord: function() {
        web3.eth.getCoinbase(function(err, account) {
            var acc = account;
            $.ajax({
                url: offchainServer + '/getRentRecords',
                type:'get',
                contentType: "application/json; charset=utf-8",
                data: {
                    _renter: acc
                }
            }).done(function (response) {
                console.log(response.length);
                if (response.length == 0){
                    document.getElementById("rentHistory").innerHTML = 'No records found';
                }

                while (response.length > 0){
                    let chunks = response.splice(0,8);
                    chunks.forEach(function (value) {
                        var row = document.getElementById("rentHistory").insertRow(0);
                        var cell0 = row.insertCell(0);   //photo
                        var cell1 = row.insertCell(1);  //id
                        var cell2 = row.insertCell(2);  //name
                        var cell3 = row.insertCell(3);  //priceDaily
                        var cell4 = row.insertCell(4);  //deposit
                        var cell5 = row.insertCell(5);  //rented
                        cell0.innerHTML = "<img src='"+ipfsURL+value.objectPhoto+"'>";
                        cell1.innerHTML = value.objectId;
                        cell2.innerHTML = value.objectName;
                        cell3.innerHTML = value.priceDaily;
                        cell4.innerHTML = value.deposit;
                        cell5.innerHTML = value.rented;
                    })
                }
            })
        });
    },

    showUserTransactionRecord: function() {
        web3.eth.getCoinbase(function(err, account) {
            var acc = account;
            $.ajax({
                url: offchainServer + '/getTransactionRecords',
                type: 'get',
                contentType: "application/json; charset=utf-8",
                data: {
                    _buyer: acc
                }
            }).done(function (response) {
                console.log(response.length);
                if (response.length == 0){
                    document.getElementById("transactionHistory").innerHTML = 'No records found';
                }
                while (response.length > 0){
                    let chunks = response.splice(0,5);
                    chunks.forEach(function (value) {
                        var row = document.getElementById("transactionHistory").insertRow(0);
                        var cell0 = row.insertCell(0);   //photo
                        var cell1 = row.insertCell(1);  //id
                        var cell2 = row.insertCell(2);  //name
                        var cell3 = row.insertCell(3);  //seller
                        var cell4 = row.insertCell(4);  //price
                        cell0.innerHTML = "<img src='"+ipfsURL+value.articlePhoto+"'>";
                        cell1.innerHTML = value.articleId;
                        cell2.innerHTML = value.articleName;
                        cell3.innerHTML = value.seller;
                        cell4.innerHTML = value.price;
                    })
                }
            })
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
