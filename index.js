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
var io = require('socket.io')(http);
var path = require('path');

var expressSession = require('express-session');
var favicon = require('serve-favicon');
var flash = require('connect-flash');
var logger = require('morgan'); // HTTP request logger middleware
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

// path to public
var wwwPublic = path.join(__dirname, 'public');

// set view engine
server.set('view engine', 'jade');
server.use( express.static( wwwPublic ) );

server.use(favicon(path.join(wwwPublic, 'favicon.ico'))); // FIXME browser cache issue?
server.use(logger('dev'));
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: false }));
server.use(cookieParser());
server.use(expressSession({
    secret: 'bimilbimilbimil',
    resave: false, // what do these do?
    saveUninitialized: false // what do these do?
}));
server.use(passport.initialize());
server.use(passport.session());
server.use(flash());

// passport config
var UserModel = require('./models/user');
// passport.use(new LocalStrategy(UserModel.authenticate()));
// passport.serializeUser(UserModel.serializeUser());
// passport.deserializeUser(UserModel.deserializeUser());

// mongoose connect
// local dev = float_restarter
var dbConnection = mongoose.connect(env.MONGO_SERVER_URI);

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

  },

  authenticatedUser: function(request, response, next) {

    if ( request.isAuthenticated() ) {
      return next();
    } else {
      // response.redirect('/login');
      console.log('unauthenticated user directed to welcome page');
      // response.render('welcome');
      response.redirect('/');
    }

  },

  authenticatedUserFetch: function(request, response, next) {

    if ( request.isAuthenticated() ) {
      console.log('unauthenticated fetch');
      return next();
    } else {
      console.log('unauthenticated fetch');
      response.render('401', { status : 401 } );
    }
  }

};

require('./middlewares/passport')(passport);

server.use(helpers.setCurrentUserGlobally);

var usersCtrl = require('./controllers/users');

server.get('/ping', function(req, res){
    res.status(200).send('Pong!');
});

server.route('/home')
  .get(helpers.authenticatedUser, function(request, response) {
    response.render('home', { message : request.flash('homeMessage') });
    logBroadcast('homepage!');
  });

server.route('/profile')
  .get(helpers.authenticatedUser, usersCtrl.getProfile)
  .post(helpers.authenticatedUser, usersCtrl.postProfile);

server.route('/')
  .get(function(request, response) {
    response.render('welcome', { message : request.flash('homeMessage') });
  });

server.route('/signup')
  .get(usersCtrl.getSignup)
  .post(usersCtrl.postSignup);

server.route('/login')
  .get(usersCtrl.getLogin)
  .post(usersCtrl.postLogin);

server.route('/logout')
  .get(helpers.authenticatedUser, usersCtrl.getLogout);

function logBroadcast(msg) {
  console.log(msg);
  io.emit('debug message', '* server log: ' + msg);
}

var MessageModel = require('./models/message');

var usersConnected = 0;

function totalUsersMsg(number) {
  return number + ' user(s) online now.';
}

// io event listeners
io.on('connection', function(socket) {

  usersConnected += 1;
  var msg = 'A user connected. ' + totalUsersMsg(usersConnected);
  // console.log(msg);
  // io.emit('debug message', msg);

  // TODO figure out how to not accept websocket connections from unauth'd users

  logBroadcast(msg);

  socket.on('chat message', function(msg) {

    var newMessage = {
      user_id: currentUser._id,
      body: msg.body,
      sent_at: msg.timestamp,
    };

    new MessageModel(newMessage).save(function(msgSaveError) {
      if (msgSaveError) {
        console.error('msgSaveError:', msgSaveError);
        logBroadcast('msgSaveError');
        // TODO send error message back to sender
      } else {
        // broadcast message after saving to database
        // delete newMessage.user_id;
        console.log(newMessage);
        newMessage.username = currentUser.username;
        newMessage.timestamp = Date.now();
        logBroadcast('Server received and saved', newMessage);
        io.emit('chat message', newMessage);
      }
    });

  });

  socket.on('disconnect', function() {
    usersConnected -= 1;
    var msg = 'A user disconnected. ' + totalUsersMsg(usersConnected);
    // console.log(msg);
    // io.emit('debug message', msg);
    logBroadcast(msg);
  });
});

var port = env.PORT;
http.listen(port, function() {
  console.log('Float server up and running on port', port + '.');
});

// _) * |\/|()()|\| //
