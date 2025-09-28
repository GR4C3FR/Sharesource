// models/GoogleDoc.js
const mongoose = require("mongoose");

const GoogleDocSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // e.g., "Group Project Report"
    link: { type: String, required: true },  // the Google Docs URL
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GoogleDoc", GoogleDocSchema);
