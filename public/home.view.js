'use strict'

angular.module('floatApp').component('home', {
  templateUrl: 'home.template.html',
  controller: function HomeController (primus, $log) {
    var vm = this

    vm.isConnected = false

    primus.$on('open', function () {
      vm.messages = []
      $log.log('Connection established.')
      vm.messages.push({
        body: 'Connection established.',
        postmark: new Date()
      })
      vm.isConnected = true
    })

    primus.$on('data', function (data) {
      $log.log('Received: ' + JSON.stringify(data))
      if (data.body) {
        vm.messages.push(data)
      }
    })

    primus.$on('error', function (err) {
      $log.error(err)
    })

    primus.$on('reconnect', function (options) {
      $log.log('Attempting to reconnect.', options)
      vm.isConnected = false
    })

    primus.$on('reconnect scheduled', function (options) {
      vm.messages.push({
        body: 'Connection lost. Trying to reconnect.',
        postmark: new Date()
      })
      $log.log('Reconnecting in %d ms', options.scheduled)
      $log.log('This is attempt %d out of %d', options.attempt, options.retries)
      vm.isConnected = false
    })

    primus.on('reconnected', function (options) {
      $log.log('It took %d ms to reconnect', options.duration)
      vm.isConnected = true
    })

    primus.on('reconnect timeout', function (err, opts) {
      $log.log('Timeout expired: %s', err.message)
      vm.messages.push({
        body: 'Attempt to reconnect failed.'
      })
    })

    primus.on('reconnect failed', function (err, opts) {
      $log.log('The reconnection failed: %s', err.message)
      vm.messages.push({
        body: 'Attempt to reconnect failed.'
      })
    })

    primus.on('end', function () {
      $log.log('Connection closed')
      vm.messages.push({
        body: 'Connection closed.'
      })
    })

    vm.write = function () {
      var postmark = new Date()
      primus.write({
        body: vm.message,
        postmark: postmark
      })
      vm.messages.push({
        username: 'You',
        body: vm.message,
        postmark: postmark
      })
      vm.message = null
    }

    vm.end = function () {
      primus.end()
    }

    vm.$onInit = function () {
      $log.log('Hi.')
    }
  }
})
