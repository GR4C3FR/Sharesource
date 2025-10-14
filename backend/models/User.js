const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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
  // try {
  //   const salt = await bcrypt.genSalt(10);
  //   this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
  // } catch (err) {
  //   next();
  // }
});

userSchema.methods.setPassword = async function (plainPassword) {
  if (!plainPassword.startsWith('$2b$')) { // only hash if not already hashed
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(plainPassword, salt);
  } else {
    this.passwordHash = plainPassword;
  }
};


userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { userId: this._id, email: this.email, role: this.role },
    process.env.JWT_SECRET || "defaultsecret",
    { expiresIn: "30d" }
  );
};

// const User = mongoose.model('User', userSchema, 'users');
module.exports = mongoose.model('User', userSchema);
