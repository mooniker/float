# Data Modeling

## Users (authenticated)

```js
var UserSchema = new Schema({

    username: {
      type: String,
      unique: true
    },

    muted: {
      type: Boolean,
      default: true
    },

    local: {
      email: String,
      password: String,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }

});
```

## current users

```js
var CurrentUsers = new Schema({
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
  }
});
```

## Messages

```js
var MessageSchema = new Schema({

  username : String,

  body : String,

  user_id : {
    type : Schema.Types.ObjectId,
    ref : 'User'
  },

  channel : {
    type : Schema.Types.ObjectId,
    ref : 'Channel'
  }

  timestamp : {
    type : Date,
    default : Date.now
  },

  sent_at : Date

});
```

## Channels

```js
var ChannelSchema = new Schema({
  name: String,
});
```
