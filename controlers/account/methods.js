//ACCOUNT METHODS
var Promise = require('bluebird');

var homePath = '../../';
var Account = require(homePath + 'models/account.js');

var loggerC = require(homePath + 'logger.js');
var logger = loggerC();

module.exports.create = function(req, res) {
  var body = req.body;
  logger.error(body.login + body.password + body.passwordR + body.email + body.emailR);
  Promise.all([Account.findOneByName(body.login), Account.findOne({'email': body.email})])
    .then(function(result) {
      if (result[0]) {
        throw 'Account with this name already exists';
      }
      if (result[1]) {
        throw new CustomError('Email already in use');
      }
      if (validatePassword(body.password, body.passwordR) && validateEmail(body.email, body.emailR)) {
        var account = new Account({'name': body.login, 'password': body.password, 'sessionId': req.sessionID, 'email': body.email});
        return account.save();
      }else {
        throw new CustomError('Mistake in repeated email or password');
      }
    })
    .catch(function(err) {
      logger.error('Error in Account/create: ' + err);
    })
    .finally(function() {
      res.redirect(302, '/nav/main');
    });
};

module.exports.logout = function(req, res) {
  logger.info('logging out');
  Account.findOne({'sessionId': req.sessionID})
    .then(function(acc) {
      return acc.update({'sessionId': 0});
    })
    .catch(function(err) {
      logger.error('Error in Account/logout: ' + err);
    })
    .finally(function() {
      res.redirect(302, req.session.lastPage);
    });
};

module.exports.login = function(req, res) {
  var body = req.body;
  Account.findOneByName(body.login)
    .then(function(acc) {
      if (acc.password !== body.password) {
        throw 'Incorect password';
      }
      return acc.update({'sessionId': req.sessionID});
    })
    .then(function() {
      res.redirect(302, req.session.lastPage);
    })
    .catch(function(err) {
      logger.error('Error in Account/login: ' + err);
      res.redirect(302, req.session.lastPage);
    });
};

module.exports.changePass = function(req, res) {
  var body = req.body;
  Account.findOne({'sessionId': req.sessionID})
    .then(function(acc) {
      if (body.password === body.passwordR) {
        return acc.update({password: body.password});
      }else {
        throw new CustomError('Password does not match repeated password');
      }
    })
    .catch(function(err) {
      logger.error('Error in Account/changePass: ' + err);
      res.redirect(302, req.session.lastPage);
    });
};

module.exports.changeEmail = function(req, res) {
  var body = req.body;
  Account.findOne({'sessionId': req.sessionID})
    .then(function(acc) {
      if (body.email === body.emailR) {
        return acc.update({email: body.email});
      }else {
        throw new CustomError('Email does not match repeated email');
      }
    })
    .catch(function(err) {
      logger.error('Error in Account/changeEmail: ' + err);
      res.redirect(302, req.session.lastPage);
    });
};

module.exports.update = function(req, res) {
  console.log('updating something');
};

module.exports.delete = function(req, res) {
  console.log('deleting something');
};

function validateEmail(emailStr, emailStrR) {
  var regEmail = /\w+@\w+\.\w{1,4}/;
  if (!emailStr) {
    logger.error('Email: failed to obtain email string')
    return false;
  }
  if (!regEmail.test(emailStr)) {
    logger.error('Email: Wrong Patter');
    return false;
  }
  if (emailStr !== emailStrR) {
    logger.error('Email: Does not match repeated')
    return false;
  }

  return true;
}

function validatePassword(passStr, passStrR) {
  if (!passStr) {
    logger.error('password: failed to obtain password string')
    return false;
  }
  if (passStr !== passStrR) {
    logger.error('password: strings does not mach')
    return false;
  }
  return true;
}

//ERROR TEST
function CustomError(message) {
  this.name = 'CustomError';
  this.message = message || 'Error text thrown by custom error';
  this.stack = (new Error()).stack;
}
CustomError.prototype = Object.create(Error.prototype);
CustomError.prototype.constructor = CustomError;
