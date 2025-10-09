const express = require('express');
const router = express.Router();
const Rating = require('../models/Rating');
const authMiddleware = require('../middleware/authMiddleware');
const Bookmark = require('../models/Bookmark');

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

// ✅ GET top-rated files across all uploads (average rating between 4 and 5 inclusive)
router.get('/top-files/all', async (req, res) => {
  try {
    // aggregate average rating per file
    const agg = await Rating.aggregate([
      { $group: { _id: '$fileId', avgRating: { $avg: '$value' } } },
      { $match: { avgRating: { $gte: 4, $lte: 5 } } },
      { $sort: { avgRating: -1 } },
    ]);

    // load File docs for the fileIds and attach avgRating from aggregation
    const fileIds = agg.map(a => a._id);
    const File = require('../models/File');
    const files = await File.find({ _id: { $in: fileIds } })
      .populate('user', 'username email')
      .populate('subject', 'name');

    // attach avgRating and keep order
    const avgById = agg.reduce((acc, a) => { acc[a._id.toString()] = a.avgRating; return acc; }, {});
    const filesById = files.reduce((acc, f) => { acc[f._id.toString()] = f; return acc; }, {});
    const ordered = fileIds.map(id => {
      const file = filesById[id.toString()];
      if (!file) return null;
      const obj = file.toObject();
      obj.avgRating = avgById[id.toString()] || 0;
      return obj;
    }).filter(Boolean);

    res.json({ topFiles: ordered });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET top-rated files for the authenticated user's uploads
router.get('/top-files/my', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const File = require('../models/File');

    // aggregate averages and then join with File to filter by user
    const agg = await Rating.aggregate([
      { $group: { _id: '$fileId', avgRating: { $avg: '$value' } } },
      { $match: { avgRating: { $gte: 4, $lte: 5 } } },
      { $sort: { avgRating: -1 } },
    ]);

    const fileIds = agg.map(a => a._id);
    const files = await File.find({ _id: { $in: fileIds }, user: userId })
      .populate('user', 'username email')
      .populate('subject', 'name');

    const avgById = agg.reduce((acc, a) => { acc[a._id.toString()] = a.avgRating; return acc; }, {});
    const filesById = files.reduce((acc, f) => { acc[f._id.toString()] = f; return acc; }, {});
    const ordered = fileIds.map(id => {
      const file = filesById[id.toString()];
      if (!file) return null;
      const obj = file.toObject();
      obj.avgRating = avgById[id.toString()] || 0;
      return obj;
    }).filter(Boolean);

    res.json({ topFiles: ordered });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET top-rated files from authenticated user's bookmarks
router.get('/top-files/bookmarks', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const bookmarks = await Bookmark.find({ userID: userId }).select('fileID');
    const fileIds = bookmarks.map(b => b.fileID).filter(Boolean);
    if (fileIds.length === 0) return res.json({ topFiles: [] });

    const agg = await Rating.aggregate([
      { $match: { fileId: { $in: fileIds } } },
      { $group: { _id: '$fileId', avgRating: { $avg: '$value' } } },
      { $match: { avgRating: { $gte: 4, $lte: 5 } } },
      { $sort: { avgRating: -1 } },
    ]);

    const File = require('../models/File');
    const ids = agg.map(a => a._id);
    const files = await File.find({ _id: { $in: ids } })
      .populate('user', 'username email')
      .populate('subject', 'name');

    const avgById = agg.reduce((acc, a) => { acc[a._id.toString()] = a.avgRating; return acc; }, {});
    const filesById = files.reduce((acc, f) => { acc[f._id.toString()] = f; return acc; }, {});
    const ordered = ids.map(id => {
      const file = filesById[id.toString()];
      if (!file) return null;
      const obj = file.toObject();
      obj.avgRating = avgById[id.toString()] || 0;
      return obj;
    }).filter(Boolean);

    res.json({ topFiles: ordered });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

