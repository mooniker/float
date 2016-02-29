var mongoose = require('mongoose');
var UserModel = require('./user');
var MessageModel = require('./message');

// Mongoose's schema constructor
var Schema = mongoose.Schema,
  ObjectId = Schema.ObjectId;

// define schema for messages
var ChannelSchema = new Schema({

  name: String,

  members: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],

  messages: [{
    type: Schema.Types.ObjectId,
    ref: 'Message'
  }],

  public: { type: Boolean, default: false },

  created_at: { type: Date, default: Date.now },

  updated_at: { type: Date, default: Date.now }

});

module.exports = mongoose.model('Channel', ChannelSchema);
