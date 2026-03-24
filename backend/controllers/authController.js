const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Habit = require("../models/Habit");
const Plant = require("../models/Plant");
const HabitLog = require("../models/HabitLog");
const Achievement = require("../models/Achievement");
const { computeLevel, computeDisciplineType } = require("../utils/profileComputer");
const { toUTCMidnight } = require("../utils/streakCalculator");

exports.registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ msg: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.json({ msg: "User registered" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/auth/profile
// Returns full identity payload — single call for the entire
// Profile screen. Computes level, discipline, stats on the fly.
// ─────────────────────────────────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found" });

    // ── Fetch all user data in parallel ──
    const [habits, plants, achievements, weeklyLogs] = await Promise.all([
      Habit.find({ userId: req.user }),
      Plant.find({ userId: req.user }),
      Achievement.find({ userId: req.user }).sort({ unlockedAt: -1 }),
      // Weekly stats: logs from last 7 days
      HabitLog.find({
        userId: req.user,
        date: { $gte: toUTCMidnight(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) }
      })
    ]);

    // ── Compute level ──
    const level = computeLevel(user.totalOrbsEarned || 0);

    // ── Compute discipline type (based on best current streak) ──
    const bestCurrentStreak = habits.length > 0
      ? Math.max(...habits.map(h => h.currentStreak || 0))
      : 0;
    const bestLongestStreak = habits.length > 0
      ? Math.max(...habits.map(h => h.longestStreak || 0))
      : 0;
    const disciplineType = computeDisciplineType(bestCurrentStreak);

    // ── Plant stats ──
    const totalTrees  = plants.filter(p => p.stage === "tree").length;
    const totalPlants = plants.length;

    // ── Weekly stats ──
    const weeklyHabitsCompleted = weeklyLogs.length;
    const weeklyOrbsEarned = weeklyLogs.reduce((sum, l) => sum + (l.orbEarned || 0), 0);

    // ── Streak loss info ──
    const streakLoss = user.lastStreakLostDate
      ? {
          date: user.lastStreakLostDate,
          habitName: user.lastStreakLostHabit || "Unknown"
        }
      : null;

    res.json({
      // Basic profile
      _id: user._id,
      name: user.name,
      email: user.email,
      energyOrbs: user.energyOrbs,
      totalOrbsEarned: user.totalOrbsEarned || 0,
      createdAt: user.createdAt,

      // Computed identity
      level,
      disciplineType,

      // Stats
      stats: {
        bestCurrentStreak: bestCurrentStreak,
        bestLongestStreak: bestLongestStreak,
        totalTrees,
        totalPlants,
        totalHabits: habits.length,
        weeklyHabitsCompleted,
        weeklyOrbsEarned,
      },

      // Streak loss
      streakLoss,

      // Achievements
      achievements: achievements.map(a => ({
        key: a.key,
        label: a.label,
        description: a.description,
        unlockedAt: a.unlockedAt
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/auth/profile — update name, email, and/or password
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user);
    if (!user) return res.status(404).json({ msg: "User not found" });

    // Update name
    if (name) user.name = name;

    // Update email (check not already taken by someone else)
    if (email && email !== user.email) {
      const taken = await User.findOne({ email });
      if (taken) return res.status(400).json({ msg: "Email already in use" });
      user.email = email;
    }

    // Update password (requires current password verification)
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ msg: "Current password required" });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: "Current password is incorrect" });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ msg: "New password must be at least 6 characters" });
      }
      user.password = await bcrypt.hash(newPassword, 10);
    }

    await user.save();

    res.json({
      msg: "Profile updated",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /api/auth/account
// Permanently delete the user and ALL their data.
// Requires password confirmation for safety.
// ─────────────────────────────────────────────────────────────
exports.deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ msg: "Password required to delete account" });

    const user = await User.findById(req.user);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Incorrect password" });

    // Cascade delete all user data
    await Promise.all([
      Habit.deleteMany({ userId: req.user }),
      HabitLog.deleteMany({ userId: req.user }),
      Plant.deleteMany({ userId: req.user }),
      Achievement.deleteMany({ userId: req.user }),
      User.findByIdAndDelete(req.user)
    ]);

    res.json({ msg: "Account deleted permanently" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};