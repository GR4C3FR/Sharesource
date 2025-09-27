const express = require('express');
const router = express.Router();
const Rating = require('../models/Rating');

// POST or update a rating
router.post('/', async (req, res) => {
    const { noteId, userId, value } = req.body;
    try {
        let rating = await Rating.findOne({ noteId, userId });
        if (rating) {
            rating.value = value; // update existing rating
        } else {
            rating = new Rating({ noteId, userId, value });
        }
        await rating.save();
        res.status(201).json(rating);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET average rating and total ratings for a note
router.get('/:noteId', async (req, res) => {
    try {
        const ratings = await Rating.find({ noteId: req.params.noteId });
        const avg = ratings.reduce((sum, r) => sum + r.value, 0) / (ratings.length || 1);
        res.json({ average: avg, total: ratings.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
