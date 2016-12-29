'use strict'

// wrapper for real-time TCP communication frameworks
const Primus = require('primus')

// random text generator
const Chance = require('chance')
const chance = new Chance()

// sentiment analysis tool
const sentiment = require('sentiment')
const extraWords = {
  'yep': 1,
  'yup': 1,
  'yesh': 1,
  'sure': 1,
  'affirmative': 1,
  'nope': -1,
  'nah': -1
}

module.exports = function (server) {
  const primus = new Primus(server)
  // Socket
  primus.on('connection', function (spark) {
    // console.log('connection has the following headers', spark.headers)
    // console.log('connection was made from', spark.address)
    // console.log('connection id', spark.id)

    let introBotName = chance.pickone([
      'Claude',
      'Francis',
      chance.pickone(['Pavel', 'Pavla']),
      chance.pickone(['Carl', 'Carla']),
      chance.pickone(['Wilhelm', 'Wilhelmina'])
    ])
    const serverId = 0

    let theirName = 'You'
    let theirNameUnconfirmed = null

    spark.write({
      to: 'welcome',
      users: [{
        name: theirName,
        id: spark.id,
        you: true
      }, {
        name: introBotName,
        id: serverId
      }],
      message: {
        userId: serverId,
        body: `Hi, my name is ${introBotName}. What should I call you?`,
        postmark: new Date()
      },
      event: {
        body: `Connection id = ${spark.id}`,
        postmark: new Date()
      }
    })

    function receiveName (message) {
      theirNameUnconfirmed = message.body.trim()
      spark.write({
        to: 'welcome',
        message: {
          userId: serverId,
          body: `So it's OK if I call you ${theirNameUnconfirmed}?`,
          postmark: new Date()
        }
      })
      expectingResponse = confirmName
    }

    function confirmName (message) {
      let confirmation = sentiment(message.body, extraWords)
      if (confirmation.score >= 1) {
        expectingResponse = null
        theirName = theirNameUnconfirmed
        theirNameUnconfirmed = null
        spark.write({
          to: 'welcome',
          users: [{
            name: theirName,
            id: spark.id,
            you: true
          }],
          message: {
            userId: serverId,
            body: `Nice to meet you, ${theirName}.`,
            subtext: JSON.stringify(confirmation),
            postmark: new Date()
          }
        })
      } else if (confirmation.score === 0) {
        spark.write({
          to: 'welcome',
          message: {
            userId: serverId,
            body: `Huh? Are you ${theirNameUnconfirmed} - yes or no?`,
            subtext: JSON.stringify(confirmation),
            postmark: new Date()
          }
        })
      } else {
        expectingResponse = receiveName
        theirNameUnconfirmed = null
        spark.write({
          to: 'welcome',
          message: {
            userId: serverId,
            body: `No? What shall I call you then?`,
            subtext: JSON.stringify(confirmation),
            postmark: new Date()
          }
        })
      }
    }

    function respondToMessage (message) {
      let messageText = message.body.toString()
      let data = {
        to: 'welcome',
        message: {
          userId: serverId,
          postmark: new Date()
        }
      }
      if (message.name) {
        data.message.body = `OK, I'll call you ${message.name} (instead of ${theirName}).`
        theirName = message.name
        data.users = [{
          name: theirName,
          id: spark.id,
          you: true
        }]
      } else if (message.join) {
        // all channels are public at this point (TODO)
        data.message.body = 'Roger.'
        data.message.subtext = `User requests to join ${message.join}.`
        data.join = message.join
      } else {
        let sentimentAnalysis = sentiment(messageText, extraWords)
        data.message.body = 'Sentiment analysis: ' + JSON.stringify(sentimentAnalysis)
        data.message.subtext = JSON.stringify(sentimentAnalysis)
      }
      spark.write(data)
    }

    let expectingResponse = receiveName

    // Receive messages
    spark.on('data', function (data) {
      let messageText = data.body.toString()
      console.log('connection', spark.id, 'sends', messageText)

      let message = {
        userId: spark.id,
        body: data.body.toString(),
        postmark: data.postmark
      }

      if (data.channel === 'welcome') {
        spark.write({
          to: `welcome`,
          message: message
        })

        if (expectingResponse) {
          expectingResponse(data)
        } else {
          respondToMessage(data)
        }
      } else {
        primus.write({
          to: data.channel,
          message: message
        })
      }
    })
  })

  return primus
}
