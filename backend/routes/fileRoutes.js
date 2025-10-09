const express = require('express');
const path = require('path');
const fs = require('fs');
const File = require('../models/File');
const Comment = require('../models/Comment');
const Rating = require('../models/Rating');
const upload = require('../middleware/upload');
const authMiddleware = require('../middleware/authMiddleware');

// 🆕 Import the GoogleDoc model
const GoogleDoc = require('../models/GoogleDoc');

const router = express.Router();

// =============================================
// 🔹 ORIGINAL FILE UPLOAD ROUTES (UNCHANGED)
// =============================================

// upload a single file; field name: 'file'
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const fileDoc = new File({
            user: req.user.userId,
            filename: req.file.filename,
            originalName: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path,
            title: req.body.title || req.file.originalname,
            description: req.body.description || '',
            subject: req.body.subjectID || null
        });

        await fileDoc.save();

        res.status(201).json({ message: 'File uploaded', file: fileDoc });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ message: 'Upload failed', error: err.message });
    }
});

router.get('/', authMiddleware, async (req, res) => {
    try {
    const files = await File.find()
      .populate('user', 'username email profileImageURL')
            .populate('subject', 'name')
            .sort({ uploadDate: -1 });
            
        const filesMapped = files.map((file) => ({
            ...file._doc,
            subjectID: file.subject || null,
        }));

        res.json({ files: filesMapped });
    } catch (err) {
        console.error('Fetch files error:', err);
        res.status(500).json({ message: err.message });
    }
});

// list authenticated user's files
router.get('/my', authMiddleware, async (req, res) => {
    try {
        const userId = req.user._id || req.user.userId;
  const files = await File.find({ user: userId })
  .populate('user', 'username email profileImageURL')
        .populate('subject', 'name')
        .sort({ uploadDate: -1 });
        res.json({ files });
    } catch (err) {
        console.error("Fetch my files error:", err);
        res.status(500).json({ message: err.message });
    }
});

// download file
router.get('/:id/download', authMiddleware, async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) return res.status(404).json({ message: 'File not found' });

        const isOwner = file.user.toString() === req.user.userId;
        if (!isOwner) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        res.download(path.resolve(file.path), file.originalName);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// delete file
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });

    const fileOwnerId = file.user._id ? file.user._id.toString() : file.user.toString();
    const isOwner = fileOwnerId === (req.user._id?.toString() || req.user.userId?.toString());
    if (!isOwner) return res.status(403).json({ message: 'Forbidden' });

    try {
      fs.unlinkSync(path.resolve(file.path));
    } catch (err) {
      console.warn('⚠️ File not found on disk, skipping unlink:', file.path);
    }


    await Promise.all([
      Comment.deleteMany({ fileId: file._id }),
      Rating.deleteMany({ fileId: file._id }),
      require("../models/Bookmark").deleteMany({ fileID: file._id }),
    ]);

    await file.deleteOne();

    res.json({ message: 'File deleted successfully' });
  } catch (err) {
    console.error('Delete file error:', err);
    res.status(500).json({ message: err.message });
  }
});

// =============================================
// 🆕 NEW GOOGLE DOCS LINK ROUTES
// =============================================

// Add a Google Docs link (must be public)
router.post('/google-docs', authMiddleware, async (req, res) => {
  try {
    const { title, link } = req.body;

    if (!title || !link)
      return res.status(400).json({ message: 'Title and link are required' });

    if (!link.includes('docs.google.com'))
      return res.status(400).json({ message: 'Invalid Google Docs link' });

    const googleDoc = new GoogleDoc({
      title,
      link,
      createdBy: req.user.userId,
    });

    await googleDoc.save();
    res.status(201).json({ message: 'Google Doc link added', googleDoc });
  } catch (err) {
    console.error('Google Docs add error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get all Google Docs links
router.get('/google-docs', authMiddleware, async (req, res) => {
  try {
    const docs = await GoogleDoc.find()
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 });

    res.json({ docs });
  } catch (err) {
    console.error('Fetch Google Docs error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get single Google Doc by ID
router.get('/google-docs/:id', authMiddleware, async (req, res) => {
  try {
    const doc = await GoogleDoc.findById(req.params.id).populate('createdBy', 'username email');
    if (!doc) return res.status(404).json({ message: 'Google Doc not found' });

    res.json({ doc });
  } catch (err) {
    console.error('Fetch single Google Doc error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
