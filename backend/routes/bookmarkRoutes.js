const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware"); // use require, not import
const Bookmark = require("../models/Bookmark");

// Add bookmark
router.post("/add", auth, async (req, res) => {
  try {
    // Accept both fileId and fileID for compatibility
    const fileID = req.body.fileID || req.body.fileId;
    if (!fileID) return res.status(400).json({ message: "fileID is required" });
    const existing = await Bookmark.findOne({ userID: req.user.userId, fileID });
    if (existing) return res.status(400).json({ message: "Already bookmarked" });

    const bookmark = new Bookmark({ userID: req.user.userId, fileID });
    await bookmark.save();
    res.json(bookmark);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user's bookmarks
router.get("/", auth, async (req, res) => {
  try {
    // populate fileID and also populate the file's user and subject so frontend can show uploader and subject
    const bookmarks = await Bookmark.find({ userID: req.user.userId }).populate({
      path: "fileID",
      populate: [
        // include profileImageURL so frontend can display uploader pictures in bookmarks
        { path: "user", select: "username firstName lastName profileImageURL" },
        { path: "subject", select: "name" },
      ],
    });
    // Only keep bookmarks with a valid populated fileID
    const filtered = bookmarks.filter(b => b.fileID);
    // Remap fileID to fileId for frontend compatibility
    const mapped = filtered.map(b => {
      const obj = b.toObject();
      obj.fileId = obj.fileID;
      delete obj.fileID;
      return obj;
    });
    res.json({ bookmarks: mapped });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove bookmark
router.delete("/:id", auth, async (req, res) => {
  try {
    await Bookmark.findByIdAndDelete(req.params.id); // expects bookmark _id
    res.json({ message: "Bookmark removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
