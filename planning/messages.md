# The server and client have got to talk to each other and their interlocution has got to be standardized

## Messages from client to server

### 'chat message'

Here's how the client sends the server a message:

```js
socket.emit('chat message', {
  body: channel.message.body,
  timestamp: Date.now()
});
```

### 'typing' and 'not typing'

Here's how the client tells the server she is typing:

```js
// typingIsHappening is a boolean
socket.emit(typingIsHappening ? 'typing' : 'not typing', Date.now());
```

### requests

- `/blah`
- `/house`
- `/help`
- `/nick` or `/callme`
- `/join` <channel>

Client does this:
```js
socket.emit('request', {
  cmd: cmd,
  args: args,
  timestamp: Date.now()
});
```

Here's some IRC commands we may use (or repurpose):

- `/join`
- `/me`
- `/msg`
- `/notice`
- `/whois`

Server ignores args for `/help`, `/blah`, and `/house`.

## Messages from server to client

### chat messages

Generally, the message is saved to database and then sent to other clients only when the save was successful.

```js
var newMessage = {
  username: 'username' in msg ? msg.username : username,
  body: msg.body,
  sent_at: msg.timestamp
};
new MessageModel(newMessage).save(function(msgSaveError) {
  if (msgSaveError) console.error(msgSaveError);
  else {
    newMessage.timestamp = Date.now();
    io.emit('chat message', newMessage);
  }
});
```

### system message to individual user

Here's how they are currently implemented:

```js
io.sockets.socket[socket.id].emit('chat message', {
  username: '*system*',
  body: msgBody,
  timestamp: Date.now()
}); // not saved to database
```

TODO: system message architecture need to completely overhauled.

### Events

#### usersTyping

Whenever the server receives notice that a new user is typing, a user has stopped typing, or after an interval some of the users logged as typing should be timed out as no longer typing, the server sends out a new event.

```js
var newEvent = {
  usersTyping: usernames // value is array of screenames
}
io.emit('event', newEvent);
clearTimeout(eventRefresher); // clear the event announcer timer
```

#### newUser

```js
io.emit('current users', currentUsers);
```
