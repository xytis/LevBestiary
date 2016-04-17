var Promise = require("bluebird");

var home_path = "../../"
var Content = require(home_path + "models/content.js");
var Account = require(home_path + "models/account.js");
var fs = require('fs');

var loggerC = require(home_path + 'logger.js');
var logger = loggerC();

module.exports.create = function(req,res){
  logger.info("Creating new enrty")
  Account.findOne({"sessionId": req.sessionID})
    .then(function(acc){
      var validated_data = validateEntry(req.body, acc);
      var content = new Content(validated_data);
      content.save();
      return [acc, content];
    })
    .then(function(result){
      var entries = result[0].entries;
      entries.push(result[1]._id);
      result[0].update({"entries": entries}).exec();
      res.redirect(302, req.session.lastPage);
    })
    .catch(function(err){
      logger.error("Error in create: " + err)
      res.redirect(302, req.session.lastPage);
    })
}


module.exports.read = function(req,res){
  var acc = Account.findOne({"sessionId": req.sessionID});
  if(req.path == "/main"){
    var con = JSON.parse(fs.readFileSync('public/main.json', 'utf8'));
  }else{
    var con = Content.findOneByURL(req.path);
  }

  req.session.lastPage = req.originalUrl;
  Promise.all([acc, con])
    .then(function(result){
      if(result[1]){
        if(result[0]){
          res.render("index.jade",{loged_input: true, inpUser:{name: result[0].name}, inContent: result[1]});
        }else{
          res.render("index.jade",{loged_input: false, inpUser:{name: "name"}, inContent: result[1]});
        }
      }else{
          res.status(404).render("404.jade", {url: "/nav" +req.url});
      }
    })
    .catch(function(err){
      logger.error("Error in read: " + err);
      res.status(500).end();
    })
}

module.exports.publicRead = function(req,res){
  var acc = Account.findOne({"sessionId": req.sessionID});
  var con = Content.findOne({publicUrl: req.url});

  req.session.lastPage = req.originalUrl;
  Promise.all([acc, con])
    .then(function(result){
      if(result[0]){
        var loged = true;
        var name = result[0].name;
      }else{
        var loged = false;
        var name = undefined
      }
      if(result[1]){
        res.render("index.jade",{loged_input: loged, inpUser:{name: name}, inContent: result[1]});
      }else{
        res.status(404).render("404.jade", {url: "/nav" +req.url});
      }
    })
    .catch(function(err){
      logger.error("Error in publicRead: " + err)
      res.status(500).end();
    })
}

module.exports.readA = function(req,res){
  req.session.lastPage = req.originalUrl;
  var url = req.path;
  console.log(req.session.cookie.expires)

  acc = Account.findOne({"sessionId": req.sessionID});
  item = Content.findOneByURL(url);

  Promise.all([acc, item])
    .then(function(result){
      if(!result[0]){
        throw "Session Expired";
      }
      if(result[0].name === req.params.acc){
        res.render("index.jade",{loged_input: true, inpUser:{name: result[0].name}, inContent: result[1]});
      }else{
        throw "Unauthorised";
      }
    })
    .catch(function(err){
      logger.error("Error in readA: " + err)
      res.redirect(302,"/nav/main")
    })
}


module.exports.yourAccountPage = function(req,res){
  Account.findOne({"sessionId": req.sessionID})
    .then(function(acc){
      if(!acc){
        throw "Session Expired";
      }
      var entries = getEntryList(acc.entries);
      return Promise.all([acc, entries]);
    })
    .then(function(result){
      res.render("accountInfo.jade",{loged_input: true, iCont: "info", inpUser:{name: result[0].name, email: result[0].email}, iEntries: result[1]});
    })
    .catch(function(err){
      logger.error("Error in yourAccountPage: " + err)
      res.redirect(302, req.session.lastPage);
    })
}

module.exports.createAccountPage = function(req,res){
  Account.findOne({"sessionId": req.sessionID})
    .then(function(acc){
      if(!acc){
        return res.render("accountInfo.jade",{loged_input: false, iCont: "create"});
      }else{
        throw "Already logged in.";
      }
    })
    .catch(function(err){
      logger.error("Error in createAccountPage: " + err)
      res.redirect(302, req.session.lastPage);
    })
}

module.exports.newEntry = function(req,res){
  var categories = JSON.parse(fs.readFileSync('public/categories.json', 'utf8')).categories;
  req.session.lastPage = req.originalUrl;
  Account.findOne({"sessionId": req.sessionID})
    .then(function(acc){
      if(acc){
        res.render("accountInfo.jade",{loged_input: true, iCont: "newEntry", inpUser:{name: acc.name}, inCategories: categories});
      }else{
        res.redirect(302,"/nav/main")
      }
    })
}

module.exports.update = function(req,res){
  console.log("updating something");
}


module.exports.accoutPageOp = function(req, res){
  var method = req.body._method;

  switch (method){
    case "delete":
      deleteA(req,res);
      break;
    case "makePublic":
      toglePublic(req,res);
      break;
    case "makePrivate":
      toglePublic(req,res);
      break;
  }
}

