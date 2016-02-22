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

    // Receie chat messages from server
    socket.on('chat message', function(msg) {
      channel.messages.push(msg);
      console.log('Received:', msg);
      // TODO want message box to be auto scrolled to bottom.
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
      switch (cmd) {
        case 'help':
          // console.log('User asked for help.');
          // break;
        case 'blah':
          // console.log('Blah blah blah to server.');
          // break;
        case 'house':
          // console.log('Rename as House of Me');
        case 'callme':
        case 'nick':
          console.log('sent request to server:', cmd, args)
          socket.emit('request', {
            cmd: cmd,
            args: args,
            timestamp: Date.now()
          });
          break;
        default:
          // TODO some error message to user: invalid command
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
