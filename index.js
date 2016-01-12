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

server.set('view engine', 'jade');
server.use( express.static( path.join(__dirname, 'public') ) );

server.get('/', function(request, response) {
  response.render('index');
});

var usersConnected = 0;

// io event listeners
io.on('connection', function(socket) {

  usersConnected += 1;
  console.log('A user connected, now ' + usersConnected + ' total.');

  socket.on('chat message', function(msg) {
    io.emit('chat message', msg);
    console.log('Message received:', msg);
  });

  socket.on('disconnect', function() {
    usersConnected -= 1;
    console.log('A user disconnected, now ' + usersConnected + ' total.');
  });
});

var port = env.PORT;
http.listen(port, function() {
  console.log('Float server up and running on port', port + '.');
});
