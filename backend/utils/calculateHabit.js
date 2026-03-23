function calculateHabit(habit) {
    let yearlyUses = 0;
  
    if (habit.frequencyType === "daily") {
      yearlyUses = 365;
    } else if (habit.frequencyType === "weekly") {
      yearlyUses = habit.frequencyValue * 52;
    } else if (habit.frequencyType === "monthly") {
      yearlyUses = habit.frequencyValue * 12;
    }
  
    const yearlyCost = yearlyUses * habit.costPerUse;
    const monthlyCost = yearlyCost / 12;
    const dailyCost = yearlyCost / 365;
  
    const yearlyMinutes = yearlyUses * habit.timePerUse;
    const yearlyHours = yearlyMinutes / 60;
    const yearlyDays = yearlyHours / 24;
  
    return {
      yearlyCost: Math.round(yearlyCost),
      monthlyCost: Math.round(monthlyCost),
      dailyCost: Math.round(dailyCost),
      yearlyHours: Number(yearlyHours.toFixed(1)),
      yearlyDays: Number(yearlyDays.toFixed(1))
    };
  }
  
  module.exports = calculateHabit;