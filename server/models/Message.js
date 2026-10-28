const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sticker_id: { type: String, required: true, trim: true },
    msg_id: { type: String, required: true, trim: true },
    optional_id: { type: String, default: '', trim: true },
    status: {
      type: String,
      enum: ['slot', 'displaying', 'completed'],
      default: 'slot',
      index: true,
    },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
