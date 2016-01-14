'use strict';

(function(){

  var app = angular.module('float', [
    // 'ngWebSocket'
    'btford.socket-io'
  ]);

  app.factory('mySocket', function(socketFactory) {
    var mySocket = socketFactory();
    mySocket.forward('error');
    mySocket.forward('')
    return mySocket;
  });

  // app.controller('MyCtrl', function(mySocket) {
  //   $scope.$on('socket:error', function(ev, data) {
  //     //
  //     alert('socket error');
  //   });
  // });

  // console.log('Angular app initialized.');



  //
  // app.factory('MyData', function($websocket) {
  //   // Open a WebSocket connection
  //   var dataStream = $websocket('ws://localhost:4001');
  //
  //   var collection = [];
  //
  //   dataStream.onError(function(err) {
  //     console.log('websocket error:', err);
  //   });
  //
  //   dataStream.onMessage(function(message) {
  //     collection.push(JSON.parse(message.data));
  //   });
  //
  //   var methods = {
  //     collection: collection,
  //     get: function() {
  //       dataStream.send(JSON.stringify({ action: 'get' }));
  //     }
  //   };
  //
  //   console.log('websocketFactory init');
  //   return methods;
  // });
  //
  // app.controller('SomeController', function($scope, MyData) {
  //   $scope.MyData = MyData;
  //   console.log($scope.MyData);
  // });

  // app.controller('ChannelController', ['$http', function($http){
  //   var channel = this;
  //   channel.messages = [];
  //   $http.get('http://localhost:4001/messages').then(
  //     function successfulCallback(response){
  //       channel.messages = response.data.messages;
  //       // console.log('GOT THE MESSAGES:', channel.messages);
  //     }, function notSuccessfulCallback(response){
  //       // console.log('DID NOT GET THE MESSGAGES.', response);
  //   });
  // }]);

  app.controller('ChannelController', ['$http', 'mySocket', function($http, socket) {
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
  }]);

  // app.controller('MessengerController', ['$http', function($http){
  //   this.message = {};
  //
  //   this.send = function(msg) {
  //     // alert('Message: ' + this.message.body);
  //     console.log('send evoked!');
  //     if (this.message.body.trim() != '') {
  //       $http({
  //         method: 'POST',
  //         url: '/messages',
  //         header: {
  //           'Content-Type': 'application/json'
  //         },
  //         data: {
  //           body: this.message.body,
  //           timestamp: Date.now()
  //         }
  //       }).then( // FIXME this works but the success callback isn't evoked
  //         function successfulCallback(response){
  //           this.message.body = '';
  //           console.log('message sent');
  //         }, function unsuccessfulCallback(response){
  //           console.log('message NOT sent');
  //           alert(':( no win.')
  //         }
  //       );
  //     } else if (this.message.body.trim() === '') {
  //       this.message.body = '';
  //     }
  //
  //   };
  // }]);

  app.controller('MessengerController', ['mySocket', function(socket) {
    this.message = {};

    this.send = function(msg) {

      console.log('send evoked!');

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


  app.directive('chatMessage', function(){
    return {
      restrict: 'A',
      templateUrl: 'message.html'
    };
  });

})();
