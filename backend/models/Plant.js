const mongoose = require("mongoose");

/**
 * Stage thresholds (cumulative orbs invested):
 *   seed  →  bush  = 5 orbs
 *   bush  →  tree  = 15 orbs  (i.e. 15 total invested, not 10 more)
 *
 * Exported so the controller can import it without circular deps.
 */
const STAGE_THRESHOLDS = {
  seed: 5,   // orbsInvested >= 5  → upgrade to bush
  bush: 15,  // orbsInvested >= 15 → upgrade to tree
  tree: null // max stage
};

const plantSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  // e.g. "focus_tree", "discipline_tree", "calm_tree"
  type: {
    type: String,
    required: true,
    default: "focus_tree"
  },
  stage: {
    type: String,
    enum: ["seed", "bush", "tree"],
    default: "seed"
  },
  // Total orbs the user has invested into this plant
  orbsInvested: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Fast lookup: all plants for a user sorted by newest
plantSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Plant", plantSchema);
module.exports.STAGE_THRESHOLDS = STAGE_THRESHOLDS;
