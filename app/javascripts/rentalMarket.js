// Import libraries we need.
//import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract'
import { default as BigNumber } from 'bignumber.js'
// var BigNumber = require('../../node_modules/bignumber.js')
const ipfsAPI = require('ipfs-api')
const ipfs = ipfsAPI({
  host: 'localhost',
  port: '5001',
  protocol: 'http'
});
import ShareApp_artifacts from '../../build/contracts/ShareApp.json'
var ShareApp = contract(ShareApp_artifacts);
const categories = ["Clothing","Electronic","Book","Crafts","Others"];
var reader;
window.App = {
  account: 0x0,
  start: function() {
    var self = this;
    ShareApp.setProvider(web3.currentProvider);
    self.displayAccountInfo();
    self.postObjectsTable();
    $("#product-image").change(function(event) {
      const file = event.target.files[0];
      reader = new window.FileReader();
      reader.readAsArrayBuffer(file)
    });
  },

  createObj: function(){
    var self = this;
    saveImageOnIpfs(reader).then(function (id) {
      var imageHash = id;
      console.log(imageHash);
      var objName = document.getElementById("objectName").value;
      var objPriceDaily = web3.toWei(parseFloat($("#objectPriceDaily").val() || 0), "ether");
      var objDeposit = web3.toWei(parseFloat($("#objectDeposit").val() || 0), "ether");
      // var objPriceDaily = new BigNumber(document.getElementById("objectPriceDaily").value).toNumber();
      // var objDeposit = new BigNumber(document.getElementById("objectDeposit").value).toNumber();
      var objDetail = document.getElementById("objectDetail").value;
      var objType = document.getElementById("objectType").value;
      var meta;
      ShareApp.deployed().then(function(instance){
        meta = instance;
        return meta.createObj(imageHash,objName,objPriceDaily,objDeposit,objDetail,objType,{from:App.account,gas:500000});
      }).then(function(){
        window.location.reload();
      }).catch(function(e){
        console.log(e);
      });
    })
  },

  //按名字查询之后显示出所有记录
  searchObjByName: function(){
    var self = this;
    document.getElementById("list1").innerHTML = "";
    document.getElementById("list2").innerHTML = "";
    document.getElementById("list3").innerHTML = "";
    var name = document.getElementById("search-name").value;
    var mainInstance;
    var select_rented = document.getElementById("select-rented").value;
    ShareApp.deployed().then(function(instance){
      mainInstance=instance;
      return instance.findNames.call(name);
    }).then(function(ids){
      var list = 1;
      for(let element of ids){
        let id = element.toNumber();
        mainInstance.objectIsRented.call(id).then(function (res) {
          if (res == true && select_rented == 1){
          }else {
            App.addRowObjectTable(id,list);
            list ++;
            if (list == 4){
              list = 1;
            }
          }
        });
      }
    });
  },

  //向表格中追加记录
  addRowObjectTable: function(_id,list){
    var shareInstance;
    ShareApp.deployed().then(function (instance) {
      shareInstance = instance;
      shareInstance.getObj(_id).then(function (object) {
        var objectRow = $('#list'+list);
        var objectTemplate = $('#object-template');

        objectTemplate.find('.photo-hash').attr('src','http://localhost:8080/ipfs/' + object[1]);
        objectTemplate.find('.object-name').text(object[2]);
        objectTemplate.find('.object-priceDaily').text(web3.fromWei(object[3],'ether'));
        objectTemplate.find('.object-deposit').text(web3.fromWei(object[4],'ether'));
        objectTemplate.find('.object-type').text(categories[object[9]]);
        objectTemplate.find('.object-display').attr('href',"objectDetails.html?id="+_id);
        if (object[7]){
          objectTemplate.find('.object-rented').attr('style','display:inline');
        }
        objectRow.append(objectTemplate.html());
        objectTemplate.find('.object-rented').attr('style','display:none');
      });
    });
  },

  //把所有记录显示出来
  postObjectsTable: function(){
    document.getElementById("list1").innerHTML = "";
    document.getElementById("list2").innerHTML = "";
    document.getElementById("list3").innerHTML = "";
    var self = this;
    var ids;
    var mainInstance;
    var select_rented = document.getElementById("select-rented").value;
    ShareApp.deployed().then(function(instance){
      mainInstance = instance;
      return instance.getObjectIds.call();
    }).then(function(result){
      ids = result;
      var list = 1;
      for(let element of ids){
        var isRented;
        let id = element.toNumber();
        mainInstance.objectIsRented.call(id).then(function (res) {
          isRented = res;
          mainInstance.getObjectIsDelete.call(id).then(function (isDelete) {
            if ((res == true && select_rented == 1)||(isDelete == true)){
            }else {
              App.addRowObjectTable(id,list);
              list ++;
              if (list == 4){
                list = 1;
              }
            }
          });
        });
      }
    });
  },

  postObjectTableByType: function(type_id){
    document.getElementById("list1").innerHTML = "";
    document.getElementById("list2").innerHTML = "";
    document.getElementById("list3").innerHTML = "";
    var select_rented = document.getElementById("select-rented").value;
    var mainInstance;
    ShareApp.deployed().then(function (instance) {
      mainInstance = instance;
      return mainInstance.findTypes.call(type_id);
    }).then(function (ids) {
      var list = 1;
      for (let objectId of ids){
        mainInstance.objectIsRented.call(objectId).then(function (res) {
          if (res == true && select_rented == 1){
          }else {
            App.addRowObjectTable(objectId,list);
            list ++;
            if (list == 4){
              list = 1;
            }
          }
        });
      }
    })
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
  }

};

function saveImageOnIpfs(file) {
  return new Promise(function(resolve, reject) {
    const buffer = Buffer.from(file.result);
    ipfs.add(buffer)
        .then((response) => {
          resolve(response[0].hash);
        }).catch((err) => {
      console.error(err);
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
