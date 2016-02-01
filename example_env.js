// # Here's an example of `env.js`
//
// `env.js` is where you can put configuration settings for the server's environment.
//
// If you're fine with a simple local setup, just rename this file `env.js` (by removing `example_`)
//
// Remember that `env.js` is in .gitignore and will be ignored by git.

module.exports = {
  PORT: 4000, // or whatever you want
  MONGO_SERVER_URI: 'mongodb://localhost/float', // or wherever you want to provision your MongoDB
};
