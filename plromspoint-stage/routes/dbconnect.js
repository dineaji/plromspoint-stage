/*To connect using the mongo shell:
mongo ds127801.mlab.com:27801/plromspointv1 -u dineaji -p 27smss106

To connect using a driver via the standard MongoDB URI
mongodb://dineaji:27smss106@ds127801.mlab.com:27801/plromspointv1
*/


var express = require('express');
var mongodb = require('mongodb')

var router = express.Router();

var env = process.env.NODE_ENV = process.env.NODE_ENV || 'development';

/* GET home page. */
router.get('/', function(req, res, next) {
	console.log(env)
	var mongoclient = mongodb.MongoClient;
	if(env == "development"){
		var url = "mongodb://localhost:27017/ppCollections";
	} else{
		SET MONGOLAB_URI="mongodb://dineaji:27smss106@ds127801.mlab.com:27801/plromspointv1";
		var url = process.env.MONGOLAB_URI
		//var url ="mongodb://dineaji:27smss106@ds127801.mlab.com:27801/plromspointv1"
	}

	mongoclient.connect(url,function(err,db){
		if(err){
			console.log("Unable to connect to server");
		} else{
			
			var collection = db.collection('formdatas');
			collection.find({}).toArray(function(err,result){
				if(err){
					res.send(err);
				} else if(result){
		  			res.render('server', {
		  				"collections" : result
		  			});
					//console.log(result);
				} else{
					console.log("No result found");
				}
				db.close();
			});

		}
	})
});

router.post("/userDatas",function(req,res){
	var mongoclient = mongodb.MongoClient;
	if(env == "development"){
		var url = "mongodb://localhost:27017/ppCollections";
	} else{
		SET MONGOLAB_URI="mongodb://dineaji:27smss106@ds127801.mlab.com:27801/plromspointv1";
		var url = process.env.MONGOLAB_URI
	}
	mongoclient.connect(url,function(err,db){
		if(err){
			console.log("form field values not found")
		} else{
			var collection = db.collection('formdatas');
			var newUser = {
				"name": req.body.name,
				"sex": req.body.sex,
				"age": req.body.age,
				"address": req.body.address,
			}
			console.log(newUser)
			collection.insert([newUser],function(err,result){
				//console.log(collection)
				if(err){
					console.log("data not inserted",err)
				} else{
					res.redirect("server")
					console.log("data inserted successfully")
				}
				db.close();
			});
		}

	});
})
module.exports = router;
