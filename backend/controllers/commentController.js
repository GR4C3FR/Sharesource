const Comment = require("../models/Comment");

// ✅ Get all comments for a specific file
exports.getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ fileId: req.params.fileId })
      .populate("userId", "firstName lastName email username")
      .sort({ createdAt: -1 });

    res.status(200).json({ comments });
  } catch (err) {
    console.error("❌ Error fetching comments:", err);
    res.status(500).json({ error: "Server error while fetching comments" });
  }
};

// ✅ Add a new comment
exports.addComment = async (req, res) => {
  try {
    const { fileId, userId, text, parentCommentId } = req.body;

    if (!fileId || !userId || !text) {
      return res.status(400).json({ error: "fileId, userId, and text are required" });
    }

    const newComment = new Comment({
      fileId,
      userId,
      text,
      parentCommentId: parentCommentId || null,
    });

    await newComment.save();
    const populated = await newComment.populate("userId", "firstName lastName email username");
    res.status(201).json({
      message: "✅ Comment added successfully",
      comment: populated,
    });
  } catch (err) {
    console.error("❌ Error adding comment:", err);
    res.status(500).json({ error: "Server error while adding comment", details: err.message });
  }
};

// ✅ Delete a comment
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    if (req.body.userId && comment.userId.toString() !== req.body.userId) {
      return res.status(403).json({ error: "Not authorized to delete this comment" });
    }

    await comment.deleteOne();
    res.json({ message: "🗑️ Comment deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting comment:", err);
    res.status(500).json({ error: "Server error while deleting comment", details: err.message });
  }
};
