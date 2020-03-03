pragma solidity ^0.4.19;

contract MarketPlace {

  // Custom types
  struct Article {
    uint id;//0
    address seller;//1
    string photo;//2
    string name;//3
    string description;//4
    uint price;//5
    uint number;//6
    uint categories;//7
  }

  struct NameKey {
    uint[] keys;
  }
  struct TypeKey {
    uint[] keys;
  }
  // State variables
  mapping(uint => Article) public articles;
  mapping(string => NameKey) private nameToKeys;
  mapping(uint => TypeKey) private typeToKeys;
  uint articleCounter;


  address owner;
  //Events
  event sellArticleEvent(
    uint indexed _id,
    address indexed _seller,
    string _photo,
    string _name,
    uint _price,
    uint _number,
    uint _categories
  );

  event buyArticleEvent(
    uint indexed _id,
    address indexed _seller,
    address indexed _buyer,
    string _photo,
    string _name,
    uint _price,
    uint _number,
    uint _createAt
  );

  //modifiers
  modifier onlyOwner() {
    require(msg.sender == owner);
    _;
  }

  modifier objectInRange(uint objID) {
    if (objID >= articleCounter)
      throw;
    _;
  }

  //sell an article
  function sellArticle(string _photo, string _name, string _description, uint _price, uint _number, uint _categories) public {
    // a new article
    articleCounter++;
    nameToKeys[_name].keys.push(articleCounter);
    typeToKeys[_categories].keys.push(articleCounter);
    //store this article
    articles[articleCounter] = Article(
      articleCounter,
      msg.sender,
      _photo,
      _name,
      _description,
      _price,
      _number,
      _categories
    );

    // trigger the event
    sellArticleEvent(articleCounter, msg.sender, _photo, _name, _price, _number, _categories);
  }

  // fetch the number of articles in the contract
  function getNumberOfArticles() public constant returns (uint) {
    return articleCounter;
  }

  //  // fetch and returns all article IDs available for sale
  //  function getArticlesForSale() public constant returns (uint[]) {
  //    // we check whether there is at least one article
  //    if(articleCounter == 0) {
  //      return new uint[](0);
  //    }
  //
  //    // prepare intermediary array
  //    uint[] memory articleIds = new uint[](articleCounter);
  //
  //    uint numberOfArticlesForSale = 0;
  //    // iterate over articles
  //    for (uint i = 1; i <= articleCounter; i++) {
  //      // keep only the ID of articles not sold yet
  //      if (articles[i].buyer == 0x0) {
  //        articleIds[numberOfArticlesForSale] = articles[i].id;
  //        numberOfArticlesForSale++;
  //      }
  //    }
  //
  //    // copy the articleIds array into the smaller forSale array
  //    uint[] memory forSale = new uint[](numberOfArticlesForSale);
  //    for (uint j = 0; j < numberOfArticlesForSale; j++) {
  //      forSale[j] = articleIds[j];
  //    }
  //    return (forSale);
  //  }

  // buy an article
  function buyArticle(uint _id, uint number) payable public {
    // we check whether there is at least one article
    require(articleCounter > 0);

    // we check whether the article exists
    require(_id > 0 && _id <= articleCounter);

    // we retrieve the article
    Article storage article = articles[_id];

    // we don't allow the seller to buy his/her own article
    require(article.seller != msg.sender);

    require(article.number >= number);

    // the buyer can buy the article
    article.seller.transfer(msg.value);

    article.number-=number;

    // trigger the event
    buyArticleEvent(_id, article.seller, msg.sender, article.photo, article.name, article.price, number, now);
  }

  //kill the smart contract
  function kill() onlyOwner {
    selfdestruct(owner);
  }

  // constructor
  function Owned(){
    owner = msg.sender;
  }

  function findByNames(string name) constant returns (uint[]){
    return nameToKeys[name].keys;
  }

  function findByType(uint categories) constant returns (uint[]){
    return typeToKeys[categories].keys;
  }
}
