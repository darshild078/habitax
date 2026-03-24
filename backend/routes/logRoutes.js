const express = require("express");
const router  = express.Router();
const { markDone, getHistory, getTodayStatus } = require("../controllers/logController");
const auth = require("../middleware/authMiddleware");

// Mark a habit done for today
router.post("/mark/:habitId", auth, markDone);

// Get log history for a habit (optional ?days=N query param)
router.get("/history/:habitId", auth, getHistory);

// Get all habits with today's completion status
router.get("/today", auth, getTodayStatus);

module.exports = router;
