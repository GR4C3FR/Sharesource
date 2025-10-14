const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true }
}, { strict: "throw" });

const Subject = mongoose.model('Subject', subjectSchema, 'subjects');
module.exports = Subject;
