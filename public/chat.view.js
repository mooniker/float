'use strict'

angular.module('floatApp').component('chat', {
  templateUrl: 'chat.template.html',
  controller: function ChatController (Uplink, $localStorage, $log) {
    var vm = this

    // vm.storage = $localStorage

    vm.channel = 'welcome'

    vm.send = function (xmessage) {
      Uplink.send(vm.message)
      vm.message = null
    }

    vm.$onInit = function () {
      vm.$storage = $localStorage
    }
  }
})
