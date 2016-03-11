'use strict';

(function() {

  var app = angular.module('float', [
    'btford.socket-io'
  ]);

  app.factory('mySocket', function(socketFactory) {
    var mySocket = socketFactory();
    // mySocket.forward('error');
    mySocket.forward('your username');
    // mySocket.forward('chat message');
    return mySocket;
  });

  app.directive('scrollBottom', ['$timeout', function ($timeout) {
    return {
      scope: {
        scrollBottom: '='
      },
      link: function ($scope, $element) {
        $scope.$watchCollection('scrollBottom', function(newValue) {
          if (newValue) {
            $timeout(function() {
              $element.scrollTop($element[0].scrollHeight);
            }, 0);
          }
        });
      }
    };
  }]);

  app.controller('ConnectionController', ['$scope', 'mySocket', function($scope, socket) {

    var connection = this;
    this.connected = false;
    var notConnectedMessage = 'not connected!';
    this.statusString = 'Getting our bearings. Let us connect to the messaging network.';
    this.reconnectAttempts = null;
    $scope.placeholderInput = notConnectedMessage;

    socket.on('connect', function() {
      console.log('socket event: connect (Fired upon a successful connection)');
      connection.connected = true;
      $scope.placeholderInput = 'send the people a message';
      this.reconnectAttempts = 0;
      if ( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
       console.log('User agent is mobile');
       $scope.mobile = true;
     } else {
       console.log('User agent isnt mobile');
       $scope.mobile = false;
     }
    });

    socket.on('disconnect', function() {
      console.log('socket event: disconnect');
      connection.connected = false;
      $scope.placeholderInput = notConnectedMessage;
    });

    socket.on('connect_error', function(err) {
      console.log('socket event: connect_error (Fired upon a connection error) error:', err);
    });

    socket.on('connect_timeout', function() {
      console.log('socket event: connect_timeout (Fired upon a connection timeout)');
    });

    socket.on('reconnect', function(num) {
      console.log('socket event: reconnect (Fired upon a successful reconnection). reconnection attempt number:', num);
    });

    socket.on('reconnect_attempt', function() {
      console.log('socket event: reconnect_attempt (Fired upon an attempt to reconnect)');
    });

    socket.on('reconnecting', function(reconnectionAttemptNumber) {
      console.log('socket event: reconnecting (Fired upon an attempt to reconnect) reconnection attempt number:', reconnectionAttemptNumber);
      this.reconnectAttempts = reconnectionAttemptNumber;
    });

    socket.on('reconnect_error', function(err) {
      console.log('socket event: reconnect_error (Fired upon a reconnection attempt error) error:', err);
    });

    socket.on('reconnect_failed', function() {
      console.log('socket event: reconnect_failed (Fired when couldn’t reconnect within reconnectionAttempts)');
    });

  }]);

  // UserController handles stuff user stuff pertaining to this user
  app.controller('UserController', ['$scope', function(scope) {
    var my = this;
    my.username = '???';

    scope.$on('socket:your username', function (ev, data) {
      my.username = data;
    });

  }]);

  app.controller('ChannelController', ['$scope', '$http', 'mySocket', function(scope, http, socket) {
    var channel = this;
    channel.messages = [];

    // $scope.$watchCollection('channel.messages', function(newVal, oldVal) {
    //   console.log('WATCHCOLLECTION:', newVal);
    // });

    // Get recent message from server // FIXME don't need this anymore
    // http.get('/messages').then(
    //   function successfulCallback(response){
    //     channel.messages = response.data.messages;
    //   }, function notSuccessfulCallback(response){
    //     // sad face
    // });

    socket.on('connect', function() {
      channel.messages = []; // reset messages
      // TODO instead we should just add in messages that aren't already in there
    });

    // Receive chat messages from server
    socket.on('chat message', function(msg) {
      channel.messages.push(msg);
      console.log('Received:', msg);
      // TODO don't add in messages that are already in there
    });

    channel.message = {}; // ng-model for message user inputs
    channel.username = '???'; // user's username to be assigned by server
    channel.othersTypingStatus = '';
    channel.usersTyping = [];
    channel.lastSentMessageBody = null;
    channel.lastSentMessageTimestamp = null;
    channel.reportedly = { // the last typing message sent to server
      typing: false,
      when: Date.now()
    };

    this.tellServerTypingIsHappening = function(typingIsHappening) {
      // tell server typing status only if there's been a change or no activity in a while
      if (channel.reportedly.typing != typingIsHappening ||
          channel.reportedly.when < Date.now() - 7000) {
        socket.emit(typingIsHappening ? 'typing' : 'not typing', Date.now());
        channel.reportedly.typing = typingIsHappening;
        channel.reportedly.when = Date.now();
        console.log('Told server typing status of user is', typingIsHappening, '.');
      }
    };

    socket.on('your username', function (data) {
      channel.username = data;
    });

    socket.on('event', function(event) {

      channel.usersTyping = event.usersTyping;
      console.log('Server says these users are typing:', channel.usersTyping);

      switch (channel.usersTyping.length) {
        case 0:
          channel.othersTypingStatus = '';
          break;
        case 1:
          channel.othersTypingStatus = channel.usersTyping[0] + ' is typing';
          break;
        case 2:
        case 3:
        case 4:
          channel.othersTypingStatus = channel.usersTyping.join(' and ') + ' are typing';
          break;
        default:
          channel.othersTypingStatus = 'Many people (and someone\'s mother) are typing';
      }

    });

    this.typing = function() { // check to see if user has typed something
      // FIXME maybe have '/' commands be completely ignored instead of  triggering tellServer
      if (channel.message.body.trim() === '' || channel.message.body[0] === '/') {
        // if user has erased their message or is entering a command
        channel.tellServerTypingIsHappening(false);
        // console.log('User is not typing.');
      } else {
        channel.tellServerTypingIsHappening(true);
        // console.log('User is typing.');
      }
    };

    this.command = function(command, args) {
      var cmd = command.toLowerCase();
      switch (cmd) { // whitelist some commands to be sent to server
        // TODO maybe filter these or preprocess them to help server out
        case 'help':
        case 'whoami':
        case 'blah':
        case 'house':
        case 'callme':
        case 'nick':
        case 'join':
          console.log('Sent request to server:', cmd, args);
          socket.emit('request', {
            cmd: cmd,
            args: args,
            timestamp: Date.now()
          });
          break;
        default:
          // TODO some error message to user: invalid command
          console.log('Invalid command:', cmd);
      }
    };

    this.clearInput = function() {
      channel.message.body = '';
    };

    this.send = function() {
      socket.emit('chat message', {
        body: channel.message.body,
        timestamp: Date.now()
      });
      channel.lastSentMessageBody = channel.message.body;
      channel.lastSentMessageTimestamp = Date.now();
      channel.clearInput();
    };

    this.getInput = function() {
      if (channel.message.body[0] === '/') {
        // if input starts with '/', chop it up and send to server as command
        var input = channel.message.body.slice(1).split(' ');
        var cmd = input[0];
        var args = input.slice(1, input.length);
        channel.command(cmd, args);
        channel.clearInput();
      } else if (channel.message.body.trim() != '') { // send message
        channel.send();
      }
      // else if (channel.message.body.trim() === '') { // clears and does not send empty text
      //   channel.clearInput();
      // }
      channel.tellServerTypingIsHappening(false);
    };

  }]);

  // UserIndexController handles the buddle list
  app.controller('UserIndexController', ['$http', 'mySocket', function(http, socket) {
    var userList = this;
    userList.usernames = [];

    // http.get('/users').then(
    //   function successfulCallback(response){
    //     userList.usernames = response.data.usernames;
    //     console.log('Current users fetched.');
    //   }, function notSuccessfulCallback(response){
    //     console.error(response);
    // });

    socket.on('current users', function(currentList) {
      userList.usernames = currentList;
      console.log('Current users:', userList.usernames);
    });

  }]);


  app.directive('chatMessage', function() {
    return {
      restrict: 'A',
      templateUrl: 'message.html'
    };
  });

  app.directive('username', function() {
    return {
      restrict: 'A',
      templateUrl: 'username.html'
    };
  });

})();
