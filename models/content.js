//CONTENT SCHEMA
var Promise = require("bluebird");
var mongoose = Promise.promisifyAll(require("mongoose"));
mongoose.Promise = require('bluebird');

var content_schema = new mongoose.Schema({
  title:      String,
  class:      String,
  text:       String,
  AttributeTable: {
    ST:         String,
    HP:         String,
    Speed:      String,
    DX:         String,
    Will:       String,
    Move:       String,
    IQ:         String,
    Per:        String,
    SM:         String,
    HT:         String,
    FP:         String,
    Pr:         String,
    Dodge:      String,
    Parry:      String,
    DR:         String,
  },
  Attacks:    [String],
  Traits:     [String],
  Skills:     [String],
  Notes:      [String],
  url:        String,
  tags:       [String],
  template: String,
  creator:  String,
  public:   Boolean,
});

content_schema.statics.findOneById = function(id){
  return this
  .findOne({"_id": id})
  .exec();
}

content_schema.statics.findOneByURL = function(url){
  return this
  .findOne({"url": url})
  .exec();
}

content_schema.statics.findOneByTitle = function(title){
  return this
  .findOne({"title": title})
  .exec();
}

module.exports = mongoose.model("content", content_schema);
