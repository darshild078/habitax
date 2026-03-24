const mongoose = require("mongoose");

const groupLogSchema = new mongoose.Schema({
  groupHabitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "GroupHabit",
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ["done", "missed"],
    default: "done"
  }
}, { timestamps: true });

// One log per member per group per day
groupLogSchema.index({ groupHabitId: 1, date: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("GroupLog", groupLogSchema);
