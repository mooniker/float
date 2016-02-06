# Float Messenger

Float Messenger is web-based instant messaging server and client software for small teams built on the MEAN stack. [Socket.IO](http://socket.io/) handles the WebSockets (real-time full-duplex communication _<abbr title="for the win!">ftw</abbr>_) on both the front and back and Brian Ford's [angular-socket-io](https://github.com/btford/angular-socket-io) facilitates Socket.IO integration for Angular.

## Why 'Float'?

[According to Wikipedia](https://en.wikipedia.org/wiki/Float_(project_management)), "**float** or **slack** is the amount of time that a task in a project network can be delayed without causing a delay" to subsequent tasks or project completion. And because there's no end to functionality that could be added or redone in this project, the challenge is keeping it buoyant (or not giving it too much _slack_).

## Demo mode

In [demo mode](http://float.mooniker.com), users are assigned a random username when they first access the site. Random names are generated using [Chance](http://chancejs.com/).

## Features

- Multi-user real-time Internet chatroom (just what the world needs!)
- MongoDB on the backend saves chat history so a new user to the chat room can retrieve all recent messages and have some context for the current chat
- "[so-and-so] is currently typing" messages alert users when they or others are currently typing

See what's going on with Float (as well as planning and proposed functionality) on [the project's Trello board](https://trello.com/b/aNoDyWQk/float-messenger).

## Motivation and goals

- learn how instant messaging and enterprise software suites such as Slack work
- learn WebSockets
- vainly start an open source project
- ~~???~~
- ~~profit~~

## Installing Float on your machine - and how!

1. Make sure you have `node` and `npm` [installed on your system](https://nodejs.org/en/download/package-manager/).
2. Set up [MongoDB](https://docs.mongodb.org/manual/installation/) on your machine and make sure it's running.
3. Go to a workspace on your machine and clone this repo. (E.g. `git clone https://github.com/mooniker/float.git` will create in your current working directory a `float` directory containing all the project files.)
4. Run `npm install` to retrieve and set up the project's dependencies (Express, Mongoose, Socket.IO, etc).
5. Create a file called `env.js` in the project's root directory. This file should be ignored by git and contains configuration settings for the server's environment. Consider `example_env.js` for a simple local setup, and if you're fine with those settings, you can just rename `example_env.js` to `env.js` and you'll be good to go.
6. Run `node index.js` or `nodemon` to get the server up and running and hit it with your browser at [`http://localhost:4000`](http://localhost:4000) (or wherever you set it up to run).
