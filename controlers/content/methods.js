var Promise = require("bluebird");

var home_path = "../../"
var Content = require(home_path + "models/content.js");
var Account = require(home_path + "models/account.js");


module.exports.create = function(req,res){
  console.log("creating new entry");
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
      console.log(err);
      res.redirect(302, req.session.lastPage);
    })
}


module.exports.read = function(req,res){
  var url = req.path;
  var acc = Account.findOne({"sessionId": req.sessionID});
  var con = Content.findOneByURL(req.path);

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
        res.status(404).end();
      }
    })
    .catch(function(err){
      console.log(err)
      res.status(500).end();
    })
}

module.exports.readA = function(req,res){
  req.session.lastPage = req.originalUrl;
  var url = req.path;
  Account.findOne({"sessionId": req.sessionID}).then(function(acc){
    if(acc.name === req.params.acc){
      Content.findOneByURL(url).
        then(function(item){
          console.log(url)
          if(item){
            res.render("index.jade",{loged_input: true, inpUser:{name: acc.name}, inContent: item});
          }else{
            res.status(404).end();
          }
        })
    }else{
      console.log("unauthorised")
      res.redirect(302,"/nav/main")
    }
  })
}


module.exports.yourAccountPage = function(req,res){
  var url = req.path;
  Account.findOne({"sessionId": req.sessionID})
    .then(function(acc){
      var entries = getEntryList(acc.entries);
      return Promise.all([acc, entries]);
    })
    .then(function(result){
      res.render("accountInfo.jade",{loged_input: true, iCont: "info", inpUser:{name: result[0].name, email: result[0].email}, iEntries: result[1]});
    })
    .catch(function(err){
      console.log(err);
      res.redirect(302, req.session.lastPage);
    })
}

module.exports.createAccountPage = function(req,res){
  var url = req.path;
  Account.findOne({"sessionId": req.sessionID})
    .then(function(acc){
      if(!acc){
        return res.render("accountInfo.jade",{loged_input: false, iCont: "create"});
      }else{
        throw "Already logged in.";
      }
    })
    .catch(function(err){
      console.log(err);
      res.redirect(302, req.session.lastPage);
    })
}

module.exports.newEntry = function(req,res){
  var url = req.path;
  req.session.lastPage = req.originalUrl;
  Account.findOne({"sessionId": req.sessionID})
    .then(function(acc){
      if(acc){
        res.render("accountInfo.jade",{loged_input: true, iCont: "newEntry", inpUser:{name: acc.name}});
      }else{
        res.redirect(302,"/nav/main")
      }
    })
}

module.exports.update = function(req,res){
  console.log("updating something");
}


module.exports.delete = function(req,res){
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
      console.log(err);
    })
    .finally(function() {
      res.redirect(302, "/nav/yourAccount");
    })
}

module.exports.browseScreen = function(req,res){
  var categories = ["Shroom Monsters", "Hive Mind", "Shapeless", "Deities", "Goblin", "Beast", "Humman", "Elf", "Demon", "Celestial", "Insect"];
  req.session.lastPage = req.originalUrl;
  Account.findOne({"sessionId": req.sessionID})
    .then(function(acc){
      if(acc){
        res.render("browse.jade",{loged_input: true, inCategories: categories});
      }else{
        res.render("browse.jade",{loged_input: false, inCategories: categories});
      }
    })
    .catch(function(err){
      console.log(err);
      res.redirect(302, "/nav/main")
    })

}

module.exports.displayCategory = function(req,res){
  req.session.lastPage = req.originalUrl;
  var category = req.params.category;
  var acc = Account.findOne({"sessionId": req.sessionID});
  var conts = Content.find({class: category}).select("url title -_id");

  Promise.all([acc, conts])
    .then(function(result){
      if(result[0]){
        var loged = true;
      }else{
        var loged = false;
      }
      var entries = [];
      for(var ii = 0; ii<result[1].length; ii++){
        entries.push({title: result[1][ii].title, url: result[1][ii].url})
      }
      res.render("category.jade",{loged_input: loged, inEntries: entries, inCategory: category});

    })
    .catch(function(err){
      console.log(err);
      res.redirect(302, "/nav/main")
    })

}

//PRIVATE FUNCTIONS

function validateEntry(obj, acc){
  var valObj = {
    title:      obj.title,
    class:      obj.class,
    text:       obj.describtion,
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
    //Attacks:    [String],
    Traits:     obj.traits.trim().split(";"),
    //Skills:     [String],
    // Notes:      [String],
     url:        '/' + acc.name + '/' + obj.title.trim().replace(/\s/g, ""),
    // tags:       [String],
    // template: String,
    creator:  acc._id,
    public:   acc.name === "admin" ? true : false
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
            entryList.push({"title": item.title, 'url': "/nav" + item.url});
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
