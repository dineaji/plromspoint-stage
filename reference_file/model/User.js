/**
 * User Schema and Model
 * Add or update user earnings either on game exit or after redemption
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create schema
var carSchema = new Schema({
    carId: String,
    powerups: [{
        id: String,
        level: Number,
        _id : {id:false}
    }],
    _id : {id:false}
});
var environmentSchema = new Schema({
    name: String,
    bestDist: Number,
    _id : {id:false}
});
var badgeSchema = new Schema({
    badgeId: String,
    title: String,
    category: String,
    collectionKey: String,
    imageUrl: String,
    earnedDate: Date,
    _id : {id:false}
});
var gameSchema = new Schema({
    gameid: { type: String, index: true },
    cars: [carSchema],
    environment: [environmentSchema],
    _id : {id:false}
});
var userSchema = new Schema({
    user: { type: String, required: true, index: true },
    coins: Number,
    badges: [badgeSchema],
    games: [gameSchema],
    createdAt: Date,
    updatedAt: Date
});

// set created and updated date before save
userSchema.pre('save', function(next) {
    var currentDate = new Date();
    this.updatedAt = currentDate;
    if (!this.createdAt) {
        this.createdAt = currentDate;
    }
    next();
});

// create model using schema
var User = mongoose.model('User', userSchema);

module.exports = {
    User: User
};
