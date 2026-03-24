const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    unique: true
  },
  password: String,

  // Phase 2: Energy Orb wallet (current balance — goes up and down)
  energyOrbs: { type: Number, default: 0 },

  // Phase 3: Lifetime stats
  totalOrbsEarned:    { type: Number, default: 0 },
  lastStreakLostDate:  { type: Date,   default: null },
  lastStreakLostHabit: { type: String, default: null },

  // Phase 4: Social economy
  streakShields: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);