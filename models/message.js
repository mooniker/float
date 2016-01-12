var mongoose = require('mongoose');
var UserModel = require('./user');

// Mongoose's schema constructor
var Schema = mongoose.Schema,
  ObjectId = Schema.ObjectId;

// define schema for messages
var MessageSchema = new Schema({

  // username : String,

  body : String,

  user_id : {
    type : Schema.Types.ObjectId,
    ref : 'User'
  },

  // channel : {
  //   type : Schema.Types.ObjectId,
  //   ref : 'Channel'
  // }

  received_at : {
    type : Date,
    default : Date.now
  },

  sent_at : Date

});

MessageSchema.methods.getUsername = function(callback) {
  UserModel.findById(this.user_id, function(error, doc) {
    if (error) {
      console.error(error);
      return callback(error);
    } else {
      return callback(null, doc.username);
    }
  });
};

MessageSchema.methods.setUsername = function(username) {
  this.username = username;
  this.save(function(saveNewUsernameError) {
    if (saveNewUsernameError) {
      return false;
    } else {
      return true;
    }
  });
};

//
// var SystemSchema = new Schema({
//
//   body : String,
//
//   timestamp : {
//     type : Date,
//     defailt : Date.now
//   }
//
// });

module.exports = mongoose.model('Message', MessageSchema);
