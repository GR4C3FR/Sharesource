const express = require('express');
const path = require('path');
const fs = require('fs');
const File = require('../models/File');
const Comment = require('../models/Comment');
const Rating = require('../models/Rating');
const upload = require('../middleware/upload');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();


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
            .populate('user', 'username email')
            .populate('subject', 'name')
            .sort({ uploadDate: -1 });
            
        // ✅ map populated subject to subjectID for frontend compatibility
        const filesMapped = files.map((file) => {
        return {
            ...file._doc,             // keep all other fields
            subjectID: file.subject || null, // alias populated subject
        };
        });

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
        .populate('user', 'username email')
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

    // ✅ Correct ownership check
    const fileOwnerId = file.user._id ? file.user._id.toString() : file.user.toString();
    const isOwner = fileOwnerId === (req.user._id?.toString() || req.user.userId?.toString());
    if (!isOwner) return res.status(403).json({ message: 'Forbidden' });

    // 🧹 Remove file from disk safely
    try {
      fs.unlinkSync(path.resolve(file.path));
    } catch (err) {
      console.warn('⚠️ File not found on disk, skipping unlink:', file.path);
    }

    // 🧹 Delete associated comments & ratings
    await Promise.all([
      Comment.deleteMany({ fileId: file._id }),
      Rating.deleteMany({ fileId: file._id }),
    ]);

    // 🧹 Delete file record from DB
    await file.deleteOne();

    res.json({ message: 'File deleted successfully' });
  } catch (err) {
    console.error('Delete file error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;