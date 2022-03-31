const mongoose = require('mongoose');

const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    email: {
      type: String,
    },
    name: {
      type: String,
    },
    phone: {
      type: Number,
    },
    address: {
      type: String,
    },
    birthday: {
      type: String,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('User', UserSchema);