function toglePublic(req,res){
  var currentState = req.body._method;
  var acc = Account.findOne({"sessionId": req.sessionID});
  var con = Content.findOneByURL(req.path);
  Promise.all([acc, con])
    .then(function(result){
      //result[0] === acc result[1] === content
      if(result[0]._id == result[1].creator){
        if(result[1].public){
          result[1].update({public: false}).exec();
        }else{
          result[1].update({public: true}).exec();
        }
      }else{
        throw new CustomError("Failed to delete due to restrictions: user does not own entry");
      }
    })
    .catch(function(err){
      logger.error("Error in toglePublic: " + err)
    })
    .finally(function() {
      res.redirect(302, "/nav/yourAccount");
    })
}


function deleteA(req,res){
  var method = req.body._method;
  var acc = Account.findOne({"sessionId": req.sessionID});
  var con = Content.findOneByURL(req.path);
  Promise.all([acc, con])
    .then(function(result){
      //result[0] === acc result[1] === content
      if(method === "delete" && result[0]._id == result[1].creator){
        var arr = result[0].entries;
        var toRemove = arr.splice(arr.indexOf(result[1]._id),1);
        return Promise.all([
          result[0].update({entries: arr}),
          result[1].remove()
        ]);
      }else{
        throw new CustomError("Failed to delete due to restrictions: either wrong method, or user does not own entry");
      }
    })
    .catch(function(err){
      logger.error("Error in deleteA: " + err)
    })
    .finally(function() {
      res.redirect(302, "/nav/yourAccount");
    })
}

module.exports.browseScreen = function(req,res){
  var categories = JSON.parse(fs.readFileSync('public/categories.json', 'utf8')).categories;
  req.session.lastPage = req.originalUrl;
  Account.findOne({"sessionId": req.sessionID})
    .then(function(acc){
      if(acc){
        res.render("browse.jade",{loged_input: true, inpUser:{name: acc.name}, inCategories: categories});
      }else{
        res.render("browse.jade",{loged_input: false, inpUser: undefined, inCategories: categories});
      }
    })
    .catch(function(err){
      logger.error("Error in browseScreen: " + err)
      res.redirect(302, "/nav/main")
    })

}

module.exports.displayCategory = function(req,res){
  req.session.lastPage = req.originalUrl;
  var category = req.params.category;
  var acc = Account.findOne({"sessionId": req.sessionID});
  var conts = Content.find({class: category}).select("url publicUrl title -_id").where("public").equals(true);

  Promise.all([acc, conts])
    .then(function(result){
      if(result[0]){
        var loged = true;
        var name = result[0].name;
      }else{
        var loged = false;
        var name = undefined
      }
      var entries = [];
      for(var ii = 0; ii<result[1].length; ii++){
        if(result[1][ii].publicUrl){
          entries.push({title: result[1][ii].title, url: result[1][ii].publicUrl})
        }else{
          entries.push({title: result[1][ii].title, url: result[1][ii].url})
        }
      }
      res.render("category.jade",{loged_input: loged, inpUser:{name: name}, inEntries: entries, inCategory: category});

    })
    .catch(function(err){
      logger.error("Error in displayCategory: " + err)
      res.redirect(302, "/nav/main")
    })

}

//PRIVATE FUNCTIONS

function validateEntry(obj, acc){
  var valObj = {
    title:      obj.title,
    class:      obj.class,
    text:       obj.description,
    AttributeTable: {
      ST:         obj.ST,
      HP:         obj.HP,
      Speed:      obj.Speed,
      DX:         obj.DX,
      Will:       obj.Will,
      Move:       obj.Move,
      IQ:         obj.IQ,
      Per:        obj.Per,
      SM:         obj.SM,
      HT:         obj.HT,
      FP:         obj.FP,
      Pr:         obj.Pr,
      Dodge:      obj.Dodge,
      Parry:      obj.Parry,
      DR:         obj.Dr,
    },
    Attacks:    obj.attacks.trim().split(";"),
    Traits:     obj.traits.trim().split(";"),
    Skills:     obj.skills.trim().split(";"),
    Notes:      obj.notes,
    url:        '/' + acc.name + '/' + obj.title.trim().replace(/\s/g, ""),
    publicUrl:  '/public/' + obj.title.trim().replace(/\s/g, ""),
    // tags:       [String],
    // template: String,
    creator:  acc._id,
    public:   false,
  }
  return valObj;
}

function getEntryList(entries){
  return new Promise(function(resolve, reject){
    var entryList = [];
    looper(0);
    function looper(ii){
      if(ii<entries.length){
        Content.findOne({"_id": entries[ii]}, function(err, item){
          if(err){
            reject(err);
          }else{
            entryList.push({title: item.title, url: "/nav" + item.url, public: item.public});
            looper(ii + 1);
          }
        })
      }else{
        resolve(entryList);
      }
    }
  });
}

//ERROR TEST
function CustomError(message) {
  this.name = 'CustomError';
  this.message = message || 'Error text thrown by custom error';
  // this.stack = (new Error()).stack;
}
CustomError.prototype = Object.create(Error.prototype);
CustomError.prototype.constructor = CustomError;
