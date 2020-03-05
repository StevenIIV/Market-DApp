import { default as contract } from 'truffle-contract'
import UserApp_artifacts from  '../../build/contracts/UserApp.json'
var UserApp = contract(UserApp_artifacts);
window.App = {
    account: 0x0,
    start: function() {
        Comment.setProvider(web3.currentProvider);
        web3.eth.getCoinbase(function(err, account) {
            App.account = account;
        });
    },
};