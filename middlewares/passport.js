var LocalStrategy = require('passport-local').Strategy;
var UserModel  = require('../models/user');

module.exports = function(passport) {

  passport.serializeUser( function(user, done) {
    done(null, user.id);
  } );

  passport.deserializeUser( function(id, callback) {
    UserModel.findById( id, function(error, user) {
      callback(error, user);
    } );
  } );

  passport.use('local-signup', new LocalStrategy({
    usernameField : 'email',
    passwordField : 'password',
    passReqToCallback : true
  }, function(request, email, password, callback) {
    // Find a user by given email address
    UserModel.findOne({ 'local.email' : email }, function(userLookupFailedError, user) {
      console.log('just ran UserModel.findOne');
      if (userLookupFailedError) {
        console.error('userLookupFailedError:', userLookupFailedError);
        return callback(userLookupFailedError);
      } else if (user) {
        var msg =  'This email is already used.';
        console.log(msg);
        return callback(null, false, request.flash('signupMessage', msg));
      } else { // all clear, create new user
        console.log('create new user');
        var newUser = new UserModel();
        newUser.local.email = email;
        newUser.local.password = newUser.encrypt(password);
        newUser.save( function(saveNewUserError) {
          if (saveNewUserError) {
            console.error('saveNewUserError:', saveNewUserError);
            throw saveNewUserError;
          } else {
            console.log('new user saved.');
            return callback(null, newUser);
          }
        } );
      }
    });
  }));

  passport.use('local-login', new LocalStrategy({
    usernameField : 'email',
    passwordField : 'password',
    passReqToCallback : true
  }, function(request, email, password, callback) {
    // search for user with this email
    UserModel.findOne({ 'local.email' : email }, function(userLookupFailedError, user) {
      if (userLookupFailedError) {
        console.error('userLookupFailedError:', userLookupFailedError);
        return callback(userLookupFailedError);
      }
      if (!user) { // if no user found
        var msg = 'User not found.';
        console.log(msg);
        return callback(null, false, request.flash('loginMessage', msg));
      }
      if (!user.validPassword(password)) {
        return callback(null, false, request.flash('loginMessage', 'Password not recognized.'));
      }
      console.log('login by', user);
      return callback(null, user, request.flash('userMessage', 'you are signed in.'));
    } );
  }));

};
