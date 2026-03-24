const Insights = require('../models/Insights');
const { calculateInsights, getUserInsights } = require('../utils/calculateInsights');

/**
 * GET /insights/summary
 * Get insights summary for user (all their habits)
 */
const getInsightsSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all latest insights for user's habits
    const insights = await getUserInsights(userId);

    if (!insights || insights.length === 0) {
      return res.json({
        msg: 'No insights available yet. Keep logging to see patterns!',
        insights: [],
      });
    }

    // Pick top 3 most actionable insights
    const topInsights = insights
      .sort((a, b) => {
        // Prioritize by failure risk + actionability
        const scoreA = a.failureRisk + (a.suggestedAction ? 1 : 0);
        const scoreB = b.failureRisk + (b.suggestedAction ? 1 : 0);
        return scoreB - scoreA;
      })
      .slice(0, 3);

    res.json({
      summary: {
        totalHabits: insights.length,
        averageCompletion: (
          insights.reduce((sum, i) => sum + i.completionRate, 0) / insights.length
        ).toFixed(2),
        mostInconsistent: insights.find(i => i.tag === 'inconsistent'),
        mostFocused: insights.find(i => i.tag === 'focused'),
      },
      insights: topInsights,
    });
  } catch (err) {
    console.error('Error getting insights:', err);
    res.status(500).json({ msg: 'Failed to get insights' });
  }
};

/**
 * GET /insights/habit/:habitId
 * Get insights for specific habit
 */
const getHabitInsights = async (req, res) => {
  try {
    const userId = req.user.id;
    const { habitId } = req.params;

    let insights = await Insights.findOne({
      userId,
      habitId,
    }).sort({ computedAt: -1 });

    // If no recent insights, calculate fresh
    if (!insights) {
      insights = await calculateInsights(userId, habitId);
    }

    if (!insights) {
      return res.status(404).json({ msg: 'Not enough data for insights yet' });
    }

    res.json(insights);
  } catch (err) {
    console.error('Error getting habit insights:', err);
    res.status(500).json({ msg: 'Failed to get habit insights' });
  }
};

/**
 * POST /insights/refresh
 * Manually trigger insights calculation
 */
const refreshInsights = async (req, res) => {
  try {
    const userId = req.user.id;
    const { habitId } = req.body;

    if (!habitId) {
      return res.status(400).json({ msg: 'habitId required' });
    }

    const insights = await calculateInsights(userId, habitId);

    if (!insights) {
      return res.status(404).json({ msg: 'Failed to calculate insights' });
    }

    res.json({
      msg: 'Insights refreshed',
      insights,
    });
  } catch (err) {
    console.error('Error refreshing insights:', err);
    res.status(500).json({ msg: 'Failed to refresh insights' });
  }
};

module.exports = {
  getInsightsSummary,
  getHabitInsights,
  refreshInsights,
};
