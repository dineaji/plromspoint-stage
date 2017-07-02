var throng = require('throng');

// constants
var WORKERS = process.env.WEB_CONCURRENCY || 1;
var PORT = process.env.PORT || 3000;
var END_PATH = "/HWEndlessRacer/";

throng(start, {
    workers: WORKERS,
    lifetime: Infinity
});

// start point
function start() {
    var errorContentType = 'text/plain';
    var errorStatus = 417;
    var successStatus = 200;
    var notFoundStatus = 204;
    var notFoundMsg = "No records found";

    // import necessarry modules
    var express = require('express');
    var bodyParser = require('body-parser');
    var cacheManager = require('cache-manager');

    // import db and schemas
    var db = require('./model/db');
    var UserSchema = require('./model/User');


    // Start express app
    var app = express();
    var cors = require('cors');
    app.use(bodyParser.json());
    var memoryCache = cacheManager.caching({ store: 'memory', max: 100, ttl: 100 /*seconds*/ });

    var corsOptions = {
        origin: [
          /hotwheels\.com$/,     // default
          /hotwheels\.com:\d+$/, // any port
          /floor84studio\.com$/,
          /f84games\.com$/
        ]
    };

    var corsHandler = cors(corsOptions)
    app.use(corsHandler);

    //allow preflight
    app.options('*', corsHandler); // include before other routes

    // initialize variables
    var responseData = [];
    var querystring = require('querystring');
    var crypto = require('crypto');
    var jwt  = require('jsonwebtoken');
    var secret = process.env.HASH_KEY;
    var signingKey = process.env.WEBTOKEN_KEY;

    var claims = {
        iss: "hwracer",
        iat: new Date().getTime(),
        expiresIn: "30m"
      };
//authentication using JWT
    app.post(END_PATH + 'oauthtoken', function(req, res) {
        var jsonString = '';
        
        req.on('data', function (data) {
          jsonString += data;
        });

        req.on('end', function () {
            var cond = querystring.parse(jsonString);

            var hash = crypto.createHmac('sha256', secret)
                         .update(cond.clientId)
                         .digest('base64');

            if (req.headers['x-signature'] == hash) {
                var token = jwt.sign(claims,signingKey);
                res.send(token);
            }
            else {
                responseData = "Invalid authorization";
                res.status(401).send(responseData);
                return;
            }
        });
        
    });

    // Add or update user earnings either on game exit or after redemption
    app.post(END_PATH + 'recordEarnings', function(req, res) {
        var token = (req.body && req.body.accesstoken) || req.headers['x-access-token'];
        jwt.verify(token,signingKey,function(err,token){
            if(err){
                res.status(401).send("Invalid Request");
                return;
            }
            else{
                var responseData = [];
                var errorMsg = "Must provide proper earning detials";
                var successMsg = "Earnings updated";
                var successContentType = 'application/text';
                var errorContentType = 'application/text';

                var bodyData = req.body;
                if (bodyData != undefined) {

                    if (bodyData.user) {
                        // check if the user already exists
                        var query = UserSchema.User.findOne({ 'user': bodyData.user });
                        query.exec(function(err, existingUser) {
                            if (existingUser) {
                                var userData = existingUser;
                            } else {
                                // Prepare data to save
                                var userData = new UserSchema.User();
                                userData.user = bodyData.user;
                            }
                            if(bodyData.coins) {
                                userData.coins = bodyData.coins;
                            }
                            if(!userData.badges)
                                userData.badges = [];
                            if(bodyData.badges) {
                                Array.prototype.push.apply(userData.badges, bodyData.badges)
                            }
                            if(bodyData.games) {
                                var isExistingGame = false;
                                var usergame={};
                                userData.games.forEach(function(currentGame) {
                                    if(currentGame.gameid == bodyData.games[0].gameid) {
                                        isExistingGame = true;
                                        usergame = currentGame;
                                        userData.games.splice(userData.games.indexOf(currentGame),1);
                                    }
                                });

                                
                                usergame.gameid = bodyData.games[0].gameid;
                                if(bodyData.games[0].cars)
                                    usergame.cars = bodyData.games[0].cars;
                                userData.games.push(usergame);
                                // Save data
                                userData.save(function(err) {
                                    if (!err) {
                                        res.set('Content-Type', successContentType);
                                        res.status(successStatus).send(successMsg);
                                    } else {
                                        err.created = false;
                                        responseData.push(err);
                                        res.json(responseData);
                                    }
                                });
                            }
                            else {
                                // Save data
                                userData.save(function(err) {
                                    if (!err) {
                                        res.set('Content-Type', successContentType);
                                        res.status(successStatus).send(successMsg);
                                    } else {
                                        err.created = false;
                                        responseData.push(err);
                                        res.json(responseData);
                                    }
                                });
                            }
                            
                        });
                    } else {
                        res.set('Content-Type', errorContentType);
                        res.status(417).send(errorMsg);
                        return;
                    }
                } else {
                    res.set('Content-Type', errorContentType);
                    res.status(417).send(errorMsg);
                    return;
                }
            }
        });
    });

    // Add or update environment details user has unlocked along with best distance on game exit
    app.post(END_PATH + 'unlockEnvironment', function(req, res) {
        var token = (req.body && req.body.accesstoken) || req.headers['x-access-token'];
        jwt.verify(token,signingKey,function(err,token){
            if(err){
                res.status(401).send("Invalid Request");
                return;
            }
            else{
                var responseData = [];
                var bodyData = req.body;
                var errorMsg = "Must provide proper environment detials";
                var successMsg = "Environment details updated";
                var successContentType = 'application/text';
                var errorContentType = 'application/text';

                if (bodyData != undefined) {

                    if (bodyData.user && bodyData.games && bodyData.games[0].environment) {
                        // check if the user already exists
                        var query = UserSchema.User.findOne({ 'user': bodyData.user });
                        query.exec(function(err, existingUser) {
                            if (existingUser) {
                                var userData = existingUser;
                            } else {
                                // Prepare data to save
                                var userData = new UserSchema.User();
                                userData.user = bodyData.user;
                            }
                            if(bodyData.coins) {
                                userData.coins = bodyData.coins;
                            }

                            var isExistingGame = false;
                            var usergame = {};
                            userData.games.forEach(function(currentGame) {
                                if(currentGame.gameid == bodyData.games[0].gameid) {
                                    isExistingGame = true;
                                    usergame = currentGame;
                                    userData.games.splice(userData.games.indexOf(currentGame),1);
                                }
                            });

                            
                            usergame.gameid = bodyData.games[0].gameid;
                            if(bodyData.games[0].environment)
                                usergame.environment = bodyData.games[0].environment;
                            userData.games.push(usergame);
                            // Save data
                            userData.save(function(err) {
                                if (!err) {
                                    res.set('Content-Type', successContentType);
                                    res.status(successStatus).send(successMsg);
                                } else {
                                    err.created = false;
                                    responseData.push(err);
                                    res.json(responseData);
                                }
                            });

                        });
                    } else {
                        res.set('Content-Type', errorContentType);
                        res.status(417).send(errorMsg);
                        return;
                    }
                } else {
                    res.set('Content-Type', errorContentType);
                    res.status(417).send(errorMsg);
                    return;
                }
            }
        });
    });

    // Retrieve current state for user with earning and environment details
    app.post(END_PATH + 'getCurrentState', function(req, res) {
        var token = (req.body && req.body.accesstoken) || req.headers['x-access-token'];
        jwt.verify(token,signingKey,function(err,token){
            if(err){
                res.status(401).send("Invalid Request");
                return;
            }
            else{
                var bodyData = req.body;
                var errorMsg = "Must provide User Id";
                var successContentType = 'application/json';
                var errorContentType = 'application/text';

                if (bodyData != undefined) {
                    if (bodyData.user) {
                        // get user details from cache/db
                        var cacheKey = 'user_' + bodyData.user;
                        var ttl = 30;

                        memoryCache.wrap(cacheKey, function(cacheCallback) {
                            var userProjection = {__v:0, createdAt:0, updatedAt: 0, _id:0};
                            var query = UserSchema.User.findOne({ 'user': bodyData.user }, userProjection, cacheCallback);
                        }, { ttl: ttl }, function(err, existingUser) {
                            if (existingUser) { // success
                                existingUser = existingUser.toObject();

                                // send result as response
                                res.set('Content-Type', successContentType);
                                res.status(successStatus).send(existingUser);
                            } else { // not found
                                res.set('Content-Type', errorContentType);
                                res.status(notFoundStatus).send(notFoundMsg);
                                return;
                            }
                        });
                    } else {
                        res.set('Content-Type', errorContentType);
                        res.status(417).send(errorMsg);
                        return;
                    }
                } else {
                    res.set('Content-Type', errorContentType);
                    res.status(417).send(errorMsg);
                    return;
                }
            }
        });
    });

    // Retrieve currency balance for given user
    app.post(END_PATH + 'getCurrencyBalance', function(req, res) {
        var token = (req.body && req.body.accesstoken) || req.headers['x-access-token'];
        jwt.verify(token,signingKey,function(err,token){
            if(err){
                res.status(401).send("Invalid Request");
                return;
            }
            else{
                var bodyData = req.body;
                var errorMsg = "Must provide User Id";
                var successContentType = 'application/json';
                var errorContentType = 'application/text';

                if (bodyData != undefined) {
                    if (bodyData.user) {
                        // get user details from cache/db
                        var cacheKey = 'usercur_' + bodyData.user;
                        var ttl = 30;

                       // memoryCache.wrap(cacheKey, function(cacheCallback) {
                            var userProjection = {user:1, coins:1, _id:0};
                            var query = UserSchema.User.findOne({ 'user': bodyData.user }, userProjection);
                        //}, { ttl: ttl }, function(err, existingUser) {
                            query.exec(function(err, existingUser) {
                            if (existingUser) { // success
                                existingUser = existingUser.toObject();
                                // send result as response
                                res.set('Content-Type', successContentType);
                                res.status(successStatus).send(existingUser);
                            } else { // not found
                                res.set('Content-Type', errorContentType);
                                res.status(notFoundStatus).send(notFoundMsg);
                                return;
                            }
                        });
                    } else {
                        res.set('Content-Type', errorContentType);
                        res.status(417).send(errorMsg);
                        return;
                    }
                } else {
                    res.set('Content-Type', errorContentType);
                    res.status(417).send(errorMsg);
                    return;
                }
            }
        });
    });

    // update bulk badge id 
    app.post(END_PATH + 'updateBadgeDetail', function(req, res) {
        var bodyData = req.body;
        var errorMsg = "Must provide badge details to update";
        var successContentType = 'application/json';
        var errorContentType = 'application/text';

        if (bodyData != undefined && bodyData.badges) {
            var bulkop=UserSchema.User.collection.initializeOrderedBulkOp();   
             bodyData.badges.forEach(function(badge) {
                
                bulkop.find({ 'badges.badgeId':badge.existingId }).update( { $set: { 'badges.$.badgeId':badge.newId } });  
                results=bulkop.execute(function(err,result) { 
                    //res.set('Content-Type', successContentType);
                    console.log(JSON.stringify(result)); 
                });

            });
            res.set('Content-Type', successContentType);
            res.status(successStatus).send("update success");
        } else {
            res.set('Content-Type', errorContentType);
            res.status(417).send(errorMsg);
            return;
        }
            

    });

    app.listen(PORT, onListen);

    function onListen() {
        console.log('Listening on', PORT);
    }
}
