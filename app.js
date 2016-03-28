var Promise = require("bluebird");

var http = require("http"),
    express = require("express"),
    path = require("path"),
    session = require('express-session'),
    cookieParser = require("cookie-parser"),
    MongoDBStore = require('connect-mongodb-session')(session),
    mongoose = Promise.promisifyAll(require("mongoose")),
    favicon = require('serve-favicon'),
    bodyParser = require('body-parser');


//mount controlers
var content = require("./controlers/content");
var account = require("./controlers/account");

//Set Express
var app = express();
app.set("port", process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

//SET MongoDB DATABASE
var DBurl = 'mongodb://localhost:12345/LevDatabase';

//connect mongoose module to mongoDB
mongoose.connect(DBurl);
main_db = mongoose.connection;
main_db.on('error', console.log.bind(console, 'connection error:'));
main_db.once('open', function() {
  console.log("mongoose connected");
});

//session store in mongoDB
var store = new MongoDBStore({
              uri: DBurl,
              collection: 'mySessions'
            });

store.on('error', function(error) {
  console.log("error")
  assert.ifError(error);
  assert.ok(false);
});

//set session thingies
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({secret: "LabaiLabaiIlgaIrPaslaptingaFraze",
                 saveUninitialized: true,
                 resave: true,
                 cookie: {
                   maxAge: 1000 * 60 * 30 // 30 min
                 },
                 store: store
                }));


app.use(express.static(path.join(__dirname, "public")));

//ROUTING
app.use("/nav", content.router);
app.use("/account", account.router);

app.get("/", function(req,res){
  res.redirect(302,"/nav/main")
});

app.use(function(req,res){
  console.log("error in path: " + req.path + ". With method: " + req.method);
  res.status(404).render("404.jade", {url:req.url});
})


//SERVER
http.createServer(app).listen(app.get("port"), function(){
  console.log("Server is running on port " + app.get("port"));
})
