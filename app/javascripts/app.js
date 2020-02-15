import "../stylesheets/app.css";
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
})
import ShareApp_artifacts from '../../build/contracts/ShareApp.json'
var ShareApp = contract(ShareApp_artifacts);
var accounts;
var account;
var reader;
window.App = {
  start: function() {
    var self = this;

    // Bootstrap the ShareApp abstraction for Use.
    ShareApp.setProvider(web3.currentProvider);

    // Get the initial account balance so it can be displayed.
    web3.eth.getAccounts(function(err, accs) {
      if (err != null) {
        alert("There was an error fetching your accounts.");
        return;
      }

      if (accs.length == 0) {
        alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
        return;
      }

      accounts = accs;
      account = accounts[0];
      console.log(accounts);
      //console.log(web3.eth.getBalance(account).toNumber());
      });
    self.postObjectsTable();
    $("#product-image").change(function(event) {
      const file = event.target.files[0]
      reader = new window.FileReader()
      reader.readAsArrayBuffer(file)
    });
  },

  setStatus: function(message) {
    var status = document.getElementById("status");
    status.innerHTML = message;
  },

  createObj: function(){
    var self = this;
    saveImageOnIpfs(reader).then(function (id) {
      var imageHash = id;
      console.log(imageHash);
      var objName = document.getElementById("objectName").value;
      var objPriceDaily = parseInt(document.getElementById("objectPriceDaily").value);
      var objDeposit = parseInt(document.getElementById("objectDeposit").value);
      // var objPriceDaily = new BigNumber(document.getElementById("objectPriceDaily").value).toNumber();
      // var objDeposit = new BigNumber(document.getElementById("objectDeposit").value).toNumber();
      var objDetail = document.getElementById("objectDetail").value;

      //this.setStatus("Initiating transaction... (please wait)");

      var meta;
      ShareApp.deployed().then(function(instance){
        meta = instance;
        return meta.createObj(imageHash,objName,objPriceDaily,objDeposit,objDetail,{from:account,gas:500000});
      }).then(function(tx){
        self.setStatus("create success!");
        console.log(meta.address);
        console.log(tx);
        // self.qrcode();
        // document.getElementById("objectInfoDiv").style.display="none";
        // document.getElementById("qrcodeDiv").style.display="";
        return meta.getNumObjects.call();
      }).then(function(num){
        let newId = num.toNumber() - 1;
        console.log(num.toNumber());
        self.addRowObjectTable(newId);
      }).catch(function(e){
        console.log(e);
        self.setStatus("Error create;see log.");
      });
    }).then(function () {
      setTimeout(function(){window.location.reload();},1800);
})
  },

  //View
  postObject: function(_objID){  //按ID查询之后显示具体
    var mainInstance;
    var numObjects;
    var _objPhoto;
    var _objName;
    var _objCreator;
    var _objPriceDaily;
    var _objDeposit;
    var _objRenterAddress;
    var _objRenterSince;
    var _objRented;
    var _objDetail;
    ShareApp.deployed().then(function(instance){
      mainInstance = instance;
      return instance.getNumObjects.call();
    }).then(function(result){
      numObjects = result.toNumber();
      return mainInstance.getObjectName.call(_objID);
    }).then(function(objName){
      _objName = objName;
      return mainInstance.getObjectPhoto.call(_objID);
    }).then(function(objPhoto){
      _objPhoto = 'http://localhost:8080/ipfs/' + objPhoto;
      return mainInstance.getObjectCreator.call(_objID);
    }).then(function(objCreator){
      _objCreator = objCreator;
      return mainInstance.getObjectPriceDaily.call(_objID);
    }).then(function(objPriceDaily){
      _objPriceDaily = objPriceDaily.toNumber();
      return mainInstance.getObjectDeposit.call(_objID);
    }).then(function(objDeposit){
      _objDeposit = objDeposit.valueOf();
      return mainInstance.getObjectRenterAddress.call(_objID);
    }).then(function(objRenterAddress){
      _objRenterAddress = objRenterAddress;
      return mainInstance.getObjectRenterSince.call(_objID);
    }).then(function(objRenterSince){
      _objRenterSince = objRenterSince.valueOf();
      return mainInstance.objectIsRented.call(_objID);
    }).then(function(objRented){
      _objRented = objRented;
      return mainInstance.getObjectDetail.call(_objID);
    }).then(function(objDetail){
      _objDetail = objDetail;

      if(_objID < numObjects && _objID >= 0){
        if(_objRented == false){
          document.getElementById("rentButton").style.display = "inline";
          document.getElementById("returnButton").style.display = "none";
        }
        else{
          document.getElementById("returnButton").style.display = "inline";
          document.getElementById("rentButton").style.display = "none";
        }
        document.getElementById("object-info").style.display = "inline";
        document.getElementById("objPhoto").innerHTML = "<img src='"+_objPhoto+"'>";
        document.getElementById("objID").innerHTML = _objID;
        document.getElementById("objName").innerHTML = _objName;
        document.getElementById("objCreator").innerHTML = _objCreator;
        document.getElementById("objPriceDaily").innerHTML = _objPriceDaily;
        document.getElementById("objDeposit").innerHTML = _objDeposit;
        document.getElementById("objRenterAddress").innerHTML = _objRenterAddress;
        document.getElementById("objRenterSince").innerHTML = _objRenterSince;
        document.getElementById("objRented").innerHTML = _objRented;
        document.getElementById("objDetail").innerHTML = _objDetail;
      }else{
        alert("There is no object with id " + id); // error message
      }
    });
  },

  searchObjByName: function(){ //按名字查询
    var self = this;

    var name = document.getElementById("search-name").value;
    self.postObjectsTableByName(name);
  },

  postObjectsTableByName: function(_name){ //按名字查询之后显示出所有记录
    var self = this;
    var ids;
    var mainInstance;
    document.getElementById("nameObjects").style.display = "inline";
    $("#nameObjects-table tr:not(:first)").empty();
    var tbody = document.getElementById("nameObjects-table").tBodies[0];
    ShareApp.deployed().then(function(instance){
      mainInstance=instance;
      return instance.findNames.call(_name);
    }).then(function(res){
      ids = res;

      for(let element of ids){
        let id = element.toNumber();
        self.addRowObjectTable(id,tbody);
      }
    });
  },

  addRowObjectTable: function(_id,tbody){  //向表格中追加记录
    var self = this;
    var mainInstance;
    var _objPhoto;
    var _objName;
    var _objPriceDaily;
    var _objDeposit;
    var _objRented;
    // var tbody = document.getElementById("objectsTable").tBodies[0];
    ShareApp.deployed().then(function(instance){
          mainInstance = instance;
          return mainInstance.getObjectName.call(_id);
        }).then(function(objName){
          _objName = objName;
          return mainInstance.getObjectPhoto.call(_id);
        }).then(function (objPhoto){
          _objPhoto = 'http://localhost:8080/ipfs/' + objPhoto;
          return mainInstance.getObjectPriceDaily.call(_id);
        }).then(function(objPriceDaily){
          _objPriceDaily = objPriceDaily.valueOf();
          return mainInstance.getObjectDeposit.call(_id);
        }).then(function(objDeposit){
          _objDeposit = objDeposit.valueOf();
          return mainInstance.objectIsRented.call(_id);
        }).then(function(objRented){
          _objRented = objRented;

          var row = tbody.insertRow(0);

          var cell1 = row.insertCell(0);  //id
          var cell2 = row.insertCell(1);  //name
          var cell3 = row.insertCell(2);  //priceDaily
          var cell4 = row.insertCell(3);  //deposit
          var cell5 = row.insertCell(4);  //rented
          var cell6 = row.insertCell(5);  //OP
          var cell7 = row.insertCell(6);

          var targetURL = "productDetails.html?id="+_id;
          cell1.innerHTML = "<img src='"+_objPhoto+"'>";
          cell2.innerHTML = _id;
          cell3.innerHTML = _objName;
          cell4.innerHTML = _objPriceDaily;
          cell5.innerHTML = _objDeposit;
          cell6.innerHTML = _objRented;
          cell7.innerHTML = '<a href="productDetails.html?id='+_id+'">Display</a>';
        });
  },


  postObjectsTable: function(){  //把所有记录显示出来
    var self = this;
    var ids;
    var mainInstance;
    var tbody = document.getElementById("objectsTable").tBodies[0];
    ShareApp.deployed().then(function(instance){
      mainInstance = instance;
      return instance.getObjectIds.call();
    }).then(function(result){
      ids = result;

      for(let element of ids){
        let id = element.toNumber();
        self.addRowObjectTable(id,tbody);
      }
    });
  },

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

  qrcode: function(){
    var content = "test\nhello";
    $('#qrcode').qrcode({
      width:200,
      height:200,
      render:"canvas",
      correctLevel:0,
      text:content
    });
  },

  rentObj: function(){
    var mainInstance;

    var objectID = parseInt(document.getElementById("objID").innerHTML);
    // console.log(objectID+1);
    ShareApp.deployed().then(function(instance){
      mainInstance = instance;
      return mainInstance.rentObj(objectID,{from:account,value:10000000000000, gas:500000});
    }).then(function(tx){
      console.log(tx);
    }).catch(function(e){
      console.log(e);
    });
  },

  returnObj:function(){
    var mainInstance;

    var objectID = parseInt(document.getElementById("objID").innerHTML);
    ShareApp.deployed().then(function(instance){
      mainInstance = instance;
      return mainInstance.returnObj(objectID,{from:account});
    }).then(function(tx){
      console.log(tx);
    }).catch(function(e){
      console.log(e);
    });
  },

  remove: function(){
    var self = this;

    var meta;
    ShareApp.deployed().then(function(instance){
      meta = instance;
      return meta.remove({from:account});
      }).then(function(){
        self.setStatus("remove success!");
      }).catch(function(e){
        console.log(e);
        self.setStatus("Error remove;see log.");
      });
  }

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

function changeURLArg(url,arg,arg_val){
  var pattern=arg+'=([^&]*)';
  var replaceText=arg+'='+arg_val;
  if(url.match(pattern)){
    var tmp='/('+ arg+'=)([^&]*)/gi';
    tmp=url.replace(eval(tmp),replaceText);
    return tmp;
  }else{
    if(url.match('[\?]')){
      return url+'&'+replaceText;
    }else{
      return url+'?'+replaceText;
    }
  }
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
