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

var Chance = require('chance');
var chance = Chance();

var expressSession = require('express-session');
var favicon = require('serve-favicon');
var flash = require('connect-flash');
var logger = require('morgan'); // HTTP request logger middleware
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
// var passport = require('passport');
// var LocalStrategy = require('passport-local').Strategy;

// path to public
var path_to_public = path.join(__dirname, 'public');

// set view engine
server.set('view engine', 'jade');
server.use(express.static(path_to_public));

server.use(favicon(path.join(path_to_public, 'favicon.ico')));
server.use(logger('dev'));
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: false }));
server.use(cookieParser());
server.use(expressSession({
    secret: 'bimilbimilbimil',
    resave: false, // what do these do?
    saveUninitialized: false // what do these do?
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

// var usersCtrl = require('./controllers/users');
var messagesCtrl = require('./controllers/messages');

server.get('/ping', function(req, res){
    res.status(200).send('Pong!');
});

server.route('/vanilla')
  .get(function(request, response) {
    response.render('public');
  });

server.route('/messages')
  .get(messagesCtrl.getMessages) // FIXME require auth
  .post(messagesCtrl.postMessage); // FIXME testing angular

var MessageModel = require('./models/message');
var CurrentUserModel = require('./models/current_user');

var eventRefresher;

function announceUsersTyping() {
  // var usernames = [];
  console.log('announceUsersTyping');
  CurrentUserModel.find({
    currentlyTyping: true,
    whenLastTyped: { $gt: Date.now() - 6000 }
  }, 'username', function(error, users) {
    if (error) console.error(error);
    else { // now we have the current users who've typed in the past 7 seconds
      var newEvent = {
        usersTyping: users.map(function(user) { return user.username })
      };
      io.emit('event', newEvent);

      clearTimeout(eventRefresher); // clear the event announcer timer
      if (users.length > 0) {
        console.log('setTimeout usersTyping in 3 seconds');
        eventRefresher = setTimeout(announceUsersTyping, 3000);
      }
    }
  });
}

var onlineUsers = [];

function announceCurrentUsers(usernameToAdd, usernameToRemove) {

  if (usernameToAdd) onlineUsers.push(usernameToAdd);
  if (usernameToRemove) onlineUsers.splice(onlineUsers.indexOf(usernameToRemove), 1);

  io.emit('current users', onlineUsers);
}

server.route('/users').get(function(request, response) {
  response.json({
    usernames: getCurrentUsernames()
  });
});

server.route('/username/:id').get(function(request, response) {

  response.json({
    username: logbook[request.params.id]
  });

});

// io event listeners
io.on('connection', function(socket) {

  var username;
  var thisUserModel = CurrentUserModel.findOne({ socketId: socket.id });

  CurrentUserModel.findOne({socketId: socket.id}, function(error, user) {
    if (user) { // user is weirdly already in the system
      console.error(user, 'already in the system.');
      // TODO in the future tie users to session/cookie
    } else {
      username = chance.capitalize(chance.word());
      var newUser = new CurrentUserModel({
        username: username,
        socketId: socket.id,
        socketClientId: socket.client.id,
        userAgent: socket.handshake.headers['user-agent']
      });
      newUser.save(function(err) {
        if (err) console.error(err);
        else {
          console.log(username, '(' + socket.id + ') has logged in.');
          // send that user her username
          io.sockets.connected[socket.id].emit('your username', username);
          announceCurrentUsers(username);
        }
      });
    }
  });

  function sysMessageToUser(msgBody) {
    io.sockets.connected[socket.id].emit('chat message', {
      username: '*system*',
      body: msgBody,
      timestamp: Date.now()
    });
  }

  function processMessage(msg) {

    var newMessage = {
      username: 'username' in msg ? msg.username : username,
      body: 'blah' in msg ? chance.sentence() : msg.body,
      sent_at: msg.timestamp
    };

    new MessageModel(newMessage).save(function(msgSaveError) {
      if (msgSaveError) {
        console.error('msgSaveError:', msgSaveError);
        io.sockets.connected[socket.id].emit('Failed to send your message: ' + newMessage.body);
      } else {
        newMessage.timestamp = Date.now();
        io.emit('chat message', newMessage);
      }
    });
  }

  function rename(newName) {
    // first let's validate the requested name
    var currentUsernames = onlineUsers.map(function(name) { return name.toLowerCase(); });
    // quick local search
    if (currentUsernames.indexOf(newName.toLowerCase()) > -1) {
      sysMessageToUser(newName + ' is already the name of an existing user.');
      console.log('User\'s request for rename to existing username denied.');
    } else {
      // database search
      CurrentUserModel.findOne({ username: newName }, function(error, user) {
        if (error) console.error(error);
        else if (user) {
          sysMessageToUser(newName + ' is already the name of an existing user.');
          console.log('User\'s request for rename to existing username denied.');
        } else { // no matches, so the name is fair game
          var oldName = username;
          CurrentUserModel.findOne({ username: oldName}, function(error, user) {
            if (error) console.error(error);
            else {
              user.username = newName;
              user.save(function(err) {
                if (err) console.error(err);
                else {
                  username = newName;
                  console.log(oldName, 'has been renamed to', username);
                  io.sockets.connected[socket.id].emit('your username', username);
                  processMessage({
                    username: '*system*',
                    body: oldName + ' is now called ' + username + '.',
                    sent_at: Date.now(),
                  });
                  // announce new user to everyone
                  announceCurrentUsers(username, oldName);
                }
              });
            }
          });
        }
      });
    }//else
  }

  socket.on('chat message', function(msg) {
    processMessage(msg);
  });

  socket.on('typing', function(time) {
    CurrentUserModel.findOne({ socketId: socket.id}, function(error, user) {
      user.whenLastTyped = time;
      user.currentlyTyping = true;
      user.save(function(err) {
        if (err) console.error(err);
        else announceUsersTyping();
      });
    });
  });

  socket.on('not typing', function(time) {
    CurrentUserModel.findOne({ socketId: socket.id}, function(error, user) {
      user.currentlyTyping = false;
      user.save(function(err) {
        if (err) console.error(err);
        else announceUsersTyping();
      });
    });
  });

  socket.on('request', function(req) {
    switch (req.cmd) {
      case 'help':
        // io.sockets.connected[socket.id].emit('chat message', {
        io.sockets.connected[socket.id].emit('chat message', {
          username: '*system*',
          body: 'Available commands:' +
                '"/help" for HELP ' +
                '"/blah" to produce random text',
          timestamp: Date.now()
        });
        break;
      case 'blah':
        processMessage({
          blah: true,
          timestamp: req.timestamp,
        });
        break;
      case 'house':
        if (username.slice(0, 9) === 'House of ') {
          processMessage({
            username: '*system*',
            body: 'Greetings to the ' + oldName + '.'
          });
        } else {
          rename('House of ' + username);
        }
        break;
      case 'nick':
      case 'callme':
        rename(req.args.join('_').trim());
        break;
      }
  });

  socket.on('disconnect', function() {
    CurrentUserModel.remove({ socketId: socket.id }, function(error) {
      if (error) console.error(error);
      else {
        console.log(username, 'has logged off.');
        announceCurrentUsers(null, username);
      }
    });
  });
});

var port = env.PORT;
http.listen(port, function() {
  console.log('Float server up and running on port', port + '.');
});

// _) * |\/|()()|\| //
