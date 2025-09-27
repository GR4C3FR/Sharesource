const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');

// POST new comment
router.post('/', async (req, res) => {
    const { noteId, userId, text, parentCommentId } = req.body;
    try {
        const comment = new Comment({ noteId, userId, text, parentCommentId });
        await comment.save();
        res.status(201).json(comment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET all comments for a note
router.get('/:noteId', async (req, res) => {
    try {
        const comments = await Comment.find({ noteId: req.params.noteId }).populate('userId', 'username');
        res.json(comments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
