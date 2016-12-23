'use strict'

const PORT = 8000

// HTTP server dependencies
const express = require('express')
const logger = require('morgan')

// wrapper for real-time TCP communication frameworks
const Primus = require('primus')

// random text generator
const Chance = require('chance')
const chance = new Chance()

// MongoDB/Mongoose ORM dependencies
// const mongoose = require('mongoose')
// mongoose.Promise = global.Promise // use native ES6 promises

// initiate the application
const app = express() // serves frontend application
const server = require('http').createServer(app) // provides Primus-powered backend
const primus = new Primus(server)

// Endpoint to test server
app.get('/ping', (request, response) => response.status(200).json({ response: 'pong' }))

app.use(logger('dev'))
app.set('port', process.env.PORT || PORT)
app.use('/node_modules', express.static('node_modules'))
app.use(express.static('public'))

// Socket
primus.on('connection', function (spark) {
  // console.log('connection has the following headers', spark.headers)
  // console.log('connection was made from', spark.address)
  console.log('connection id', spark.id)

  let username = chance.pickone(['Claude', 'Francis', 'Pavel', 'Carl', 'Wilhelm'])

  spark.write({
    username: username,
    body: `Hi, my name is ${username}, and I'll respond to whatever you say with gibberish.`,
    postmark: new Date()
  })

  // Receive messages
  spark.on('data', function (message) {
    console.log('connection', spark.id, 'sends', message.body.toString())
    spark.write({
      username: username,
      body: chance.sentence(),
      // body: message.body.toString(),
      postmark: new Date()
    })
  })
})

// Listen
server.listen(app.get('port'), console.log(`Floating on port ${app.get('port')}.`))
