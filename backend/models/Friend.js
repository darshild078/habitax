const mongoose = require("mongoose");

const friendSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending"
  }
}, { timestamps: true });

// One request per pair
friendSchema.index({ requester: 1, recipient: 1 }, { unique: true });
// Fast lookup: all friendships for a user
friendSchema.index({ recipient: 1, status: 1 });

module.exports = mongoose.model("Friend", friendSchema);
