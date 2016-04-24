var Promise = require('bluebird');

var http = require('http');
var express = require('express');
var path = require('path');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var MongoDBStore = require('connect-mongodb-session')(session);
var mongoose = Promise.promisifyAll(require('mongoose'));
var favicon = require('serve-favicon');
var bodyParser = require('body-parser');
var fs = require('fs');
var loggerC = require('./logger.js');

//mount controlers
var content = require('./controlers/content');
var account = require('./controlers/account');

var logger = loggerC();

//Set Express
var app = express();
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

//SET MongoDB DATABASE
var DBipAddress = process.env.DB_IP || '172.0.0.1';
var DBurl = 'mongodb://' + DBipAddress + ':27017/LevDatabase';

//connect mongoose module to mongoDB
mongoose.connect(DBurl);
mainDB = mongoose.connection;
mainDB.on('error', console.log.bind(console, 'connection error:'));
mainDB.once('open', function() {
  logger.info('mongoose connected');
});

//session store in mongoDB
var store = new MongoDBStore({
              uri: DBurl,
              collection: 'mySessions'
            });

store.on('error', function(error) {
  logger.error('Error in Express session: ' + error);
  assert.ifError(error);
  assert.ok(false);
});

//set session thingies
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(session({secret: 'LabaiLabaiIlgaIrPaslaptingaFraze',
                 saveUninitialized: true,
                 resave: true,
                 cookie: {
                   maxAge: 1000 * 60 * 30 // 30 min
                   //  maxAge: 1000 * 10 // 10 s
                 },
                 store: store
                }));

app.use(express.static(path.join(__dirname, 'public')));

//ROUTING
app.use('/nav', content.router);
app.use('/account', account.router);

app.get('/', function(req, res) {
  res.redirect(302,'/nav/main');
});

app.use(function(req, res) {
  logger.warn('error in path: ' + req.path + '. With method: ' + req.method);
  res.status(404).render('404.jade', {url: req.url});
});

//SERVER
// var options = {
//   key: fs.readFileSync('keys/key.pem'),
//   cert: fs.readFileSync('keys/cert.pem')
// };

http.createServer(app).listen(app.get('port'), function() {
  logger.info('Server is running on port ' + app.get('port'));
});
