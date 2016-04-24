//ACCOUNT ROUTER

var express = require('express'),
    methods = require('./methods');

var router = express.Router({
  caseSensitive: true,
  mergeParams: true,
  strict: true
});

router.post('/yourAccount/ChangePass',   methods.changePass);
router.post('/yourAccount/ChangeEmail',   methods.changeEmail);
router.get('/logout',   methods.logout);

router.post('/login',   methods.login);
router.post('/createAccount',    methods.create);
router.put('/',     methods.update);
router.delete('/',  methods.delete);

module.exports.router = router;
