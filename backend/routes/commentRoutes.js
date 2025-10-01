const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');

// POST new comment
router.post('/', async (req, res) => {
  const { noteId, userId, text, parentCommentId } = req.body;
  try {
    if (!noteId || !userId || !text) {
      return res.status(400).json({ error: "noteId, userId, and text are required" });
    }

    const comment = new Comment({ noteId, userId, text, parentCommentId });
    await comment.save();

    // return with populated user info
    const populatedComment = await Comment.findById(comment._id).populate("userId", "username");
    res.status(201).json(populatedComment);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all comments for a note
router.get('/:noteId', async (req, res) => {
  try {
    const comments = await Comment.find({ noteId: req.params.noteId })
      .populate('userId', 'username')  // only return username field
      .sort({ createdAt: -1 });        // newest first
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a comment (only owner can delete)
router.delete('/:id', async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    // Only check ownership if userId is passed
    if (req.body.userId && comment.userId.toString() !== req.body.userId) {
      return res.status(403).json({ error: "Not authorized to delete this comment" });
    }

    await Comment.findByIdAndDelete(req.params.id);
    res.json({ message: "Comment deleted successfully" });

  } catch (err) {
    console.error("Delete error:", err); // 👈 log the real issue
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
