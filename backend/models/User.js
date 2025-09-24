const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  bio: { type: String },
  dateJoined: { type: Date, default: Date.now },
  profileImageURL: { type: String },
  role: { type: String, enum: ['Admin', 'Student'], default: 'Student' }
}, { strict: "throw" });

const User = mongoose.model('User', userSchema, 'users');
module.exports = User;
