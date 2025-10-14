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

// When a space document is deleted (document.deleteOne()), remove any linked GoogleDoc records
CollaborativeSpaceSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  try {
    // require here to avoid circular requires at module load time
    const GoogleDoc = require('./GoogleDoc');
    const docsToDelete = (this.sharedFilesIds || [])
      .filter((f) => f.type === 'googledoc' && f.fileId)
      .map((f) => f.fileId);

    if (docsToDelete.length > 0) {
      await GoogleDoc.deleteMany({ _id: { $in: docsToDelete } });
      console.log(`[CollaborativeSpace] deleted ${docsToDelete.length} linked GoogleDoc(s) for removed space ${this._id}`);
    }

    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("CollaborativeSpace", CollaborativeSpaceSchema);
