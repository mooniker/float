'use strict'

// set environment to test to disable logging that may interfere
process.env.NODE_ENV = 'test'

// testsuite
let chai = require('chai')
let server = require('../index')
let should = chai.should()
chai.use(require('chai-http'))

describe('HTTP server', () => {
  it('should respond to `GET /ping` with JSON-packaged "pong"', done => {
    chai.request(server)
      .get('/ping')
      .end((err, response) => {
          response.should.have.status(200)
          response.should.be.json
        done()
      })
  })
})
