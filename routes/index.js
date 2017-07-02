var express = require('express');
var mongodb = require("mongodb");

var router = express.Router();
var env = process.env.Node_Env = process.env.Node_Env || 'development';


/* GET home page. */
router.get('/', function(req, res, next) {
  var mongoClient = mongodb.MongoClient;
  var url="mongodb://dineaji:27smss106@ds127801.mlab.com:27801/plromspointv1";
  mongoClient.connect(url,function(err,db){
    if(err){
      console.log("connection Error",err)
    } else{
      console.log("connection established");
      var collection = db.collection('formdatas');
      collection.find({}).toArray(function(err,result){
        res.render('index', {
            "collections" : result
        });
      });
    }
  });
});

module.exports = router;
