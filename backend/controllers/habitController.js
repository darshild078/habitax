const Habit = require("../models/Habit");

// ➕ Add Habit
exports.addHabit = async (req, res) => {
  try {
    const { name, costPerUse, frequencyType, frequencyValue, timePerUse } = req.body;

    const habit = await Habit.create({
      userId: req.user,
      name,
      costPerUse,
      frequencyType,
      frequencyValue,
      timePerUse
    });

    res.json(habit);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📊 Get All Habits for User
exports.getHabits = async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.user });
    res.json(habits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};