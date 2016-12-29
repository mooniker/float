'use strict'

angular.module('floatApp').component('chat', {
  templateUrl: 'chat.template.html',
  controller: function ChatController (Uplink, $routeParams, $localStorage, $log) {
    var vm = this

    // vm.storage = $localStorage

    vm.send = function (xmessage) {
      Uplink.send(vm.message, vm.channel)
      vm.message = null
    }

    vm.$onInit = function () {
      vm.$storage = $localStorage
      $log.log('route params', $routeParams)

      vm.channel = $routeParams.channel || 'welcome'
    }
  }
})
