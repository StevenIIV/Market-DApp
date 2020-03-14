pragma solidity ^0.4.19;

contract UserApp {
    struct UserStruct {
        uint index;
        string photo;
        string userName;
        string email;
        uint age;
        string sex;
        uint createAt;
        uint credit;
        uint soldNumber;
    }

    mapping(address => UserStruct) private userStructs;
    address[] private userIndex;


    function isUser(address userAddress) public constant returns(bool isIndeed) {
        if(userStructs[userAddress].index > 0) {
            return true;
        } else {
            return false;
        }
    }

    function addNewUser(string userName, string photo, string email, uint age,string sex) public returns (bool success) {
        address userAddress = msg.sender;
        userStructs[userAddress].photo = photo;
        userStructs[userAddress].userName = userName;
        userStructs[userAddress].email = email;
        userStructs[userAddress].age = age;
        userStructs[userAddress].sex = sex;
        userStructs[userAddress].createAt = now;
        userStructs[userAddress].credit = 5;
        userStructs[userAddress].soldNumber = 0;
        userStructs[userAddress].index = userIndex.push(userAddress)-1;
        return true;
    }

    function getUser() public constant returns(uint, string, string, string, uint, string, uint, uint, uint) {
        address _userAddress = msg.sender;
        require(userStructs[_userAddress].createAt > 0);
        return(
        userStructs[_userAddress].index,
        userStructs[_userAddress].userName,
        userStructs[_userAddress].photo,
        userStructs[_userAddress].email,
        userStructs[_userAddress].age,
        userStructs[_userAddress].sex,
        userStructs[_userAddress].createAt,
        userStructs[_userAddress].credit,
        userStructs[_userAddress].soldNumber
        );
    }

    function modifyUser(string userName, string email, uint age, string sex) public returns (bool success) {
        address userAddress = msg.sender;
        require(userStructs[userAddress].createAt > 0);
        userStructs[userAddress].userName = userName;
        userStructs[userAddress].email = email;
        userStructs[userAddress].age = age;
        userStructs[userAddress].sex = sex;
    }

    function getUserName(address sender) constant returns(string){
        require(userStructs[sender].createAt > 0);
        return userStructs[sender].userName;
    }

    function modifyUserCredit(uint stars) public{
        address userAddress = msg.sender;
        require(userStructs[userAddress].createAt > 0);
        uint oldCredit = userStructs[userAddress].credit * userStructs[userAddress].soldNumber;
        uint newCredit = (oldCredit + stars) / (userStructs[userAddress].soldNumber + 1);
        userStructs[userAddress].credit = newCredit;
        userStructs[userAddress].soldNumber++;
    }
}