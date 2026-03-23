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

  exports.deleteHabit = async (req, res) => {
    try {
      const habit = await Habit.findById(req.params.id);
  
      if (!habit) return res.status(404).json({ msg: "Habit not found" });
  
      // Ensure user owns this habit
      if (habit.userId.toString() !== req.user) {
        return res.status(401).json({ msg: "Unauthorized" });
      }
  
      await habit.deleteOne();
  
      res.json({ msg: "Habit deleted successfully" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  exports.updateHabit = async (req, res) => {
    try {
      const habit = await Habit.findById(req.params.id);
  
      if (!habit) return res.status(404).json({ msg: "Habit not found" });
  
      // Ownership check
      if (habit.userId.toString() !== req.user) {
        return res.status(401).json({ msg: "Unauthorized" });
      }
  
      const updatedHabit = await Habit.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
  
      res.json(updatedHabit);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

exports.getDashboard = async (req, res) => {
    try {
      const habits = await Habit.find({ userId: req.user });
  
      let totalYearlyCost = 0;
      let totalHours = 0;
  
      let worstHabit = null;
      let maxCost = 0;
  
      habits.forEach(habit => {
        const calc = calculateHabit(habit);
  
        totalYearlyCost += calc.yearlyCost;
        totalHours += calc.yearlyHours;
  
        if (calc.yearlyCost > maxCost) {
          maxCost = calc.yearlyCost;
          worstHabit = {
            name: habit.name,
            yearlyCost: calc.yearlyCost
          };
        }
      });
  
      const totalMonthlyCost = Math.round(totalYearlyCost / 12);
      const totalDaysLost = Number((totalHours / 24).toFixed(1));
  
      res.json({
        totalYearlyCost: Math.round(totalYearlyCost),
        totalMonthlyCost,
        totalHoursLost: Number(totalHours.toFixed(1)),
        totalDaysLost,
        worstHabit
      });
  
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };