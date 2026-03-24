const Habit    = require("../models/Habit");
const HabitLog = require("../models/HabitLog");
const User     = require("../models/User");
const { calculateStreak, toUTCMidnight } = require("../utils/streakCalculator");
const { checkStreakAchievements, checkOrbAchievements } = require("../utils/achievementChecker");

// ── Streak milestone bonus map ──────────────────────────────
const STREAK_MILESTONES = {
  7:   3,
  14:  5,
  30:  10,
  60:  20,
  100: 50,
};

// ─────────────────────────────────────────────────────────────
// POST /api/logs/mark/:habitId
// ─────────────────────────────────────────────────────────────
exports.markDone = async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.habitId);

    if (!habit) return res.status(404).json({ msg: "Habit not found" });
    if (habit.userId.toString() !== req.user)
      return res.status(401).json({ msg: "Unauthorized" });

    const result = calculateStreak(habit);

    if (result.alreadyLogged) {
      const user = await User.findById(req.user).select("energyOrbs");
      return res.status(409).json({
        msg: "Already logged today",
        energyOrbs: user?.energyOrbs ?? 0
      });
    }

    const { currentStreak, longestStreak, todayUTC, streakBroken, previousStreak } = result;

    // ── Phase 3: Record streak loss ──
    if (streakBroken && previousStreak > 0) {
      await User.findByIdAndUpdate(req.user, {
        lastStreakLostDate: new Date(),
        lastStreakLostHabit: habit.name
      });
    }

    // ── Milestone bonus ──
    const milestoneBonus = STREAK_MILESTONES[currentStreak] || 0;
    const orbsEarnedNow = 1 + milestoneBonus;

    // ── Persist log entry ──
    const log = await HabitLog.findOneAndUpdate(
      { habitId: habit._id, date: todayUTC },
      { userId: req.user, status: "done", orbEarned: orbsEarnedNow },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // ── Award orbs: energyOrbs (wallet) + totalOrbsEarned (lifetime) ──
    const updatedUser = await User.findByIdAndUpdate(
      req.user,
      { $inc: { energyOrbs: orbsEarnedNow, totalOrbsEarned: orbsEarnedNow } },
      { new: true, select: "energyOrbs totalOrbsEarned" }
    );

    // ── Update habit streak fields ──
    habit.currentStreak  = currentStreak;
    habit.longestStreak  = longestStreak;
    habit.lastLoggedDate = todayUTC;
    await habit.save();

    // ── Phase 3: Check achievements (async, non-blocking) ──
    const [streakAch, orbAch] = await Promise.all([
      checkStreakAchievements(req.user, currentStreak),
      checkOrbAchievements(req.user, updatedUser.totalOrbsEarned)
    ]);
    const newAchievements = [...streakAch, ...orbAch];

    // ── Build response ──
    const response = {
      msg: milestoneBonus > 0
        ? `${currentStreak}-day streak! +${orbsEarnedNow} Energy Orbs!`
        : "You earned an Energy Orb!",
      currentStreak,
      longestStreak,
      energyOrbs: updatedUser.energyOrbs,
      log
    };

    if (milestoneBonus > 0) {
      response.milestone = {
        streak: currentStreak,
        bonusOrbs: milestoneBonus,
        totalEarned: orbsEarnedNow
      };
    }

    if (newAchievements.length > 0) {
      response.newAchievements = newAchievements.map(a => ({
        key: a.key,
        label: a.label,
        description: a.description
      }));
    }

    res.json(response);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ msg: "Already logged today" });
    }
    res.status(500).json({ error: err.message });
  }
};



// ─────────────────────────────────────────────────────────────
// GET /api/logs/history/:habitId?days=30
// Returns the last N days of logs for a habit (default 30).
// ─────────────────────────────────────────────────────────────
exports.getHistory = async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.habitId);
    if (!habit) return res.status(404).json({ msg: "Habit not found" });
    if (habit.userId.toString() !== req.user)
      return res.status(401).json({ msg: "Unauthorized" });

    const days = Math.min(parseInt(req.query.days) || 30, 365);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const logs = await HabitLog.find({
      habitId: habit._id,
      date: { $gte: toUTCMidnight(since) }
    }).sort({ date: -1 });

    res.json({
      habitId: habit._id,
      name: habit.name,
      currentStreak: habit.currentStreak,
      longestStreak: habit.longestStreak,
      logs
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/logs/today
// Returns all user habits with a doneToday boolean.
// Used by TrackerScreen on load.
// ─────────────────────────────────────────────────────────────
exports.getTodayStatus = async (req, res) => {
  try {
    const todayUTC = toUTCMidnight(new Date());

    const habits = await Habit.find({ userId: req.user });

    // Batch-fetch today's logs for all habits in one query
    const habitIds = habits.map(h => h._id);
    const todayLogs = await HabitLog.find({
      userId: req.user,
      date: todayUTC,
      habitId: { $in: habitIds }
    });

    // Build a Set of logged habitIds for O(1) lookup
    const loggedSet = new Set(todayLogs.map(l => l.habitId.toString()));

    const result = habits.map(h => ({
      _id:            h._id,
      name:           h.name,
      currentStreak:  h.currentStreak,
      longestStreak:  h.longestStreak,
      lastLoggedDate: h.lastLoggedDate,
      doneToday:      loggedSet.has(h._id.toString())
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
