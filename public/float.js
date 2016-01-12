var floatMessenger = {

  socket: null,

  messagesBox: document.querySelector('#messages'),
  messengerForm: document.querySelector('#messenger-form'),
  messageInput: document.querySelector('#message-input'),
  messageSubmit: document.querySelector('#message-submit'),
  // statusBar: document.querySelector('#status'),

  disableSend: function() {

    this.messageInput.disabled = true;
    this.messageSubmit.disabled = true;

  },

  enableSend: function() {

    this.messageInput.disabled = false;
    this.messageSubmit.disabled = false;

  },

  post: function(msg) {
    this.messagesBox.innerHTML += '<li title="' + msg.timestamp + '">' + msg.username + ': ' + msg.body + '</li>';
  },

  init: function() {

    // disable message sending functionality on startup
    // this.disableSend();

    // initialize websocket
    this.socket = io();

    // set up listener for messages to send
    this.messengerForm.addEventListener('submit', function(event) {
      event.preventDefault();

      var message = {
        username: 'anon',
        body: this.messageInput.value,
        timestamp : Date.now()
      };

      this.socket.emit('chat message', message);
      console.log('Message sent:', message);

      this.messageInput.value = '';

      return false;

    }.bind(this));

    // capture and post messages
    this.socket.on('chat message', function(msg) {
      this.post(msg);

      // if ( $(this.messagesBox).children().length > 5) {
      // $(this.messagesBox).children().eq(0).fadeOut().remove();
    }.bind(this));

    this.socket.on('debug message', function(msg) {
      console.log('* SERVER DEBUG LOGGER:', msg);
    });

  }
};

floatMessenger.init();
