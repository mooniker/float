'use strict';

var env; // configuration variables
try { // check if local env.js exists for dev server
  env = require('./env');
} catch (localEnvJsNotPresentException) {
  // otherwise use production server's config vars
  env = process.env;
}

var express = require('express');
var server = express();
var http = require('http').Server(server);

module.exports = http; // used for websockets in io.js
var io = require('./io');

var path = require('path');

// var Chance = require('chance');
// var chance = Chance();

var session = require('express-session');
var favicon = require('serve-favicon');
var flash = require('connect-flash');
var logger = require('morgan'); // HTTP request logger middleware
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
// var passport = require('passport');
// var LocalStrategy = require('passport-local').Strategy;

// path to public
var pathToPublic = path.join(__dirname, 'public');

// set view engine
server.set('view engine', 'jade');
server.use(express.static(pathToPublic));

server.use(favicon(path.join(pathToPublic, 'favicon.ico')));
server.use(logger('dev'));
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: false }));
server.use(cookieParser());
server.use(session({
  // genid: function(req) { return genuuid(); }, // use UUIDs for sessionIDs
  secret: 'bimilbimilbimil', // used to sign session ID cookie
  resave: false, // forces session to be saved even if unmodified
  saveUninitialized: false // do not force uninitialized session to be saved to store
}));
// server.use(passport.initialize());
// server.use(passport.session());
server.use(flash());

// passport config
// var UserModel = require('./models/user');
// passport.use(new LocalStrategy(UserModel.authenticate()));
// passport.serializeUser(UserModel.serializeUser());
// passport.deserializeUser(UserModel.deserializeUser());

// mongoose connect
var dbConnection = mongoose.connect(env.MONGO_SERVER_URI);
var CurrentUserModel = require('./models/current_user');
CurrentUserModel.remove({}, function(err) {
  if (err) console.error(err);
  else console.log('Current users from previous session have been removed from database.');
});

// catch 404 and forward to error handler
// server.use(function(req, res, next) {
//     var err = new Error('Not Found');
//     err.status = 404;
//     next(err);
// });

// error handlers

// development error handler
// will print stacktrace
if (server.get('env') === 'development') {
    server.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
server.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

// var routes = require('./routes/index');
// var users = require('./routes/users');
// server.use('/', routes);


var helpers = {

  setCurrentUserGlobally : function(request, response, next) {

    global.currentUser = request.user;
    response.locals.currentUser = request.user;
    next();

  }

};

// require('./middlewares/passport')(passport);

// server.use(helpers.setCurrentUserGlobally);

server.get('/ping', function(req, res) {
  console.log('REQ.SESSION:', req.session, 'REQ.SESSIONID:', req.sessionID);
  res.status(200).send('Pong!');
});

var port = env.PORT;
http.listen(port, function() {
  console.log('Float server up and running on port', port + '.');
});

// _) * |\/|()()|\| //
