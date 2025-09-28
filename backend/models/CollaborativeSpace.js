// models/CollaborativeSpace.js
const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  role: { type: String, enum: ["owner", "editor", "viewer"], default: "viewer" },
  joinedAt: { type: Date, default: Date.now }
});

const CollaborativeSpaceSchema = new mongoose.Schema(
  {
    spaceName: { type: String, required: true },
    description: { type: String },
    ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        role: { type: String, enum: ["owner", "member"], default: "member" },
      },
    ],
    sharedNotesIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Note" }],
    sharedDocIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "GoogleDoc" }], // ✅ now points to real model
  },
  { timestamps: true }
);

module.exports = mongoose.model("CollaborativeSpace", CollaborativeSpaceSchema);
