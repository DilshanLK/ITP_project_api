/* eslint-disable global-require */
const mongoose = require('mongoose');

// wellbeing-db-user
// kI0vSOTp7WXDPh4L

mongoose.connect('mongodb+srv://Mahima:yanni1999@cluster0.7yh08.mongodb.net/myFirstDatabase?retryWrites=true&w=majority',
  { useCreateIndex: true, useNewUrlParser: true, useUnifiedTopology: true }).then(() => console.log('mongoDB connected...'));
mongoose.Promise = global.Promise;

module.exports = {
  User: require('../user/user.model'),
};
