const express = require("express");
const router = express.Router();
const { addHabit, getHabits, getDashboard } = require("../controllers/habitController");
const auth = require("../middleware/authMiddleware");

router.post("/add", auth, addHabit);
router.get("/get", auth, getHabits);
router.get("/dashboard", auth, getDashboard)

module.exports = router;