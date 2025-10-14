
const mongoose = require("mongoose");


const bookmarkSchema = new mongoose.Schema({
  userID: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  fileID: { type: mongoose.Schema.Types.ObjectId, ref: "File", required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Bookmark", bookmarkSchema);
