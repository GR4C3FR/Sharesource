const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

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

userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  // const salt = await bcrypt.genSalt(10);
  // this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.setPassword = async function (plainPassword) {
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(plainPassword, salt);
};

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

// const User = mongoose.model('User', userSchema, 'users');
module.exports = mongoose.model('User', userSchema);
