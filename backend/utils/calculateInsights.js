const HabitLog = require('../models/HabitLog');
const Habit = require('../models/Habit');
const Insights = require('../models/Insights');

/**
 * Helper: Get ISO week and year
 */
function getWeekKey(date) {
  const d = new Date(date);
  const dayNum = (d.getUTCDay() + 6) % 7; // Mon = 0
  d.setUTCDate(d.getUTCDate() - dayNum);
  const weekStart = new Date(d);
  const year = weekStart.getUTCFullYear();
  const wp = Math.floor((weekStart - new Date(year, 0, 4)) / 86400000);
  const week = Math.floor((wp + (new Date(year, 0, 4).getUTCDay() || 7) - 1) / 7) + 1;
  return `${year}-W${String(week).padStart(2, '0')}`;
}

/**
 * Helper: Get day name from date
 */
function getDayName(date) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date(date).getDay()];
}

/**
 * Helper: Get hour range (e.g., "19:00-21:00")
 */
function getHourRange(date) {
  const hour = new Date(date).getHours();
  const start = String(hour).padStart(2, '0') + ':00';
  const end = String((hour + 1) % 24).padStart(2, '0') + ':00';
  return `${start}-${end}`;
}

/**
 * Calculate insights for a user's habit over 4-week period
 */
