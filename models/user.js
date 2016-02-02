// var mongoose = require('mongoose');
// var Schema = mongoose.Schema;
// // var passportLocalMongoose = require('passport-local-mongoose');
// var bcrypt = require('bcrypt-nodejs');
//
// var UserSchema = new Schema({
//
//     username: {
//       type: String,
//       unique: true
//     },
//
//     muted: {
//       type: Boolean,
//       default: true
//     },
//
//     local: {
//       email: String,
//       password: String,
//       createdAt: {
//         type: Date,
//         default: Date.now
//       }
//     }
//
// });
//
// // UserSchema.plugin(passportLocalMongoose);
//
// UserSchema.methods.validPassword = function(password) {
//   return bcrypt.compareSync(password, this.local.password);
// };
//
// UserSchema.methods.encrypt = function(password) {
//   return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
// };
//
// UserSchema.methods.rename = function(username) {
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
//
// module.exports = mongoose.model('User', UserSchema);
