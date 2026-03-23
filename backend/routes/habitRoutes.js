const express = require("express");
const router = express.Router();
const { addHabit, getHabits, getDashboard, deleteHabit, updateHabit } = require("../controllers/habitController");
const auth = require("../middleware/authMiddleware");

router.post("/add", auth, addHabit);
router.get("/get", auth, getHabits);
router.get("/dashboard", auth, getDashboard);
router.delete("/delete/:id", auth, deleteHabit);
router.put("/update/:id", auth, updateHabit);

module.exports = router;