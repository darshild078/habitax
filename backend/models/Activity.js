const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  type: {
    type: String,
    enum: [
      "habit_done",
      "streak_milestone",
      "plant_evolved",
      "group_penalty",
      "achievement_unlocked",
      "friend_added",
      "group_joined",
      "group_completed"
    ],
    required: true
  },
  // Flexible data payload per event type
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

// Feed query: recent activities for a set of user IDs
activitySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Activity", activitySchema);
