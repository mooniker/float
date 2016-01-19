'use strict';

(function() {

  var app = angular.module('float', [
    'btford.socket-io'
  ]);

  app.factory('mySocket', function(socketFactory) {
    var mySocket = socketFactory();
    mySocket.forward('error');
    mySocket.forward('your username');
    mySocket.forward('chat message');

    return mySocket;
  });

  app.controller('MyController', ['$scope', function($scope) {
    var my = this;
    my.username = '???';

    $scope.$on('socket:your username', function (ev, data) {
      my.username = data;
    });

  }]);

  app.controller('ChannelController', ['$scope', '$http', function($scope, $http) {
    var channel = this;
    channel.messages = [];

    $http.get('/messages').then(
      function successfulCallback(response){
        channel.messages = response.data.messages;
      }, function notSuccessfulCallback(response){
        // sad face
    });

    $scope.$on('socket:chat message', function(ev, msg) {
      channel.messages.push(msg);
      console.log('Received:', msg);
      // TODO want the message box to be scrolled to the bottom
    });

  }]);

  app.controller('MessengerController', ['$scope', 'mySocket', function($scope, socket) {
    this.message = {};
    var my = this;
    this.username = '???';
    this.othersTyping = {};
    this.othersTypingStatus = '';
    this.usersTyping = [];
    this.whenLastTyped = Date.now();
    this.timerId = null;
    this.lastSentMessage = null;
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
      when: null
    }

    this.tellServerTypingIsHappening = function(typingIsHappening) {
      // tell server typing status only if there's been a change or no activity in a while
      if (this.reportedly.typing != typingIsHappening ||
          this.reportedly.typing.when < Date.now() - 10000) {
        socket.emit(typingIsHappening ? 'typing' : 'not typing', Date.now());
        this.reportedly.typing = typingIsHappening;
        console.log('Told server typing status of user is', typingIsHappening, '.');
      }
    };

    // this.refreshEvents = function() {
    //   for (var key in this.othersTyping) {
    //     var list = [];
    //     if (this.othersTyping[key] > Date.now() - 3000) {
    //       list.push(key)
    //     }
    //     if (list.length === 0) {
    //       this.othersTypingStatus = '';
    //     } else if (list.length === 1) {
    //       this.othersTypingStatus = list[0] + ' is typing.';
    //     } else if (list.length < 6) {
    //       this.othersTypingStatus = list.slice(0, list.length - 2).join(', ') + ' and ' + list[list.length - 1] + ' is typing.';
    //     } else {
    //       this.othersTypingStatus = 'Many people are typing.';
    //     }
    //   }
    // };

    $scope.$on('socket:your username', function (ev, data) {
      my.username = data;
    });

    // socket.on('user typing', function(data) {
    //   my.othersTyping[data.username] = data.timestamp;
    //   console.log('user typing:', data);
    //   my.refreshEvents();
    // });

    // socket.on('user not typing', function(username) {
    //   if (username in my.othersTyping) {
    //     my.othersTyping[username] = 0;
    //   }
    //   console.log('user not typing:', username);
    //   my.refreshEvents();
    // });

    socket.on('event', function(event) {
      // if (event.hasOwnProperty(usersTyping)) {
      //   console.log('Server says these folk are typing:', event.usersTyping);
      // }
      console.log('Server says these users are typing:', event.usersTyping);
      my.usersTyping = event.usersTyping;

      if (my.usersTyping.length === 0) {

      }
      switch (my.usersTyping.length) {
        case 0:
          my.othersTypingStatus = '';
          break;
        case 1:
          my.othersTypingStatus = my.usersTyping[0] + ' is typing';
          break;
        case 2:
        case 3:
        case 4:
          my.othersTypingStatus = my.usersTyping.join(' and ') + ' are typing';
          break;
        default:
          my.othersTypingStatus = 'Many people are typing';
      }

      // TODO at this point, message stays the same until the server sends an
      // updated list of typing users, which doesn't happen if users just leave
      // unsent text in their messager input fields.
      // in that case, we should either have the server send a message after a
      // while saying the last known typing users haven't done anything
      // or have the client figure that out or both


    });

    // this.typing = function() {
    //   // check to see if user has typed anything
    //   if (this.message.body.trim() == '') {
    //     socket.emit('not typing', Date.now());
    //     console.log('not typing');
    //     this.whenLastTyped = Date.now();
    //   }
    //   // if we've got text and we haven't sent typing request in the past 3 seconds
    //   else if (this.message.body.trim().length > 0 && Date.now() - this.whenLastTyped > 3000) {
    //     socket.emit('typing', Date.now());
    //     this.whenLastTyped = Date.now();
    //     console.log('typing:', Date.now());
    //   }
    // };

    this.typing = function() { // check to see if user has typed something
      if (this.message.body.trim() === '' || this.message.body[0] === '/') {
        // if user has erased their message or is entering a command
        this.tellServerTypingIsHappening(false);
        // console.log('User is not typing.');
      } else {
        this.tellServerTypingIsHappening(true);
        // console.log('User is typing.');
      }
    };

    this.send = function(msg) {
      if (this.message.body[0] === '/') {
        // if (this.message.body.slice(1).split()[0]) // TODO use this to validate commands
        if (this.message.body.trim() === '/blah') {
          console.log('blah blah blah');
          socket.emit('chat message', {
            timestamp: Date.now(),
            blah: true
          });
          this.message.body = '';
          this.whenLastTyped = Date.now();
        } else if (this.message.body.trim() === '/house') {
          console.log('house');
          socket.emit('rename me', 'house');
          this.message.body = '';
          this.whenLastTyped = Date.now();
        }
      } else if (this.message.body.trim() != '') {
        socket.emit('chat message', {
          body: this.message.body,
          timestamp: Date.now()
        });
        this.message.body = '';
      } else if (this.message.body.trim() === '') {
        this.message.body = '';
        this.whenLastTyped = Date.now();
      }
      try {
        this.othersTyping[this.username] = 0;
      } catch(e) { console.log('ERROR:', e); }
      socket.emit('not typing', Date.now());
      this.refreshEvents();
    };

  }]);

  app.controller('UserIndexController', ['$http', 'mySocket', function($http, socket) {
    var userList = this;
    userList.usernames = [];

    $http.get('/users').then(
      function successfulCallback(response){
        userList.usernames = response.data.usernames;
        console.log('Current users fetched.');
      }, function notSuccessfulCallback(response){
        console.error(response);
    });

    socket.on('current users', function(currentList) {
      userList.usernames = currentList;
      console.log('Current users:', currentList);
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

  app.directive('scrollToBottom', function() {
    return { // FIXME this doesn't seem to do anything
      scope: {
        scrollToBottom: '='
      },
      link: function(scope, element) {
        scope.$watchCollection('scrollToBottom', function(newValue) {
          if (newValue) {
            $(element).scrollTop($(element)[0].scrollHeight);
          }
        });
      }
    };
  });

})();
