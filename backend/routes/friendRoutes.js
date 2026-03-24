const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  sendRequest, getRequests, respond, getFriends, removeFriend, getMyLink, acceptFriendLink
} = require("../controllers/friendController");

router.post("/request", auth, sendRequest);
router.get("/requests", auth, getRequests);
router.put("/respond", auth, respond);
router.get("/list", auth, getFriends);
router.get("/link", auth, getMyLink);
router.post("/accept-link", auth, acceptFriendLink);
router.delete("/:friendshipId", auth, removeFriend);

module.exports = router;
