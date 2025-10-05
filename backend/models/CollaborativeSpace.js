const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  role: { type: String, enum: ["owner", "editor", "viewer"], default: "viewer" },
  joinedAt: { type: Date, default: Date.now }
});

const fileSchema = new mongoose.Schema({
  fileId: { type: mongoose.Schema.Types.ObjectId, ref: "File" }, // reference to actual File model
  name: { type: String },
  type: { type: String }
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
    sharedFilesIds: [fileSchema], // fixed to match controller
  },
  { timestamps: true }
);

module.exports = mongoose.model("CollaborativeSpace", CollaborativeSpaceSchema);
