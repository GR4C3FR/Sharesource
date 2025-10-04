const express = require('express');
const path = require('path');
const fs = require('fs');
const File = require('../models/File');
const upload = require('../middleware/upload');
const { authMiddleware } = require('../routes/userRoutes');

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
        res.json({ files });
    } catch (err) {
        console.error('Fetch files error:', err);
        res.status(500).json({ message: err.message });
    }
});

// list authenticated user's files
router.get('/my', authMiddleware, async (req, res) => {
    try {
        const files = await File.find()
        .populate('user', 'username email')
        .populate('subject', 'name')
        .sort({ uploadDate: -1 });
        res.json({ files });
    } catch (err) {
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

        const isOwner = file.user.toString() === req.user.userId;
        if (!isOwner) return res.status(403).json({ message: 'Forbidden '});

        //remove file from disk
        fs.unlinkSync(path.resolve(file.path));

        await file.remove();
        res.json({ message: 'File deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;