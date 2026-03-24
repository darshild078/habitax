const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { getLeaderboard, getFeed, buyShield } = require("../controllers/socialController");

router.get("/leaderboard", auth, getLeaderboard);
router.get("/feed", auth, getFeed);
router.post("/buy-shield", auth, buyShield);

module.exports = router;
