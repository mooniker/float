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
    });

  }]);

  app.controller('MessengerController', ['$scope', 'mySocket', function($scope, socket) {
    this.message = {};
    var my = this;
    this.username = '???';
    this.othersTyping = {};
    this.othersTypingStatus = '';
    this.whenLastTyped = Date.now();
    this.timerId = null;
    this.lastSentMessage = null;

    this.refreshEvents = function() {
      for (var key in this.othersTyping) {
        var list = [];
        if (this.othersTyping[key] > Date.now() - 3000) {
          list.push(key)
        }
        if (list.length === 0) {
          this.othersTypingStatus = '';
        } else if (list.length === 1) {
          this.othersTypingStatus = list[0] + ' is typing.';
        } else if (list.length < 6) {
          this.othersTypingStatus = list.slice(0, list.length - 2).join(', ') + ' and ' + list[list.length - 1] + ' is typing.';
        } else {
          this.othersTypingStatus = 'Many people are typing.';
        }
      }
    };

    $scope.$on('socket:your username', function (ev, data) {
      my.username = data;
    });

    socket.on('user typing', function(data) {
      my.othersTyping[data.username] = data.timestamp;
      console.log('user typing:', data);
      my.refreshEvents();
    });

    socket.on('user not typing', function(username) {
      if (username in my.othersTyping) {
        my.othersTyping[username] = 0;
      }
      console.log('user not typing:', username);
      my.refreshEvents();
    });

    this.typing = function() {
      // check to see if user has typed anything
      if (this.message.body.trim() == '') {
        socket.emit('not typing', Date.now());
        console.log('not typing');
        this.whenLastTyped = Date.now();
      }
      // if we've got text and we haven't sent typing request in the past 3 seconds
      else if (this.message.body.trim().length > 0 && Date.now() - this.whenLastTyped > 3000) {
        socket.emit('typing', Date.now());
        this.whenLastTyped = Date.now();
        console.log('typing:', Date.now());
      }
    };

    this.send = function(msg) {
      if (this.message.body[0] === '/') {
        if (this.message.body.trim() === '/blah') {
          console.log('blah blah blah');
          socket.emit('chat message', {
            timestamp: Date.now(),
            blah: true
          });
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

    $http.get('http://localhost:4001/users').then(
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
    return {
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

$.scrolline({
    reverse : true,
    position : 'left',
    backColor : '#2980b9',
    frontColor : '#f1c40f',
    weight : 24
});
