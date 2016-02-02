# Communication's gotta happen between server and clients and it's got to be standardized

## Messages from client to server

## Messages

### 'chat message'

### 'typing' and 'not typing'

As currently emitted,

### requests

- `/blah`
- `/house`
- `/help`
- `/nick` or `/callme`

Client does this:
```js
socket.emit('request', {
  cmd: cmd,
  args: args,
  timestamp: Date.now()
});
```

Here's some IRC commands we may (or may not want to repurpose):

- `/join`
- `/me`
- `/msg`
- `/notice`
- `/whois`

Server ignores args for `/help`, `/blah`, and `/house`.

## Messages from server to client

### chat messages

Generally, the message is saved to database and then sent to clients only when the save was successful.

```js
var newMessage = {
  key1: value1,
  key2: value2
};
new MessageModel(newMessage).save(function(msgSaveError) {
  if (msgSaveError) console.error(msgSaveError);
  else {
    newMessage.timestamp = Date.now();
    io.emit('chat message', newMessage);
  }
});
```

### system messages?

**not implemented yet**

```js
// probably going to need to set something like this up
var newSysMsg = {
  key1: value1,
  key2: value2,
  timestamp: Date.now()
}
new SystemMessage(newSysMsg).save(function(msgSaveError) {
  if (msgSaveError) console.error(msgSaveError);
  else {
    io.emit('sys message', newSysMsg)
  }
})
```

### Events

#### usersTyping

Whenever the server receives notice that a new user is typing, a user has stopped typing, or after an interval some of the users logged as typing should be timed out as no longer typing, the server sends out a new event.

```js
var newEvent = {
  usersTyping: usernames // value is array of screenames
}
io.emit('event', newEvent);
clearTimeout(eventRefresher); // clear the event announcer timer
// announce events again in 4 seconds if needed
if (Object.keys(usersCurrentlyTypingLogbook).length > 0)
  eventRefresher = setTimeout(announceUsersTyping, 4000);
```

#### newUser
