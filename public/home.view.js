'use strict'

angular.module('floatApp').component('home', {
  templateUrl: 'home.template.html',
  controller: function HomeController (Uplink, $localStorage, $log) {
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
