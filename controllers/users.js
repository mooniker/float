var passport  = require('passport');
var UserModel = require('../models/user');

module.exports = {

  getSignup : function(request, response) {
    // console.log('getSignup, flash:', request.flash('signupMessage'));
    response.render('signup', { message: request.flash('signupMessage') });
  },

  postSignup : function(request, response) {
    // console.log('postSignup');
    var signupStrategy = passport.authenticate('local-signup', {
      successRedirect : '/profile',
      failureRedirect : '/signup',
      failureFlash    : true
    });
    return signupStrategy(request, response);
  },

  getLogin : function(request, response) {
    response.render('login', { message : request.flash('loginMessage') });
  },

  postLogin : function(request, response) {
    console.log('postLogin');
    var loginProperty = passport.authenticate('local-login', {
      successRedirect : '/home',
      failureRedirect : '/login',
      failureFlash    : true
    });
    return loginProperty(request, response);
  },

  getLogout : function(request, response) {
    console.log('getLogout');
    request.logout();
    response.redirect('/');
  },

  getProfile : function(request, response) {
    console.log('getProfile');
    // response.render('account', !currentUser.username ? {
    //   message : request.flash('you need a username!')
    // } : null);
    var msg = !currentUser.username ? 'you need a username!' : '';
    response.render('profile', { message : request.flash('profileMessage', msg) });
  },

  postProfile : function(request, response) {
    console.log('postProfile');
    var username = request.body.username;
    UserModel.findOne( { 'local.email' : currentUser.local.email }, function(userLookupByEmailError, user) {
      if (userLookupByEmailError) {
        console.error('userLookupByEmailError:', userLookupByEmailError);
      } else {
        if ( user.rename(username) ) {
          var msg = 'Username has been updated.';
          console.log(msg);
          response.render('profile', { message : request.flash('profileMessage', msg) });
          // response.redirect('/home');
          // FIXME seems like page is rendered before the db is updated?
        } else {
          var errMsg = 'Username not updated.';
          response.render('profile', { message : request.flash('profileMessage', errMsg) });
        }
      }
    } );

  },

  getUsername : function(request, response) {

    var userId = request.params.id;
    UserModel.findById(userId, function(userLookupError, doc) {
      if (userLookupError) {
        console.error('userLookupError:', userLookupError);
        response.json({
          error: 'error'
        });
      } else {
        response.json({
          username : doc.username
        });
      }
    });
  }

};
