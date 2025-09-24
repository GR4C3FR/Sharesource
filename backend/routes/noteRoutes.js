const express = require("express");
const Note = require("../models/Note");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware"); 

const router = express.Router();

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

// Create note — owner only
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, content, subjectID } = req.body;
    if (!title || !content || !subjectID) {
      return res.status(400).json({ error: "Missing required fields (title, content, subjectID)" });
    }

    const ownerUserID = req.user.userId;
    const newNote = new Note({ title, content, subjectID, ownerUserID });
    await newNote.save();

    res.status(201).json({ message: "✅ Note created", note: newNote });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all notes — everybody can view
router.get("/", authMiddleware, async (req, res) => {
  try {
    const notes = await Note.find().populate("ownerUserID", "username _id");
    res.json({ notes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get note by ID — owner or admin only
router.get("/:id", authMiddleware, canModifyNote, async (req, res) => {
  res.json({ note: req.note });
});

// Update note by ID — owner or admin only
router.put("/:id", authMiddleware, canModifyNote, async (req, res) => {
  try {
    Object.assign(req.note, req.body, { lastEditedDate: Date.now() });
    await req.note.save();
    res.json({ message: "✅ Note updated", note: req.note });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete note by ID — owner or admin only
router.delete("/:id", authMiddleware, canModifyNote, async (req, res) => {
  try {
    await req.note.deleteOne();
    res.json({ message: "✅ Note deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
