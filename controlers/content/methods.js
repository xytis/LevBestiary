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
      return [acc, content.save()];
    })
    .then(function(item){
      var entries = item[0].entries;
      entries.push(item[1]._id);
      item[0].update({"entries": entries}).exec();
    })
    .catch(function(err){
      console.log(err);
    })
    .finally(function(){
      res.redirect(302, req.session.lastPage);
    });
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
      return [acc, getEntryList(acc.entries)];
    })
    .then(function(result){
      res.render("accountInfo.jade",{loged_input: true, iCont: "info", inpUser:{name: result[0].name, email: result[0].email}, iEntries: result[1]});
    })
    .catch(function(err){
      console.log(err);
    })
    .finally(function(){
      res.redirect(302, req.session.lastPage);
    });
}

module.exports.createAccountPage = function(req,res){
  var url = req.path;
  Account.findOne({"sessionId": req.sessionID})
    .then(function(acc){
      return res.render("accountInfo.jade",{loged_input: false, iCont: "create"});
    })
    .catch(function(err){
      console.log(err);
    })
    .finally(function(){
      res.redirect(302, req.session.lastPage);
    });
}

module.exports.newEntry = function(req,res){
  var url = req.path;
  req.session.lastPage = req.originalUrl;
  Account.findOne({"sessionId": req.sessionID}).then(function(acc){
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
      if(method === "delete" && result[0]._id === result[1].creator){
        var arr = result[0].entries;
        var toRemove = arr.splice(arr.indexOf(item._id),1);
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
    .finally(function(){
      res.redirect(302, req.session.lastPage);
    });
}


function validateEntry(obj, acc){
  var valObj = {
    title:      obj.title.trim(),
    class:      obj.class.trim(),
    text:       obj.describtion.trim(),
    AttributeTable: {
      ST:         obj.ST.trim(),
      HP:         obj.HP.trim(),
      Speed:      obj.Speed.trim(),
      DX:         obj.DX.trim(),
      Will:       obj.Will.trim(),
      Move:       obj.Move.trim(),
      IQ:         obj.IQ.trim(),
      Per:        obj.Per.trim(),
      SM:         obj.SM.trim(),
      HT:         obj.HT.trim(),
      FP:         obj.FP.trim(),
      Pr:         obj.Pr.trim(),
      Dodge:      obj.Dodge.trim(),
      Parry:      obj.Parry.trim(),
      DR:         obj.Dr.trim(),
    },
    //Attacks:    [String],
    Traits:     obj.traits.trim().split(","),
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
  this.stack = (new Error()).stack;
}
CustomError.prototype = Object.create(Error.prototype);
CustomError.prototype.constructor = CustomError;
