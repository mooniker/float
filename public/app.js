'use strict';

(function() {

  var app = angular.module('float', [
    // 'ngWebSocket'
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
        // console.log('GOT THE MESSAGES:', channel.messages);
      }, function notSuccessfulCallback(response){
        // console.log('DID NOT GET THE MESSGAGES.', response);
    });

    $scope.$on('socket:chat message', function(ev, msg) {
      channel.messages.push(msg);
      console.log('Received:', msg);
    });

    $scope.$on('socket:your username', function (ev, data) {
      console.log(data);
    });

  }]);

  app.controller('MessengerController', ['$scope', 'mySocket', function($scope, socket) {
    this.message = {};
    var my = this;
    my.username = '???';

    $scope.$on('socket:your username', function (ev, data) {
      my.username = data;
    });

    this.send = function(msg) {
      if (this.message.body[0] === '/') {
        if (this.message.body.trim() === '/blah') {
          console.log('blah blah blah');
          socket.emit('chat message', {
            timestamp: Date.now(),
            blah: 5
          });
          this.message.body = '';
        }
      } else
      if (this.message.body.trim() != '') {
        socket.emit('chat message', {
          body: this.message.body,
          timestamp: Date.now()
        });
        this.message.body = '';
      } else if (this.message.body.trim() === '') {
        this.message.body = '';
      }
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
      console.log('Received:', currentList);
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
