// backend/routes/commentRoutes.js
const express = require("express");
const router = express.Router();
const Comment = require("../models/Comment");

// POST new comment (expects { fileId, userId, text, parentCommentId? })
router.post("/", async (req, res) => {
  try {
    const { fileId, userId, text, parentCommentId } = req.body;

    if (!fileId || !userId || !text) {
      return res
        .status(400)
        .json({ error: "fileId, userId, and text are required" });
    }

    const newComment = new Comment({
      fileId,
      userId,
      text,
      parentCommentId: parentCommentId || null,
    });

    const saved = await newComment.save();

    // populate the user info for frontend convenience
    const populated = await Comment.findById(saved._id)
      .populate("userId", "username email firstName lastName")
      .lean();

    res.status(201).json({ message: "Comment added", comment: populated });
  } catch (err) {
    console.error("❌ Failed to post comment:", err);
    res.status(500).json({ error: "Failed to post comment", details: err.message });
  }
});

// GET comments for a file
router.get("/:fileId", async (req, res) => {
  try {
    const comments = await Comment.find({ fileId: req.params.fileId })
      .populate("userId", "username email firstName lastName")
      .sort({ createdAt: -1 });

    res.json({ comments });
  } catch (err) {
    console.error("❌ Failed to fetch comments:", err);
    res.status(500).json({ error: "Failed to fetch comments", details: err.message });
  }
});

// DELETE comment (body must include userId to verify owner)
router.delete("/:id", async (req, res) => {
  try {
    const { userId } = req.body;
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    if (!userId || comment.userId.toString() !== userId) {
      return res.status(403).json({ error: "Not authorized to delete this comment" });
    }

    await Comment.findByIdAndDelete(req.params.id);
    res.json({ message: "Comment deleted" });
  } catch (err) {
    console.error("❌ Delete error:", err);
    res.status(500).json({ error: "Failed to delete comment", details: err.message });
  }
});

module.exports = router;
