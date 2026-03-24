const express = require('express');
const auth = require('../middleware/authMiddleware');
const {
  getInsightsSummary,
  getHabitInsights,
  refreshInsights,
} = require('../controllers/insightController');

const router = express.Router();

// All routes protected and require auth
router.use(auth);

// GET user's insights summary
router.get('/summary', getInsightsSummary);

// GET insights for specific habit
router.get('/habit/:habitId', getHabitInsights);

// POST refresh insights (manual trigger)
router.post('/refresh', refreshInsights);

module.exports = router;
