pragma solidity ^0.4.19;

contract ShareApp{

	struct user{
		uint[] object_rent;
		uint[] object_rented;
		uint[] object_rentedTime;
	}

	struct Renter{
		address addr;
		uint since;
	}

	struct Object{
		address creator; // +
		string photo;
		string name;
		uint priceDaily;
		uint deposit;
		Renter renter;
		bool rented;  //rented ?
		string detail;
		uint categories;
		bool isDelete;
	}

	struct NameKey{ // storage the name's keys
		uint[] keys;
	}

	struct TypeKey{
		uint[] keys;
	}

	//List of objects
	uint[] private ids;  //Use it to return the ids of Objects
	uint public numObjects;
	mapping(uint => Object) private objects;
	mapping(address => user) private users;
	mapping(string => NameKey) private nameToKeys;
	mapping(uint => TypeKey) private typeToKeys;
	// mapping(address => uint) public balances;

	address public owner;

	//Events
	event NewObject(uint _objID, address _creator, string _photo, string _name, uint _priceDaily, uint _deposit, uint categories, bool _rented);
	event NewRent(uint _objID, address _creator, address _renter, string _photo, string _name, uint _priceDaily, uint _deposit, bool _rented, uint _createAt);
	event NewReturn(uint _objID, address _renter, bool _rented, uint _createAt);

	modifier objectInRange(uint objID) {
		if (objID >= numObjects)
			throw;
		_;
	}

	modifier onlyOwner(){
		if(msg.sender != owner){
			throw;
		}
		_;
	}

	/*
	* Functions
	*/
	function ShareApp(){
		owner = msg.sender;
	}

	function objectIsRented(uint objID) objectInRange(objID) returns (bool){
		return objects[objID].rented;
	}

	function createObj(string photo, string name,uint priceDaily,uint deposit,string detail, uint categories){
		// +
		//owner = msg.sender;
		// Object newObject = objects[numObjects];
		Object  newObject = objects[numObjects];
		nameToKeys[name].keys.push(numObjects); //add the key to the name's keys
		typeToKeys[categories].keys.push(numObjects);
		newObject.creator = msg.sender;
		newObject.photo = photo;
		newObject.name = name;
		newObject.priceDaily = priceDaily;
		newObject.deposit = deposit;
		newObject.rented = false;
		newObject.detail = detail;
		newObject.categories = categories;
		newObject.isDelete = false;
		users[msg.sender].object_rent.push(numObjects);
		// objects[numObjects] = newObject;
		NewObject(numObjects, msg.sender, photo, name, priceDaily, deposit, categories, false);
		ids.push(numObjects);
		numObjects++;
	}

	function getObj(uint objID) constant objectInRange(objID)
	returns(
		address creator,//0
		string photo,//1
		string name,//2
		uint priceDaily,//3
		uint deposit,//4
		address renterAddress,//5
		uint renterSince,//6
		bool rented,//7
		string detail,//8
		uint categories,//9
		bool isDelete
	)
	{
		creator = objects[objID].creator;
		photo = objects[objID].photo;
		name = objects[objID].name;
		priceDaily = objects[objID].priceDaily;
		deposit = objects[objID].deposit;
		renterAddress = objects[objID].renter.addr;
		renterSince = objects[objID].renter.since;
		rented = objects[objID].rented;
		detail = objects[objID].detail;
		categories = objects[objID].categories;
		isDelete = objects[objID].isDelete;
	}

	// function getObject(uint objID) constant objectInRange(objID)
	// 	returns(Object object)
	// {
	// 	object = objects[objID];
	// }

	function rentObj(uint objID) payable objectInRange(objID) returns(bool){
		if(objectIsRented(objID) || msg.value < objects[objID].deposit || msg.sender == objects[objID].creator){
			throw;
		}
		objects[objID].renter = Renter({addr:msg.sender, since:now});  //record the info of the renter
		uint rest = msg.value - objects[objID].deposit;  //支付一个不低于deposit的值
		if(!objects[objID].renter.addr.send(rest)){   // return the rest balance扣自己钱存入合约余额中
			throw;
		}
		objects[objID].rented = true;
		users[msg.sender].object_rented.push(objID);
		users[msg.sender].object_rentedTime.push(now);
		NewRent(objID, objects[objID].creator, objects[objID].renter.addr, objects[objID].photo, objects[objID].name, objects[objID].priceDaily, objects[objID].deposit, true, now);
		return true;
	}

	function returnObj(uint objID) payable objectInRange(objID) returns (bool){
		if(!objects[objID].rented){
			throw;
		}
		if(objects[objID].renter.addr != msg.sender){
			throw;
		}
		uint duration = (now - objects[objID].renter.since) / (24*60*60*1.0);
		uint charge = duration * objects[objID].priceDaily;
		// uint days = (duration / (24*60*60*1.0));
		// uint charge = days * objects[objID].priceDaily;
		if(!objects[objID].creator.send(charge)){
			throw;
		}
		if(!objects[objID].renter.addr.send(objects[objID].deposit - charge)){
			throw;
		}
		delete objects[objID].renter;
		objects[objID].rented = false;
		NewReturn(objID, msg.sender, false, now);
		return true;
	}

	function modifyObject(uint objID,string name,uint priceDaily,uint deposit,string detail, uint categories) public{
		objects[objID].name = name;
		objects[objID].priceDaily = priceDaily;
		objects[objID].deposit = deposit;
		objects[objID].detail = detail;
		objects[objID].categories = categories;
	}

	function deleteObject(uint objID) public{
		objects[objID].isDelete = true;
	}

	function getUserRent(address user) constant returns(uint[]){
		return users[user].object_rent;
	}

	function getUserRented(address user) constant returns(uint[]){
		return users[user].object_rented;
	}

	function getUserRentedTime(address user) constant returns(uint[]){
		return users[user].object_rentedTime;
	}

	function findNames(string name) constant returns(uint[]){
		return nameToKeys[name].keys;
	}

	function findTypes(uint categories) constant returns(uint[]) {
		return typeToKeys[categories].keys;
	}

	function getNumObjects() constant returns(uint){
		return numObjects;
	}

	function getObjectIds() constant returns(uint[]){
		return ids;
	}

	function getObjectName(uint objID) objectInRange(objID) returns(string objName){
		var obj = objects[objID];
		objName = obj.name;
	}

	function getObjectPhoto(uint objID) objectInRange(objID) returns(string){
		return objects[objID].photo;
	}

	function getObjectCreator(uint objID) constant objectInRange(objID) returns(address){
		return objects[objID].creator;
	}

	function getObjectPriceDaily(uint objID) constant objectInRange(objID) returns(uint){
		return objects[objID].priceDaily;
	}

	function getObjectDeposit(uint objID) constant objectInRange(objID) returns(uint){
		return objects[objID].deposit;
	}

	function getObjectRenterAddress(uint objID) constant objectInRange(objID) returns(address){
		return objects[objID].renter.addr;
	}

	function getObjectRenterSince(uint objID) constant objectInRange(objID) returns(uint){
		return objects[objID].renter.since;
	}

	function getObjectDetail(uint objID) constant objectInRange(objID) returns(string){
		return objects[objID].detail;
	}

	function getObjectCategories(uint objID) constant objectInRange(objID) returns(uint){
		return objects[objID].categories;
	}

	function remove() onlyOwner {
		selfdestruct(owner);
		// suicide(owner);
	}
}
