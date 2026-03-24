const mongoose = require('mongoose');

const InsightsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    habitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Habit',
      required: true,
    },

    // Week identifier (YYYY-WW format)
    week: String,

    // Metrics
    completionRate: Number, // 0-1 (0.86 = 86%)
    completionCount: Number, // how many days completed this week
    targetCount: Number, // total habit targets this week
    trend: String, // "improving", "stable", "declining"

    // Pattern detection
    bestTime: String, // "19:00-21:00" or null
    worstDay: String, // "Monday", "Tuesday", etc.
    strongDays: [String], // ["Monday", "Friday"]
    weakDays: [String], // ["Wednesday", "Sunday"]

    // Predictions
    failureRisk: Number, // 0-1 (0.15 = 15% chance to break streak)
    milestoneChances: {
      // key: "21day", value: probability
      type: Map,
      of: Number,
    },

    // Behavior tag
    tag: String, // "improving", "stable", "declining", "inconsistent", "focused"
    tagConfidence: Number, // 0-1

    // Suggested actions
    suggestedReminder: {
      time: String, // "19:00" format
      reason: String, // "your_best_time", "recovery", "escalation"
    },
    suggestedAction: String, // "invite_friend_to_group", "focus_on_weak_day", etc.

    // Milestone progress
    currentStreak: Number,
    nextMilestone: {
      target: String, // "21day", "30day", "100day"
      daysUntil: Number,
      probability: Number, // likelihood of hitting it
    },

    // Metadata
    computedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for fast lookups
InsightsSchema.index({ userId: 1, habitId: 1, week: 1 });
InsightsSchema.index({ userId: 1, computedAt: -1 });

module.exports = mongoose.model('Insights', InsightsSchema);
