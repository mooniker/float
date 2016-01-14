var MessageModel = require('../models/message');
var UserModel = require('../models/user');

var helpers = {
  makeCopy: function(msg) {
    var newMsg = {
      body : msg.body,
      user_id : msg.user_id,
      timestamp : msg.timestamp,
      sent_at : msg.sent_at
    };
    return newMsg;
  }
};

module.exports = {

  getMessages: function(request, response) {

    console.log('getMessages');

    var yesterday = Date.now() - 86400000;

    MessageModel.find({ timestamp: { $gte: yesterday } }, function(messagesFindError, docs) {

      if (messagesFindError) {
        console.error(messagesFindError);
        response.json({
          type: 'error',
          body: 'Error: failed to retrieve recent messages',
          timestamp: Date.now()
        });
      } else {
        response.json({ messages : docs });
        // console.log(docs.length);
        // var docsToSend = [];
        // var count = 0;
        // function matchMessageWithUsername(msg, index) {
        //   msg.getUsername(function(msgGetUsernameError, username) {
        //     var msgToSend = helpers.makeCopy(msg);
        //     if (msgGetUsernameError) {
        //       console.error(msgGetUsernameError);
        //       if (msg.username) {
        //         msgToSend.username = msg.username;
        //       } else {
        //         msgToSend.username = '???';
        //       }
        //     } else {
        //       msgToSend.username = username;
        //     }
        //     docsToSend[index] = msgToSend;
        //     count += 1; // count each as we match them
        //     if (count >= docs.length) {
        //       response.json({ messages : docsToSend });
        //       console.log('Responded with one day of messages.');
        //     }
        //   });
        // }
        // console.log('run');
        // docs.forEach(matchMessageWithUsername);
      }
    });
  },

  postMessage: function(request, response) {

    // FIXME this is just here to test posting via Angular

    console.log('postMessage!');

    console.log(request);
    console.log(request.data);

    var message = {
      body: request.body.body,
      username: 'unknown poster',
      sent_at: request.body.timestamp,
      timestamp: Date.now()
    };

    new MessageModel(message).save(function(newMessageSaveError) {
      if (newMessageSaveError) {
        console.error('newMessageSaveError:', newMessageSaveError);
      } else {
        // unable to
        // io.emit('chat message', message);
      }
    });

  }
};
