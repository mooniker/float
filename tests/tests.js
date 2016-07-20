'use strict'

const assert = require('chai').assert

describe('MessageModel', () => {
  // const MessageModel = require('../models/message')
  it('should do something correctly', done => {
    let now = Date.now()
    let message = {
      username: 'janeuser',
      body: 'blah blah blah',
      sent_at: now
    }
    // TODO add mongo lookup
    assert.equal(message.username, 'janeuser')
    assert.equal(message.body, 'blah blah blah')
    assert.equal(message.sent_at, now)
    done()
  })
})
