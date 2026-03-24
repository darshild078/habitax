const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  createGroup, getGroups, respondInvite, markGroupDone, nudgeMember
} = require("../controllers/groupController");

router.post("/create", auth, createGroup);
router.get("/", auth, getGroups);
router.put("/respond-invite", auth, respondInvite);
router.post("/mark/:groupHabitId", auth, markGroupDone);
router.post("/nudge", auth, nudgeMember);

module.exports = router;
