const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
filename: { type: String, required: true },
originalName: { type: String, required: true },
mimetype: { type: String },
size: { type: Number },
path: { type: String, required: true },
uploadDate: { type: Date, default: Date.now },
// optional fields to keep parity with your notes (if you want to later map comments/ratings)
title: { type: String },
description: { type: String },
subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
});

module.exports = mongoose.model('File', fileSchema);