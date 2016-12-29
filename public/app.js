'use strict'

angular.module('floatApp', [
  'ngAnimate',
  // 'ngCookies',
  // 'ngResource',
  'ngRoute',
  // 'ngSanitize',
  // 'ngTouch',
  // 'ui.bootstrap',
  'primus',
  'angularMoment',
  'ngStorage',
  'ngRoute'
])
.config(function ($routeProvider) {
  $routeProvider
    .when('/', {
      template: '<chat></chat>'
    })
    .when('/chat/welcome', {
      redirectTo: '/'
    })
    .when('/chat/:channel', {
      template: '<chat></chat>'
    })
    .otherwise({
      redirectTo: '/'
    })
})
.config(function (primusProvider) {
  primusProvider
  // Define Primus endpoint.
  .setEndpoint('/')
  // Define Primus options.
  .setOptions({
    reconnect: {
      minDelay: 100,
      maxDelay: 60000,
      retries: 100
    }
  })
  // Define default multiplex option for resources.
  .setDefaultMultiplex(false)
})
