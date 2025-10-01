const express = require("express");
const Note = require("../models/Note");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// 🔒 Middleware: check if user can modify note
async function canModifyNote(req, res, next) {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: "❌ Note not found" });

    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (user.role === "Admin" || note.ownerUserID.toString() === userId) {
      req.note = note;
      next();
    } else {
      return res.status(403).json({ error: "❌ Forbidden: Not allowed to modify this note" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ✅ Create note
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, content, subjectID } = req.body;
    if (!title || !content || !subjectID) {
      return res.status(400).json({ error: "Missing required fields (title, content, subjectID)" });
    }

    const ownerUserID = req.user.userId;
    const newNote = new Note({ title, content, subjectID, ownerUserID });
    await newNote.save();

    // 🔥 Correct way: re-fetch with populate
    const populatedNote = await Note.findById(newNote._id)
      .populate("ownerUserID", "username")
      .populate("subjectID", "name");

    res.status(201).json({ message: "✅ Note created", note: populatedNote });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ Get all notes
router.get("/", authMiddleware, async (req, res) => {
  try {
    const notes = await Note.find()
      .populate("ownerUserID", "username _id")
      .populate("subjectID", "name");

    res.json({ notes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get single note
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)
      .populate("ownerUserID", "username")
      .populate("subjectID", "name");

    if (!note) {
      return res.status(404).json({ error: "❌ Note not found" });
    }

    res.json({ note });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Update note
router.put("/:id", authMiddleware, canModifyNote, async (req, res) => {
  try {
    Object.assign(req.note, req.body, { lastEditedDate: Date.now() });
    await req.note.save();

    // 🔥 Re-fetch with populate to return fresh note
    const updatedNote = await Note.findById(req.note._id)
      .populate("ownerUserID", "username")
      .populate("subjectID", "name");

    res.json({ message: "✅ Note updated", note: updatedNote });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ Delete note
router.delete("/:id", authMiddleware, canModifyNote, async (req, res) => {
  try {
    await req.note.deleteOne();
    res.json({ message: "✅ Note deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
