pragma solidity ^0.4.19;


contract MarketPlace {

  // Custom types
  struct Article {
    uint id;
    address seller;
    address buyer;
    string photo;
    string name;
    string description;
    uint price;
    uint number;
    uint categories;
  }

  // State variables
  mapping(uint => Article) public articles;
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

    //store this article
    articles[articleCounter] = Article(
      articleCounter,
      msg.sender,
      0x0,
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

  // fetch and returns all article IDs available for sale
  function getArticlesForSale() public constant returns (uint[]) {
    // we check whether there is at least one article
    if(articleCounter == 0) {
      return new uint[](0);
    }

    // prepare intermediary array
    uint[] memory articleIds = new uint[](articleCounter);

    uint numberOfArticlesForSale = 0;
    // iterate over articles
    for (uint i = 1; i <= articleCounter; i++) {
      // keep only the ID of articles not sold yet
      if (articles[i].buyer == 0x0) {
        articleIds[numberOfArticlesForSale] = articles[i].id;
        numberOfArticlesForSale++;
      }
    }

    // copy the articleIds array into the smaller forSale array
    uint[] memory forSale = new uint[](numberOfArticlesForSale);
    for (uint j = 0; j < numberOfArticlesForSale; j++) {
      forSale[j] = articleIds[j];
    }
    return (forSale);
  }

  // buy an article
  function buyArticle(uint _id) payable public {
    // we check whether there is at least one article
    require(articleCounter > 0);

    // we check whether the article exists
    require(_id > 0 && _id <= articleCounter);

    // we retrieve the article
    Article storage article = articles[_id];

    // we check whether the article has not already been sold
    require(article.buyer == 0x0);

    // we don't allow the seller to buy his/her own article
    require(article.seller != msg.sender);

    // we check whether the value sent corresponds to the article price
    require(article.price == msg.value);

    // keep buyer's information
    article.buyer = msg.sender;

    // the buyer can buy the article
    article.seller.transfer(msg.value);

    // trigger the event
    buyArticleEvent(_id, article.seller, article.buyer, article.photo, article.name, article.price, now);
  }

  //kill the smart contract
  function kill() onlyOwner {
    selfdestruct(owner);
  }

  // constructor
  function Owned(){
    owner = msg.sender;
  }
}
