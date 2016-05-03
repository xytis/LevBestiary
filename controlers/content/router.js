//CONTENT ROUTER

var express = require('express');
var methods = require('./methods');

var router = express.Router({
  caseSensitive: true,
  mergeParams: true,
  strict: true
});

router.post('/addEntry',    methods.create);

router.post('/:acc/:entry',    methods.accoutPageOp);

router.get('/yourAccount',   methods.yourAccountPage);
router.get('/createAccount',   methods.createAccountPage);
router.get('/newEntry',   methods.newEntry);
router.get('/Browse',   methods.browseScreen);
router.get('/compare',   methods.compareScreen);

router.get('/Category/:category',   methods.displayCategory);
router.get('/public/:content',   methods.publicRead);
router.get('/:acc/:content',   methods.readA);
router.get('/:content',   methods.read);

router.put('/',     methods.update);
//router.delete("/",  methods.delete);

module.exports.router = router;
