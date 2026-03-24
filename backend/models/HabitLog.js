const mongoose = require("mongoose");

/**
 * HabitLog — one document per habit per day.
 * date is always stored as UTC midnight so comparisons are timezone-safe.
 */
const habitLogSchema = new mongoose.Schema({
  habitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Habit",
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  // Normalized to UTC midnight — e.g. 2026-03-24T00:00:00.000Z
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ["done", "skipped"],
    default: "done"
  },
  // Phase 2: orb awarded for this log entry (0 or 1)
  orbEarned: { type: Number, default: 0 }
}, { timestamps: true });

// Compound index: fast history queries per habit sorted by most recent
habitLogSchema.index({ habitId: 1, date: -1 });

// Unique constraint: one log per habit per day (prevents duplicates at DB level)
habitLogSchema.index({ habitId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("HabitLog", habitLogSchema);
