'use strict';

(function(){

  var app = angular.module('float', []);

  console.log('Angular app initialized.');

  app.controller('ChannelController', ['$http', function($http){
    var channel = this;
    channel.messages = [];
    $http.get('http://localhost:4001/messages').then(
      function successfulCallback(response){
        channel.messages = response.data.messages;
        console.log('GOT THE MESSAGES:', channel.messages);
      }, function notSuccessfulCallback(response){
        console.log('DID NOT GET THE MESSGAGES.', response);
    });
  }]);

  app.directive('chatMessage', function(){
    return {
      restrict: 'A',
      templateUrl: 'message.html'
    };
  });

})();
