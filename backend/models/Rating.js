const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'File', required: true }, // ✅ changed from noteId
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  value: { type: Number, min: 1, max: 5, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Rating', ratingSchema);
