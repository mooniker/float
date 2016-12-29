'use strict'

angular.module('floatApp').factory('Uplink', Uplink)

function Uplink (primus, $localStorage, $log) {
  // reset the local cache and initialize
  $localStorage.$reset()

  // create local store's `channels` object if needed
  if (!$localStorage.channels) {
    $localStorage.channels = {}
  }
  // create local store's `userDirectory` object if neede
  if (!$localStorage.userDirectory) {
    $localStorage.userDirectory = {}
  }

  primus.$on('open', function () {
    $log.log('Connection established.')

    // create a channel in the channels object if it doesn't exist
    if (!$localStorage.channels.welcome) {
      $localStorage.channels.welcome = {
        messages: [],
        users: {}
      }
    }

    $localStorage.channels.welcome.messages.push({
      body: 'Connection established.',
      postmark: new Date()
    })
    $localStorage.isConnected = true
  })

  primus.$on('data', function (data) {
    $log.log('Received: ' + JSON.stringify(data))

    // create a channel in the channels object if it doesn't exist
    if (!$localStorage.channels[data.to]) {
      $localStorage.channels[data.to] = {
        messages: [],
        users: {}
      }
    }

    // insert message (if provided) into the proper channel
    if (data.message) {
      $localStorage.channels[data.to].messages.push(data.message)
    }

    if (data.users) {
      data.users.forEach(function (user) {
        $localStorage.userDirectory[user.id] = user.name
        if (user.you) {
          $localStorage.userId = user.id
        }
      })
      $log.log($localStorage.userDirectory)
    }
  })

  primus.$on('error', function (err) {
    $log.error(err)
  })

  primus.$on('reconnect', function (options) {
    $log.log('Attempting to reconnect.', options)
    $localStorage.isConnected = false
  })

  primus.$on('reconnect scheduled', function (options) {
    $localStorage.channels.welcome.messages.push({
      body: 'Connection lost. Trying to reconnect.',
      postmark: new Date()
    })
    $log.log('Reconnecting in %d ms', options.scheduled)
    $log.log('This is attempt %d out of %d', options.attempt, options.retries)
    $localStorage.isConnected = false
  })

  primus.on('reconnected', function (options) {
    $log.log('It took %d ms to reconnect', options.duration)
    $localStorage.isConnected = true
  })

  primus.on('reconnect timeout', function (err, opts) {
    $log.log('Timeout expired: %s', err.message)
    $localStorage.channels.welcome.messages.push({
      body: 'Attempt to reconnect failed.',
      postmark: new Date()
    })
  })

  primus.on('reconnect failed', function (err, opts) {
    $log.log('The reconnection failed: %s', err.message)
    $localStorage.channels.welcome.messages.push({
      body: 'Attempt to reconnect failed.',
      postmark: new Date()
    })
  })

  primus.on('end', function () {
    $log.log('Connection closed')
    $localStorage.channels.welcome.messages.push({
      body: 'Connection closed.',
      postmark: new Date()
    })
  })

  return {
    send: function (message) {
      // var postmark = new Date()
      var data = {
        body: message,
        postmark: new Date()
      }
      if (message[0] === '/') {
        var args = message.trim().split(' ')
        switch (args[0].toLowerCase()) {
          case '/name':
            data.name = args.slice(1).join(' ')
            break
          default:
            $log.log('Unrecognized command.')
        }
      }
      primus.write(data)
      $log.log('Sent', data)
    },
    end: function () {
      primus.end()
    }
  }
}
