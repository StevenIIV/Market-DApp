var ShareApp = artifacts.require("./ShareApp.sol");
var MarketPlace = artifacts.require("./MarketPlace.sol");
var UserApp = artifacts.require("./UserApp.sol");
var Comment = artifacts.require("./Comment.sol");
module.exports = function(deployer) {
  deployer.deploy(ShareApp);
  deployer.deploy(MarketPlace);
  deployer.deploy(UserApp);
  deployer.deploy(Comment);
};
