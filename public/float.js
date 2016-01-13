var floatMessenger = {

  socket: null,

  socketsCreated: 0,

  status: 0,

  messagesBox: document.querySelector('#messages-box'),
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

  setStatusDisconnected: function() {

    this.status = 0;

    console.log('Status set to DISCONNECTED.');

    // this.$statusBar.css('background', 'red');
    this.messageSubmit.style.background = 'red';
    // this.$statusBar.text('disconnected');
    this.messageSubmit.innerText = 'DISCONNECTED';
    // disable form
    this.disableSend();

    this.post({
      body: '<em>Connetion lost. Try <a href="/login">logging in again</a>.</em>',
      username: '<em>system</em>',
      timestamp: Date.now()
    });
  },

  setStatusSocketEstablished: function() {

    this.status = 1;

    console.log('Status set to CONNECTION ESTABLISHED (login required).');
    this.messageSubmit.style.background = 'yellow';
    this.messageSubmit.innerText = 'LOG IN AGAIN';
    // this.post({
    //   body: 'connection reestablished but <a href="/login">you must log in again</a>.',
    //   username: 'system',
    //   timestamp: Date.now()
    // });

  },

  setStatusAuthenticated: function() {

    this.status = 2;

    console.log('Status set to ONLINE.');

    this.messageSubmit.style.background = 'green';
    this.messageSubmit.innerText = 'SEND';
    this.enableSend();

    this.post({
      body: '<em>you are logged in.</em>',
      username: '<em>system</em>',
      timestamp: Date.now()
    });
  },

  refreshMessages: function() {

    // TODO cut off the number of recent mesages or set up scrolling oriented to the bottom
    console.log('Trying to refresh messages from server.');
    var self = this;
    $.getJSON('/messages', function(data) {
      console.log('Server responded with', data);
      self.messagesBox.innerHTML = '';
      data.messages.forEach(function(msg) {
        self.post(msg);
      });
    }).done(function(err) {
      console.log(err);
      // self.setStatusAuthenticated();
    }).fail(function(err) {
      console.log(err);
      self.setStatusDisconnected();
    });
  },

  init: function() {

    // disable message sending functionality on startup
    // this.disableSend();

    // initialize websocket
    this.socket = io();
    console.log('Websocket initialized, now trying to connect.');

    // set up websocket listeners
    this.socket.on('connect', function(err) {
      this.setStatusSocketEstablished();
      this.socketsCreated += 1;
      console.log('Connection established.', this.socketsCreated);

      this.refreshMessages(); // FIXME system messages are lost
      if (this.socketsCreated < 2) { // bc session is lost on new websocket
        this.setStatusAuthenticated();
      } // TODO this needs some think time!
      // can we authenticate web sockets to cut down on the weird logic?



    }.bind(this));

    this.socket.on('disconnect', function() {
      console.log('Connection lost.');
      this.setStatusDisconnected();
    }.bind(this));

    this.socket.on('connect_timeout', function() {
      console.log('Connection attempt timed out.');
    });

    this.socket.on('reconnecting', function(number) {
      console.log('Attempting to reconnect, try #' + number + '.');
    });

    this.socket.on('reconnect_error', function(err) {
      console.log('Error reconnecting.', JSON.stringify(err));
    });

    this.socket.on('reconnect_failed', function() {
      console.log('Failed to reconnect.');
    });

    // capture and post messages
    this.socket.on('chat message', function(msg) {
      this.post(msg);

      // if ( $(this.messagesBox).children().length > 5) {
      // $(this.messagesBox).children().eq(0).fadeOut().remove();
    }.bind(this));

    this.socket.on('debug message', function(msg) {
      console.log('* SERVER DEBUG LOGGER:', msg);
    });

    // set up listener for messages to send
    this.messengerForm.addEventListener('submit', function(event) {
      event.preventDefault();

      var message = {
        username: 'me',
        body: this.messageInput.value,
        timestamp : Date.now()
      };

      this.socket.emit('chat message', message);
      console.log('Message sent:', message);

      this.messageInput.value = '';

      return false;

    }.bind(this));

  }
};

floatMessenger.init();
