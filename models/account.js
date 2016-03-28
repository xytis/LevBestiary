//ACCOUNT SCHEMA
var Promise = require("bluebird");
var mongoose = Promise.promisifyAll(require("mongoose"));
mongoose.Promise = require('bluebird');

var account_schema = new mongoose.Schema({
  name:       String,
  password:   String,
  email:      String,
  sessionId:  String,
  entries:    [String]
});

account_schema.statics.findOneById = function(id){
  return this
  .findOne({"_id": id})
  .exec();
}

account_schema.statics.findOneByName = function(name){
  return this
  .findOne({"name": name})
  .exec();
}

module.exports = mongoose.model("account", account_schema);
