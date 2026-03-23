const express = require("express");
const router = express.Router();
const { addHabit, getHabits } = require("../controllers/habitController");
const auth = require("../middleware/authMiddleware");

router.post("/add", auth, addHabit);
router.get("/get", auth, getHabits);

module.exports = router;