const mongoose = require('mongoose');
const Note = require('../models/Note');
const Comment = require('../models/Comment');
const Rating = require('../models/Rating');

// DELETE /api/notes/:id
exports.deleteNote = async (req, res) => {
  const noteId = req.params.id;

  // Basic validation
  if (!mongoose.Types.ObjectId.isValid(noteId)) {
    return res.status(400).json({ message: 'Invalid note id' });
  }

  try {
    // Fetch the note first
    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Authorization: ensure the requester is owner or Admin
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    const isOwner = note.ownerUserID.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'Admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this note' });
    }

    let session = null;
    try {
      session = await mongoose.startSession();
      session.startTransaction();

      // delete the note
      await Note.findByIdAndDelete(noteId, { session });

      await Comment.deleteMany({ noteId: noteId }, { session });
      await Rating.deleteMany({ noteId: noteId }, { session });

      await session.commitTransaction();
      session.endSession();

      return res.json({ message: 'Note and related comments/ratings deleted successfully' });
    } catch (txErr) {
      if (session) {
        try {
          await session.abortTransaction();
        } catch (e) {}
        session.endSession();
      }

      await Note.findByIdAndDelete(noteId);
      await Comment.deleteMany({ noteId: noteId });
      await Rating.deleteMany({ noteId: noteId });

      return res.json({
        message:
          'Note deleted. Related comments/ratings deleted (non-transactional fallback).'
      });
    }
  } catch (err) {
    console.error('Error deleting note:', err);
    return res.status(500).json({ message: 'Server error while deleting note' });
  }
};
