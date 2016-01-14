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
    return mySocket;
  });

  app.controller('MyController', ['$scope', '$http', 'mySocket', function($scope, $http, socket) {
    var my = this;
    my.username = '???';


    $scope.$on('socket:your username', function (ev, data) {
      my.username = data;
    });

  }]);

  app.controller('ChannelController', ['$scope', '$http', 'mySocket', function($scope, $http, socket) {
    var channel = this;
    channel.messages = [];

    $http.get('http://localhost:4001/messages').then(
      function successfulCallback(response){
        channel.messages = response.data.messages;
        // console.log('GOT THE MESSAGES:', channel.messages);
      }, function notSuccessfulCallback(response){
        // console.log('DID NOT GET THE MESSGAGES.', response);
    });

    socket.on('connect', function(socket) {
      console.log('Connection established.');
    });

    socket.on('chat message', function(msg) {
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

      // if (this.message.body[0] = '/') {
      //   // TODO messenger commands /join, /me, /callme
      // } else
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
    }
  });

})();
