var ShareApp = artifacts.require("./ShareApp.sol");
var MarketPlace = artifacts.require("./MarketPlace.sol");
var UserApp = artifacts.require("./UserApp.sol");
module.exports = function(deployer) {
  deployer.deploy(ShareApp);
  deployer.deploy(MarketPlace);
  deployer.deploy(UserApp);
};
