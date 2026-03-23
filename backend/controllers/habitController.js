const Habit = require("../models/Habit");
const calculateHabit = require("../utils/calculateHabit");
const generateInsight = require("../utils/generateInsight");

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
  
      const result = habits.map(habit => {
        const calculations = calculateHabit(habit);
        const insight = generateInsight(
            habit.name,
            calculations.yearlyCost,
            calculations.yearlyDays
          );
  
        return {
          ...habit._doc,
          ...calculations,
          insight
        };
      });
  
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };