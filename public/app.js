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

    // Get recent message from server
    http.get('/messages').then(
      function successfulCallback(response){
        channel.messages = response.data.messages;
      }, function notSuccessfulCallback(response){
        // sad face
    });

    // scope.$on('socket:chat message', function(ev, msg) {
    //   channel.messages.push(msg);
    //   console.log('Received:', msg);
    //   // TODO want the message box to be scrolled to the bottom
    // });

    socket.on('chat message', function(msg) {
      channel.messages.push(msg);
      console.log('Received:', msg);
      // TODO want message box to be auto scrolled to bottom.
    });

    this.message = {};
    // var my = this;
    this.username = '???';
    this.othersTyping = {};
    this.othersTypingStatus = '';
    this.usersTyping = [];
    this.whenLastTyped = Date.now();
    this.timerId = null;
    this.lastSentMessageBody = null;
    this.lastSentMessageTimestamp = null;
    this.whenLast = {
      typing: null, // timestamp
      notTyping: null, // timestamp
      chatMessage: {
        body: null,
        timestamp: null,
        roger: false // boolean
      }
    };
    this.reportedly = { // the last typing message sent to server
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

      // TODO at this point, message stays the same until the server sends an
      // updated list of typing users, which doesn't happen if users just leave
      // unsent text in their messager input fields.
      // in that case, we should either have the server send a message after a
      // while saying the last known typing users haven't done anything
      // or have the client figure that out or both

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
          socket.emit('request', {
            cmd: cmd,
            args: args
          });
      }
    };

    this.send = function(msg) {
      if (channel.message.body[0] === '/') {
        // if (this.message.body.slice(1).split()[0])
        // if (this.message.body.trim() === '/blah') {
        //   console.log('blah blah blah');
        //   socket.emit('chat message', {
        //     timestamp: Date.now(),
        //     blah: true
        //   });
        //   this.message.body = '';
        //   this.whenLastTyped = Date.now();
        // } else if (this.message.body.trim() === '/house') {
        //   console.log('house');
        //   socket.emit('rename me', 'house');
        //   this.message.body = '';
        //   this.whenLastTyped = Date.now();
        // }
        var input = channel.message.body.slice(1).split(' ');
        var cmd = input[0];
        var args = input.slice(1, input.length);
        channel.command(cmd, args);
        channel.message.body = '';
      } else if (channel.message.body.trim() != '') { // send message
        socket.emit('chat message', {
          body: channel.message.body,
          timestamp: Date.now()
        });
        channel.lastSentMessageBody = channel.message.body;
        channel.lastSentMessageTimestamp = Date.now();
        channel.message.body = '';
      } else if (channel.message.body.trim() === '') { // clears and does not send empty text
        channel.message.body = '';
        // this.whenLastTyped = Date.now();
      }
      // try {
      //   this.othersTyping[this.username] = 0;
      // } catch(e) { console.log('ERROR:', e); }
      // socket.emit('not typing', Date.now());
      channel.tellServerTypingIsHappening(false);
    };

  }]);

  // UserIndexController handles the buddle list
  app.controller('UserIndexController', ['$http', 'mySocket', function(http, socket) {
    var userList = this;
    userList.usernames = [];

    http.get('/users').then(
      function successfulCallback(response){
        userList.usernames = response.data.usernames;
        console.log('Current users fetched.');
      }, function notSuccessfulCallback(response){
        console.error(response);
    });

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

  // app.directive('scrollToBottom', function() {
  //   return { // FIXME this doesn't seem to do anything
  //     scope: {
  //       scrollToBottom: '=' // = is obj or array
  //     },
  //     link: function($scope, $element) {
  //       $scope.$watchCollection('scrollToBottom', function(newValue) {
  //         if (newValue) {
  //           $element.scrollTop($element[0].scrollHeight);
  //         }
  //       });
  //     }
  //   };
  // });

  app.directive('ngScrollBottom', ['$timeout', function ($timeout) {
    return {
      scope: {
        ngScrollBottom: "="
      },
      link: function ($scope, $element) {
        $scope.$watchCollection('channel.messages', function (newValue) {
          if (newValue) {
            $timeout(function(){
              $element.scrollTop($element[0].scrollHeight);
            }, 0);
          }
        });
      }
    };
  }]);


})();
