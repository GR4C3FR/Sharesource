const mongoose = require('mongoose');

const GoogleDocSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    link: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GoogleDoc', GoogleDocSchema);
