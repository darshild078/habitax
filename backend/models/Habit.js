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
  timePerUse: Number // in minutes
}, { timestamps: true });

module.exports = mongoose.model("Habit", habitSchema);