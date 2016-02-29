
var http = require('./index'); // get the HTTP server provisioned in index.js
var io = require('socket.io')(http);

var Chance = require('chance');
var chance = Chance(); // used for random name generation

var MessageModel = require('./models/message');
var CurrentUserModel = require('./models/current_user');

var eventRefresher; // timer used to time checks and announcements of users currently typing

function announceUsersTyping() {
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
        eventRefresher = setTimeout(announceUsersTyping, 3000);
      }
    }
  });
}

function announceCurrentUsers(usernameToAdd, usernameToRemove) {

  // FIXME usernameToAdd, usernameToRemove may not be needed anymore

  CurrentUserModel.find({}, function(error, users) {
    if (error) console.error(error);
    else {
      console.log('CURRENT USERES:', users);
      var currentUsers = [];
      for (var u = 0; u < users.length; u++) {
        currentUsers.push(users[u].username);
      }
      io.emit('current users', currentUsers);
    }
  });
}


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

  sysMessageToUser('Welcome. You\'re now on board with Float.');
  announceCurrentUsers();
  announceUsersTyping();

  var yesterday = Date.now() - 86400000;

  MessageModel.find({ timestamp: { $gte: yesterday } }, function(messagesFindError, messages) {

    if (messagesFindError) {
      console.error(messagesFindError);
      sysMessageToUser('Error: failed to retrieve recent messages');
    } else {
      for (var i = 0; i < messages.length; i++) {
        io.sockets.connected[socket.id].emit('chat message', messages[i]);
      }
    }
  });

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

module.exports = io;
