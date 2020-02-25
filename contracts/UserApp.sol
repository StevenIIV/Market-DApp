pragma solidity ^0.4.19;

contract UserApp {
    struct UserStruct {
        uint index;
        string userName;
        string passWord;
        string email;
        uint age;
        address userAddress;
        string sex;
        string description;
    }

    mapping (address => uint) userBalances;

    // make these private because they're related
    mapping(address => UserStruct) private userStructs;
    address[] private userIndex;


    function isUser(address userAddress) public constant returns(bool isIndeed) {
        if(userStructs[userAddress].index > 0) {
            return true;
        } else {
            return false;
        }
    }

    function addNewUser(string userName, string passWord, string email, uint age, address userAddress, string sex, string description) public returns (bool success) {
        userStructs[userAddress].userName = userName;
        userStructs[userAddress].passWord = passWord;
        userStructs[userAddress].email = email;
        userStructs[userAddress].age = age;
        userStructs[userAddress].userAddress = userAddress;
        userStructs[userAddress].sex = sex;
        userStructs[userAddress].description = description;
        userStructs[userAddress].index = userIndex.push(userAddress)-1;
        return true;
    }

    function getUser(address _userAddress) public constant returns(string userName, string passWord, string email, uint age, address userAddress, string sex, string description) {
        return(
        userStructs[_userAddress].userName,
        userStructs[_userAddress].passWord,
        userStructs[_userAddress].email,
        userStructs[_userAddress].age,
        userStructs[_userAddress].userAddress,
        userStructs[_userAddress].sex,
        userStructs[_userAddress].description
        );
    }

    function checkUser(address userAddress, string passWord) public returns (bool success) {
        if (userStructs[userAddress].index > 0) {
            if (keccak256(userStructs[userAddress].passWord) == keccak256(passWord)) {
                return true;
            } else{
                return false;
            }
        } else {
            return false;
        }
    }

    function modifyUser(string userName, string passWord, string email, uint age, address userAddress, string sex, string description) public returns (bool success) {
        userStructs[userAddress].userName = userName;
        userStructs[userAddress].passWord = passWord;
        userStructs[userAddress].email = email;
        userStructs[userAddress].age = age;
        userStructs[userAddress].userAddress = userAddress;
        userStructs[userAddress].sex = sex;
        userStructs[userAddress].description = description;
    }
}