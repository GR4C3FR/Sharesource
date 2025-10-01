const express = require('express');
const Subject = require('../models/Subject');
const authMiddleware = require('../middleware/authMiddleware'); 

const router = express.Router();

// Get all subjects
router.get('/', authMiddleware, async (req, res) => {
  try {
    const subjects = await Subject.find();
    res.json({ subjects });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a subject (Admin only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "Admin") return res.status(403).json({ error: "Forbidden" });

    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Missing subject name" });

    const newSubject = new Subject({ name });
    await newSubject.save();
    res.status(201).json({ message: "Subject created", subject: newSubject });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a subject (Admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "Admin") 
      return res.status(403).json({ error: "Forbidden: Only Admin can delete subjects" });

    const subject = await Subject.findById(req.params.id);
    if (!subject) 
      return res.status(404).json({ error: "Subject not found" });

    await subject.deleteOne();
    res.json({ message: "Subject deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
