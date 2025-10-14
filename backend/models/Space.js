import mongoose from "mongoose";

const spaceSchema = new mongoose.Schema({
  spaceName: { type: String, required: true },
  description: { type: String },
  members: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      role: { type: String, enum: ["admin", "member"], default: "member" },
    },
  ],
  sharedNotesIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "GoogleDoc" }],
});

export default mongoose.model("Space", spaceSchema);