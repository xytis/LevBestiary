//CONTENT ROUTER

var express = require("express"),
    methods = require("./methods");

var router = express.Router({
  caseSensitive: true,
  mergeParams: true,
  strict: true
});

router.post("/addEntry",    methods.create);

router.post("/:acc/:entry",    methods.delete);

router.get("/yourAccount",   methods.yourAccountPage);
router.get("/createAccount",   methods.createAccountPage);
router.get("/newEntry",   methods.newEntry);
router.get("/Browse",   methods.browseScreen);

router.get("/Category/:category",   methods.displayCategory);
router.get("/:acc/:content",   methods.readA);
router.get("/:content",   methods.read);


router.put("/",     methods.update);
router.delete("/",  methods.delete);

module.exports.router = router;
