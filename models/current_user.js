var mongoose = require('mongoose');
var Schema = mongoose.Schema;
// var passportLocalMongoose = require('passport-local-mongoose');
var bcrypt = require('bcrypt-nodejs');

var CurrentUserSchema = new Schema({

    username: {
      type: String,
      unique: true
    },

    socketId: {
      type: String,
      unique: true
    },

    socketClientId: {
      type: String,
      unique: true
    },

    currentlyTyping: {
      type: Boolean,
      default: false
    },

    whenLastTyped: {
      type: Date,
      default: null // should this be 0?
    },

    userAgent: String,

    loggedOnSince: { type: Date, default: Date.now }

});

// TODO add index to optimize querying by who's typing
// CurrentUserSchema.index({ whenLastTyped and/or currentlyTyping });

// CurrentUserSchema.methods.rename = function(username) {
//
//   this.username = username;
//   this.muted = false;
//
//   this.save(function(saveNewUsernameError) {
//     if (saveNewUsernameError) {
//       console.error('saveNewUsernameError:', saveNewUsernameError);
//       return false;
//     } else {
//       console.log('User renamed to', this.username);
//       return true;
//     }
//   });
// };

module.exports = mongoose.model('CurrentUser', CurrentUserSchema);
