const mongoose = require("mongoose");

const achievementSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  key: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  unlockedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Unique: one achievement per user per key
achievementSchema.index({ userId: 1, key: 1 }, { unique: true });

module.exports = mongoose.model("Achievement", achievementSchema);