async function calculateInsights(userId, habitId) {
  try {
    // Get habit details
    const habit = await Habit.findById(habitId);
    if (!habit) return null;

    // Get last 4 weeks of logs
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const logs = await HabitLog.find({
      userId,
      habitId,
      date: { $gte: fourWeeksAgo },
    }).sort({ date: 1 });

    if (!logs || logs.length === 0) {
      return null; // Not enough data
    }

    // ────────────────────────────────────
    // 1. COMPLETION RATE & TREND
    // ────────────────────────────────────

    const thisWeekKey = getWeekKey(new Date());
    const lastWeekStart = new Date();
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekKey = getWeekKey(lastWeekStart);

    const thisWeekLogs = logs.filter(l => getWeekKey(l.date) === thisWeekKey);
    const lastWeekLogs = logs.filter(l => getWeekKey(l.date) === lastWeekKey);

    const thisWeekCompletion = thisWeekLogs.length;
    const lastWeekCompletion = lastWeekLogs.length;

    // Assume 1 log per day (for simplicity)
    const thisWeekTarget = 7;
    const lastWeekTarget = 7;

    const thisWeekRate = thisWeekCompletion / thisWeekTarget;
    const lastWeekRate = lastWeekCompletion / lastWeekTarget;

    let trend = 'stable';
    if (thisWeekRate > lastWeekRate + 0.15) trend = 'improving';
    else if (thisWeekRate < lastWeekRate - 0.15) trend = 'declining';

    // ────────────────────────────────────
    // 2. TIME PATTERNS (best/worst times)
    // ────────────────────────────────────

    const timeFrequency = {};
    logs.forEach(log => {
      const hourRange = getHourRange(log.date);
      timeFrequency[hourRange] = (timeFrequency[hourRange] || 0) + 1;
    });

    const bestTime = Object.keys(timeFrequency).reduce((a, b) =>
      timeFrequency[a] > timeFrequency[b] ? a : b
    );

    // ────────────────────────────────────
    // 3. DAY PATTERNS (strong/weak days)
    // ────────────────────────────────────

    const dayFrequency = {};
    logs.forEach(log => {
      const dayName = getDayName(log.date);
      dayFrequency[dayName] = (dayFrequency[dayName] || 0) + 1;
    });

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const daysSorted = days.sort((a, b) => (dayFrequency[b] || 0) - (dayFrequency[a] || 0));

    const strongDays = daysSorted.slice(0, 2).filter(d => dayFrequency[d] >= 2);
    const worstDay = daysSorted[daysSorted.length - 1];
    const weakDays = daysSorted.slice(-2).filter(d => (dayFrequency[d] || 0) < 3);

    // ────────────────────────────────────
    // 4. FAILURE RISK PREDICTION
    // ────────────────────────────────────

    const lastLog = logs[logs.length - 1];
    const daysSinceLastCompletion = Math.floor(
      (new Date() - new Date(lastLog.date)) / (1000 * 60 * 60 * 24)
    );

    let failureRisk = 0;
    if (daysSinceLastCompletion > 2) failureRisk += 0.3; // Missed 2+ days
    if (thisWeekRate < 0.5) failureRisk += 0.4; // Low completion rate
    if (trend === 'declining') failureRisk += 0.2; // Trending down

    failureRisk = Math.min(failureRisk, 0.95); // Cap at 95%

    // ────────────────────────────────────
    // 5. BEHAVIOR TAG
    // ────────────────────────────────────

    let tag = 'stable';
    let tagConfidence = 0.7;

    if (trend === 'improving' && thisWeekRate > 0.75) {
      tag = 'improving';
      tagConfidence = 0.9;
    } else if (thisWeekRate > 0.9) {
      tag = 'focused';
      tagConfidence = 0.95;
    } else if (trend === 'declining' || (strongDays.length === 0 && weakDays.length > 0)) {
      tag = 'inconsistent';
      tagConfidence = 0.8;
    }

    // ────────────────────────────────────
    // 6. MILESTONE PREDICTION
    // ────────────────────────────────────

    // Calculate current streak
    let currentStreak = 0;
    for (let i = logs.length - 1; i >= 0; i--) {
      const logDate = new Date(logs[i].date);
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - (logs.length - 1 - i));

      const sameDay =
        logDate.getFullYear() === expectedDate.getFullYear() &&
        logDate.getMonth() === expectedDate.getMonth() &&
        logDate.getDate() === expectedDate.getDate();

      if (sameDay) currentStreak++;
      else break;
    }

    const milestoneChances = new Map();
    const milestones = { '7day': 7, '14day': 14, '21day': 21, '30day': 30 };

    for (const [name, days] of Object.entries(milestones)) {
      if (currentStreak >= days) {
        milestoneChances.set(name, 1.0); // Already achieved
      } else {
        const daysNeeded = days - currentStreak;
        // If failureRisk is 0.2, chance of hitting it is 0.8
        const probability = Math.pow(1 - failureRisk, daysNeeded);
        milestoneChances.set(name, Math.max(probability, 0.1));
      }
    }

    const nextMilestone = Object.entries(milestones).find(([name, days]) => currentStreak < days);
    const nextMilestoneData = nextMilestone ? {
      target: nextMilestone[0],
      daysUntil: nextMilestone[1] - currentStreak,
      probability: milestoneChances.get(nextMilestone[0]),
    } : null;

    // ────────────────────────────────────
    // 7. SUGGESTED ACTIONS
    // ────────────────────────────────────

    let suggestedAction = null;
    let suggestedReminder = {
      time: bestTime.split('-')[0],
      reason: 'your_best_time',
    };

    if (failureRisk > 0.6) {
      suggestedReminder.reason = 'escalation';
      suggestedAction = 'nudge_friend_for_accountability';
    } else if (weekDays.length > 2 && strongDays.length > 0) {
      suggestedAction = 'focus_on_weak_days';
    } else if (currentStreak > 0 && nextMilestoneData && nextMilestoneData.probability > 0.7) {
      suggestedAction = 'you_can_hit_milestone';
    }

    // ────────────────────────────────────
    // 8. CREATE/UPDATE INSIGHTS RECORD
    // ────────────────────────────────────

    const week = getWeekKey(new Date());

    let insights = await Insights.findOne({ userId, habitId, week });

    if (!insights) {
      insights = new Insights({
        userId,
        habitId,
        week,
      });
    }

    Object.assign(insights, {
      completionRate: thisWeekRate,
      completionCount: thisWeekCompletion,
      targetCount: thisWeekTarget,
      trend,
      bestTime,
      worstDay,
      strongDays,
      weakDays,
      failureRisk: parseFloat(failureRisk.toFixed(2)),
      milestoneChances,
      tag,
      tagConfidence,
      suggestedReminder,
      suggestedAction,
      currentStreak,
      nextMilestone: nextMilestoneData,
      computedAt: new Date(),
    });

    await insights.save();
    return insights;
  } catch (err) {
    console.error('Error calculating insights:', err);
    return null;
  }
}

/**
 * Get all insights for user (latest computed)
 */
async function getUserInsights(userId) {
  try {
    const insights = await Insights.find({ userId }).sort({ computedAt: -1 }).limit(10);
    return insights;
  } catch (err) {
    console.error('Error fetching insights:', err);
    return [];
  }
}

module.exports = {
  calculateInsights,
  getUserInsights,
  getWeekKey,
};
