pragma solidity ^0.4.19;

contract MarketPlace {

  struct user {
    uint[] article_sold;
    uint[] article_buyed;
    uint[] article_buyedTime;
  }

  struct Article {
    uint id;//0
    address seller;//1
    string photo;//2
    string name;//3
    string description;//4
    uint price;//5
    uint number;//6
    uint categories;//7
    bool isDelete;//8
    uint createAt;//9
  }

  struct NameKey {
    uint[] keys;
  }
  struct TypeKey {
    uint[] keys;
  }

  mapping(address => user) private users;
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

  event deleteArticleEvent(
    uint indexed _id
  );

  event modifyArticleEvent(
    uint indexed _id,
    string _name,
    uint _price,
    uint _categories
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
    articleCounter++;
    nameToKeys[_name].keys.push(articleCounter);
    typeToKeys[_categories].keys.push(articleCounter);
    articles[articleCounter] = Article(
      articleCounter,
      msg.sender,
      _photo,
      _name,
      _description,
      _price,
      _number,
      _categories,
      false,
      now
    );
    users[msg.sender].article_sold.push(articleCounter);
    sellArticleEvent(articleCounter, msg.sender, _photo, _name, _price, _number, _categories);
  }

  function getNumberOfArticles() public constant returns (uint) {
    return articleCounter;
  }

  // buy an article
  function buyArticle(uint _id, uint number) payable public {
    require(articleCounter > 0);
    require(_id > 0 && _id <= articleCounter);

    Article storage article = articles[_id];

    require(article.seller != msg.sender);
    require(article.number >= number);
    article.seller.transfer(msg.value);
    article.number-=number;
    users[msg.sender].article_buyed.push(article.id);
    users[msg.sender].article_buyedTime.push(now);

    buyArticleEvent(_id, article.seller, msg.sender, article.photo, article.name, article.price, number, now);
  }

  function modifyArticle(uint _id, string _name, string _description, uint _price, uint _number, uint _categories) public {
    require(articles[_id].seller == msg.sender);
    articles[_id].name = _name;
    articles[_id].price = _price;
    articles[_id].number = _number;
    articles[_id].categories = _categories;
    articles[_id].description = _description;
    modifyArticleEvent(_id,_name,_price,_categories);
  }

  function deleteArticle(uint _id){
    require(articles[_id].seller == msg.sender);
    articles[_id].isDelete = true;
    deleteArticleEvent(_id);
  }

  function kill() onlyOwner {
    selfdestruct(owner);
  }

  function Owned(){
    owner = msg.sender;
  }

  function findByNames(string name) constant returns (uint[]){
    return nameToKeys[name].keys;
  }

  function findByType(uint categories) constant returns (uint[]){
    return typeToKeys[categories].keys;
  }

  function getUserSold(address user) constant returns (uint[]){
    return users[user].article_sold;
  }

  function getUserBought(address user) constant returns (uint[]){
    return users[user].article_buyed;
  }

  function getUserBoughtTime(address user) constant returns (uint[]){
    return users[user].article_buyedTime;
  }

  function isBuyer(uint articleId, address user) constant returns (bool){
    for(uint i=0;i<users[user].article_buyed.length;i++){
      if(users[user].article_buyed[i] == articleId){
        return true;
      }
    }
    return false;
  }
}
