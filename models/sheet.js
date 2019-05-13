var fixtures = require('node-mongoose-fixtures')

var Promise = require("bluebird")
var mongoose = Promise.promisifyAll(require("mongoose"))
mongoose.Promise = require('bluebird')

/* 
 * Example schemas:
 * {
 *    type: "nested",
 *    inherits: ["human"],
 *    features: [
 *      { "id": "missing-limb", "params": ["left-arm"] },
 *      { "id": "strength", "params": [-2] },
 *      { "id": "dexterity", "params": [3] },
 *    ]
 * }
 * {
 *    type: "base",
 *    id: "human",
 *    attributes: [
 *      ST: 10,
 *      DX: 10,
 *      IQ: 10,
 *      HT: 10,
 *    ]
 *    features: [
 *      { "id": "limb", "params": ["left-arm", "right-arm", "left-leg", "right-leg"] },
 *
 *
 *

var _schema = new mongoose.Schema({
  attributes: {
    ST: String,
    DX: String,
    IQ: String,
    HT: String,
  },
  secondaryAttributes: {
    Will:       String,
    Perception: String,
    HP:         String,
    FP:         String,
    Speed:      String,
    Move:       String,
    SizeModifier: String,
    Dodge:      String,
    Parry:      String,
  },
  Attacks:    [String],
  Traits:     [String],
  Skills:     [String],
  Notes:      [String],
  url:        String,
  publicUrl:  String,
  tags:       [String],
  template: String,
  creator:  String,
  public:   Boolean,
})

