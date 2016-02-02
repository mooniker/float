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
// var UserModel = require('./models/user');
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

  }

};

require('./middlewares/passport')(passport);

server.use(helpers.setCurrentUserGlobally);

var usersCtrl = require('./controllers/users');
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
// var CurrentUserModel = require('./models/current_user');

var usersConnected = 0;
var logbook = {};

var usersCurrentlyTypingLogbook = {
  // e.g.
  // socket.client.id: Date,
  // socket.client.id: Date,
  // etc
};

var eventRefresher;

function announceUsersTyping() {
  var usernames = [];
  for (var clientId in logbook) {
    if (usersCurrentlyTypingLogbook[clientId] > Date.now() - 7000) {
      usernames.push(logbook[clientId]);
    } else if (usersCurrentlyTypingLogbook[clientId] < Date.now - 10000) {
      delete usersCurrentlyTypingLogbook[clientId];
    }
  }
  var newEvent = {
    usersTyping: usernames
  };
  io.emit('event', newEvent);

  clearTimeout(eventRefresher); // clear the event announcer timer
  // announce events again in 4 seconds if needed
  if (Object.keys(usersCurrentlyTypingLogbook).length > 0)
    eventRefresher = setTimeout(announceUsersTyping, 4000);
}

function getCurrentUsernames() {
  var usernames = [];
  for (var key in logbook) {
    usernames.push(logbook[key]);
  }
  return usernames;
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

function totalUsersMsg(number) {
  return number + ' user(s) online now.';
}

function yourUsername(socketId, clientId) {

  // FIXME below code is a hack
  io.sockets.connected[socketId].emit('your username', logbook[clientId]);
  setTimeout(function() {
    try {
      io.sockets.connected[socketId].emit('your username', logbook[clientId]);
    } catch( error ) {
      setTimeout(function() {
        try {
          io.sockets.connected[socketId].emit('your username', logbook[clientId]);
        } catch (err) {
          // give up
        }
      }, 4000);
    }
  }, 2000);
}

// io event listeners
io.on('connection', function(socket) {

  var socketId = socket.id;

  if (!logbook.hasOwnProperty(socket.client.id)) {
    logbook[socket.client.id] = chance.capitalize(chance.word());
  }
  if (!(socket.client.id in usersCurrentlyTypingLogbook)) {
    usersCurrentlyTypingLogbook[socket.client.id] = 0;
  }

  // send that user her username
  yourUsername(socket.id, socket.client.id);

  usersConnected += 1;
  var msg = 'A user named ' + logbook[socket.client.id] + ' connected. ' + totalUsersMsg(usersConnected);
  // console.log(msg);
  // io.emit('debug message', msg);

  // announce new user to everyone
  io.emit('current users', getCurrentUsernames());

  function processMessage(msg) {
    var newMessage = {
      username: 'username' in msg ? msg.username : logbook[socket.client.id],
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

  socket.on('chat message', function(msg) {

    processMessage(msg);

  });

  socket.on('typing', function(time) {
    usersCurrentlyTypingLogbook[socket.client.id] = time;
    announceUsersTyping();

  });

  socket.on('not typing', function(time) {
    usersCurrentlyTypingLogbook[socket.client.id] = 0;
    delete usersCurrentlyTypingLogbook[socket.client.id];
    announceUsersTyping();
  });

  socket.on('request', function(req) {
    try { // FIXME is this try block needed?
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
          if (socket.client.id in logbook) {
            var oldName = logbook[socket.client.id];
            if (oldName.slice(0, 9) === 'House of ') {
              io.sockets.connected[socket.id].emit('chat message', {
                username: '*system*',
                body: 'Greetings to the ' + oldName + '.'
              });
            } else {
              logbook[socket.client.id] = 'House of ' + logbook[socket.client.id];
              yourUsername(socket.id, socket.client.id);
              processMessage({
                username: '*system*',
                body: oldName + ' is now called ' + logbook[socket.client.id] + '.',
                sent_at: Date.now(),
              });
            }
          }
          break;
        case 'nick':
        case 'callme':
          if (socket.client.id in logbook) {
            // first let's validate the requested name
            for (var key in logbook) {
              if (logbook[key] === req.args.join('_').trim()) {
                io.sockets.connected[socket.id].emit('chat message', {
                  username: '*system*',
                  body: req.args.join('_').trim() + ' is already the name of an existing user.',
                  timestamp: Date.now()
                });
                console.log('User\'s request for rename to existing username denied.');
                return; // hope this breaks out of this case ant not just for loop
              }
            }
            var oldName = logbook[socket.client.id];
            logbook[socket.client.id] = req.args.join('_'); // get rid of spaces FIXME need to regulate screenames in a better way
            console.log(oldName, 'has been renamed to', logbook[socket.client.id]);
            yourUsername(socket.id, socket.client.id);
            processMessage({
              username: '*system*',
              body: oldName + ' is now called ' + logbook[socket.client.id] + '.',
              sent_at: Date.now(),
            });
            // announce new user to everyone
            io.emit('current users', getCurrentUsernames());

          }
          break;
      }
    } catch(e) { console.log('Not a command.', e); }
  });

  socket.on('disconnect', function() {
    usersConnected -= 1;

    if (socket.client.id in usersCurrentlyTypingLogbook) {
      try {
      delete usersCurrentlyTypingLogbook[socket.client.id];
      } catch(err) { console.error(err); }
    }

    var msg = logbook[socket.client.id] + ' disconnected. ' + totalUsersMsg(usersConnected);

    delete logbook[socket.client.id];
  });
});

var port = env.PORT;
http.listen(port, function() {
  console.log('Float server up and running on port', port + '.');
});

// _) * |\/|()()|\| //
