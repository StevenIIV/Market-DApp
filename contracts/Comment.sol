pragma solidity ^0.4.19;
pragma experimental ABIEncoderV2;
contract Comment {
    struct ArticleComment {
        uint createAt;
        address sender;
        uint rating;
        string comment;
    }
    struct ObjectComment {
        uint createAt;
        address sender;
        uint rating;
        string comment;
    }
    mapping(uint => ArticleComment[]) public ArticleComments;
    mapping(uint => ObjectComment[]) public ObjectComments;

    function addArticleComment(uint ArticleId, uint rating, string comment) public returns (bool success) {
        ArticleComment memory articleComment = ArticleComment({
            createAt: now,
            sender: msg.sender,
            rating: rating,
            comment: comment
            });
        ArticleComments[ArticleId].push(articleComment);
        return true;
    }

    function addObjectComment(uint ObjectId, uint rating, string comment) public returns (bool success) {
        ObjectComment memory objectComment = ObjectComment({
            createAt: now,
            sender: msg.sender,
            rating: rating,
            comment: comment
            });
        ObjectComments[ObjectId].push(objectComment);
        return true;
    }

    function getArticleCommentsLength(uint ArticleId) public constant returns (uint) {
        return ArticleComments[ArticleId].length;
    }

    function getObjectCommentsLength(uint ObjectId) public constant returns (uint) {
        return ObjectComments[ObjectId].length;
    }

    function getArticleComment(uint ArticleId, uint id) public constant returns (uint, address, uint, string){
        ArticleComment[] articleComments = ArticleComments[ArticleId];
        return (articleComments[id].createAt, articleComments[id].sender, articleComments[id].rating, articleComments[id].comment);
    }

    function getObjectComment(uint ObjectId, uint id) public constant returns (uint, address, uint, string){
        ObjectComment[] objectComments = ObjectComments[ObjectId];
        return (objectComments[id].createAt, objectComments[id].sender, objectComments[id].rating, objectComments[id].comment);
    }

}