'use strict'

// default port if not specified by environment
const PORT = 8000

// HTTP server dependencies
const express = require('express')
const logger = require('morgan')

// MongoDB/Mongoose ORM dependencies
// const mongoose = require('mongoose')
// mongoose.Promise = global.Promise // use native ES6 promises

// initiate the application
const app = express() // serves frontend application
const server = require('http').createServer(app) // provides Primus-powered backend
require('./primus')(server) // attach primus real-time interchange wrapper to server

app.set('port', process.env.PORT || PORT)
app.use(logger('dev'))
app.use('/node_modules', express.static('node_modules'))
app.use(express.static('public'))

// Endpoint to test server
app.get('/ping', (request, response) => response.status(200).json({ response: 'pong' }))

// Listen
server.listen(app.get('port'), console.log(`Floating on port ${app.get('port')}.`))

module.exports = server // for testing
