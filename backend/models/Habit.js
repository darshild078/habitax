const mongoose = require("mongoose");

const habitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  name: String,
  costPerUse: Number,
  frequencyType: {
    type: String,
    enum: ["daily", "weekly", "monthly"]
  },
  frequencyValue: Number,
  timePerUse: Number, // in minutes

  // ── Phase 1: Streak tracking ──────────────────────────────────
  currentStreak:  { type: Number, default: 0 },
  longestStreak:  { type: Number, default: 0 },
  lastLoggedDate: { type: Date,   default: null }
}, { timestamps: true });

module.exports = mongoose.model("Habit", habitSchema);