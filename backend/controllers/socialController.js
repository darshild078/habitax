const User       = require("../models/User");
const Friend     = require("../models/Friend");
const Activity   = require("../models/Activity");
const Habit      = require("../models/Habit");
const HabitLog   = require("../models/HabitLog");
const { toUTCMidnight } = require("../utils/streakCalculator");

// ─────────────────────────────────────────────────────────────
// GET /api/social/leaderboard — Weekly ranking (friends + self)
// Ranks by: orbs earned this week > best streak > total orbs
// ─────────────────────────────────────────────────────────────
exports.getLeaderboard = async (req, res) => {
  try {
    // Get friend IDs
    const friendships = await Friend.find({
      status: "accepted",
      $or: [{ requester: req.user }, { recipient: req.user }]
    });

    const friendIds = friendships.map(f =>
      f.requester.toString() === req.user ? f.recipient : f.requester
    );

    // Include self
    const userIds = [req.user, ...friendIds];

    // Get weekly orbs from logs
    const weekAgo = toUTCMidnight(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    const weeklyLogs = await HabitLog.aggregate([
      { $match: { userId: { $in: userIds.map(id => require("mongoose").Types.ObjectId(id)) }, date: { $gte: weekAgo } } },
      { $group: { _id: "$userId", weeklyOrbs: { $sum: "$orbEarned" }, weeklyHabits: { $sum: 1 } } }
    ]);

    const weeklyMap = {};
    weeklyLogs.forEach(w => { weeklyMap[w._id.toString()] = w; });

    // Get user data
    const users = await User.find({ _id: { $in: userIds } })
      .select("name email energyOrbs totalOrbsEarned");

    // Get best streaks
    const habits = await Habit.find({ userId: { $in: userIds } });
    const streakMap = {};
    habits.forEach(h => {
      const uid = h.userId.toString();
      if (!streakMap[uid] || h.currentStreak > streakMap[uid]) {
        streakMap[uid] = h.currentStreak;
      }
    });

    // Build leaderboard
    const board = users.map(u => ({
      _id: u._id,
      name: u.name,
      totalOrbs: u.totalOrbsEarned,
      weeklyOrbs: weeklyMap[u._id.toString()]?.weeklyOrbs || 0,
      weeklyHabits: weeklyMap[u._id.toString()]?.weeklyHabits || 0,
      bestStreak: streakMap[u._id.toString()] || 0,
      isYou: u._id.toString() === req.user
    }));

    // Sort: weekly orbs desc → best streak desc → total orbs desc
    board.sort((a, b) =>
      b.weeklyOrbs - a.weeklyOrbs ||
      b.bestStreak - a.bestStreak ||
      b.totalOrbs - a.totalOrbs
    );

    // Assign ranks
    board.forEach((entry, i) => { entry.rank = i + 1; });

    res.json(board);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/social/feed — Activity feed (friends + self)
// ─────────────────────────────────────────────────────────────
exports.getFeed = async (req, res) => {
  try {
    const friendships = await Friend.find({
      status: "accepted",
      $or: [{ requester: req.user }, { recipient: req.user }]
    });

    const friendIds = friendships.map(f =>
      f.requester.toString() === req.user ? f.recipient : f.requester
    );

    const userIds = [req.user, ...friendIds];

    const feed = await Activity.find({ userId: { $in: userIds } })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("userId", "name");

    const formatted = feed.map(a => ({
      _id: a._id,
      userName: a.userId?.name || "Unknown",
      userId: a.userId?._id,
      type: a.type,
      data: a.data,
      createdAt: a.createdAt
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/social/buy-shield — Buy streak shield (10 orbs)
// ─────────────────────────────────────────────────────────────
const SHIELD_COST = 10;

exports.buyShield = async (req, res) => {
  try {
    const user = await User.findById(req.user);
    if (!user) return res.status(404).json({ msg: "User not found" });
    if (user.energyOrbs < SHIELD_COST)
      return res.status(400).json({ msg: `Need ${SHIELD_COST} orbs (you have ${user.energyOrbs})` });

    user.energyOrbs -= SHIELD_COST;
    user.streakShields += 1;
    await user.save();

    res.json({
      msg: "Streak Shield purchased!",
      energyOrbs: user.energyOrbs,
      streakShields: user.streakShields
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
