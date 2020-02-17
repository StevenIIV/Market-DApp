var ShareApp = artifacts.require("./ShareApp.sol");
var MarketPlace = artifacts.require("./MarketPlace.sol");
module.exports = function(deployer) {
  deployer.deploy(ShareApp);
  deployer.deploy(MarketPlace);
};
