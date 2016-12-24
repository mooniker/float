'use strict'

// wrapper for real-time TCP communication frameworks
const Primus = require('primus')

// random text generator
const Chance = require('chance')
const chance = new Chance()

// sentiment analysis tool
const sentiment = require('sentiment')

module.exports = function (server) {
  const primus = new Primus(server)
  // Socket
  primus.on('connection', function (spark) {
    // console.log('connection has the following headers', spark.headers)
    // console.log('connection was made from', spark.address)
    console.log('connection id', spark.id)

    let username = chance.pickone(['Claude', 'Francis', 'Pavel', 'Carl', 'Wilhelm'])
    const serverId = 0

    let theirName = 'You'
    let theirNameUnconfirmed = null

    spark.write({
      users: [{
        name: theirName,
        id: spark.id,
        you: true
      }, {
        name: username,
        id: serverId
      }],
      message: {
        userId: serverId,
        body: `Hi, my name is ${username}. What should I call you?`,
        postmark: new Date()
      }
    })

    function receiveName (message) {
      theirNameUnconfirmed = message.body.trim()
      spark.write({
        message: {
          userId: serverId,
          body: `So it's OK if I call you ${theirNameUnconfirmed}?`,
          postmark: new Date()
        }
      })
      expectingResponse = confirmName
    }

    function confirmName (message) {
      let confirmation = sentiment(message.body)
      if (confirmation.score >= 1) {
        expectingResponse = null
        theirName = theirNameUnconfirmed
        theirNameUnconfirmed = null
        spark.write({
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
      } else {
        expectingResponse = receiveName
        theirNameUnconfirmed = null
        spark.write({
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
      let sentimentAnalysis = sentiment(messageText)
      spark.write({
        message: {
          userId: serverId,
          // body: chance.sentence(),
          body: 'Sentiment analysis: ' + JSON.stringify(sentimentAnalysis),
          subtext: JSON.stringify(sentimentAnalysis),
          postmark: new Date()
        }
      })
    }

    let expectingResponse = receiveName

    // Receive messages
    spark.on('data', function (message) {
      let messageText = message.body.toString()
      console.log('connection', spark.id, 'sends', messageText)
      spark.write({
        message: {
          userId: spark.id,
          body: messageText,
          postmark: message.postmark
        }
      })

      if (expectingResponse) {
        expectingResponse(message)
      } else {
        respondToMessage(message)
      }
    })
  })

  return primus
}
