const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true }, 
  ownerUserID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subjectID: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true }, 
  dateCreated: { type: Date, default: Date.now },
  lastEditedDate: { type: Date, default: Date.now }
}, { strict: "throw" });

const Note = mongoose.model('Note', noteSchema, 'notes');
module.exports = Note;
