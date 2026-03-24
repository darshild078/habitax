const mongoose = require("mongoose");

const groupHabitSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  // Active members (includes creator)
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  // Pending invitations
  invites: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["pending", "accepted", "declined"], default: "pending" }
  }],
  groupStreak: { type: Number, default: 0 },
  // Last date the penalty/streak check was performed (UTC midnight)
  lastCheckedDate: { type: Date, default: null },
}, { timestamps: true });

groupHabitSchema.index({ members: 1 });
groupHabitSchema.index({ "invites.userId": 1, "invites.status": 1 });

module.exports = mongoose.model("GroupHabit", groupHabitSchema);
