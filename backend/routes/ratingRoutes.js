const express = require('express');
const router = express.Router();
const Rating = require('../models/Rating');

// ✅ POST a new rating
router.post('/', async (req, res) => {
  const { fileId, userId, value } = req.body;
  try {
    if (!fileId || !userId || !value)
      return res.status(400).json({ error: "fileId, userId, and value are required" });

    let existingRating = await Rating.findOne({ fileId, userId });

    if (existingRating) {
      existingRating.value = value;
      await existingRating.save();
      return res.json({ message: "Rating updated", rating: existingRating });
    }

    const rating = new Rating({ fileId, userId, value });
    await rating.save();
    res.status(201).json({ message: "Rating saved", rating });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET average rating for a file
router.get('/:fileId', async (req, res) => {
  try {
    const ratings = await Rating.find({ fileId: req.params.fileId });
    const average =
      ratings.length > 0
        ? ratings.reduce((acc, r) => acc + r.value, 0) / ratings.length
        : 0;
    res.json({ average });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
