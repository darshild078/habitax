const User   = require("../models/User");
const Friend = require("../models/Friend");
const Activity = require("../models/Activity");

// ─────────────────────────────────────────────────────────────
// POST /api/friends/request  — Send friend request by email
// ─────────────────────────────────────────────────────────────
exports.sendRequest = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ msg: "Email is required" });

    const recipient = await User.findOne({ email: email.toLowerCase().trim() });
    if (!recipient) return res.status(404).json({ msg: "No user found with that email" });
    if (recipient._id.toString() === req.user)
      return res.status(400).json({ msg: "Cannot add yourself" });

    // Check if friendship already exists in either direction
    const existing = await Friend.findOne({
      $or: [
        { requester: req.user, recipient: recipient._id },
        { requester: recipient._id, recipient: req.user }
      ]
    });

    if (existing) {
      if (existing.status === "accepted") return res.status(400).json({ msg: "Already friends" });
      if (existing.status === "pending") return res.status(400).json({ msg: "Request already pending" });
      // If rejected, allow re-request by updating
      existing.status = "pending";
      existing.requester = req.user;
      existing.recipient = recipient._id;
      await existing.save();
      return res.json({ msg: "Friend request re-sent" });
    }

    await Friend.create({ requester: req.user, recipient: recipient._id });
    res.status(201).json({ msg: "Friend request sent" });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ msg: "Request already exists" });
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/friends/requests  — Pending incoming requests
// ─────────────────────────────────────────────────────────────
exports.getRequests = async (req, res) => {
  try {
    const requests = await Friend.find({ recipient: req.user, status: "pending" })
      .populate("requester", "name email")
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PUT /api/friends/respond  — Accept or reject
// ─────────────────────────────────────────────────────────────
exports.respond = async (req, res) => {
  try {
    const { friendshipId, action } = req.body;
    if (!["accepted", "rejected"].includes(action))
      return res.status(400).json({ msg: "Action must be 'accepted' or 'rejected'" });

    const friendship = await Friend.findById(friendshipId);
    if (!friendship) return res.status(404).json({ msg: "Request not found" });
    if (friendship.recipient.toString() !== req.user)
      return res.status(401).json({ msg: "Not your request" });

    friendship.status = action;
    await friendship.save();

    if (action === "accepted") {
      // Post activity for both
      await Activity.insertMany([
        { userId: friendship.requester, type: "friend_added", data: { friendId: req.user } },
        { userId: req.user, type: "friend_added", data: { friendId: friendship.requester } }
      ]);
    }

    res.json({ msg: `Request ${action}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/friends/list  — All accepted friends
// ─────────────────────────────────────────────────────────────
exports.getFriends = async (req, res) => {
  try {
    const friendships = await Friend.find({
      status: "accepted",
      $or: [{ requester: req.user }, { recipient: req.user }]
    }).populate("requester recipient", "name email energyOrbs totalOrbsEarned");

    const friends = friendships.map(f => {
      const friend = f.requester._id.toString() === req.user ? f.recipient : f.requester;
      return {
        friendshipId: f._id,
        _id: friend._id,
        name: friend.name,
        email: friend.email,
        energyOrbs: friend.energyOrbs,
        totalOrbsEarned: friend.totalOrbsEarned
      };
    });

    res.json(friends);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /api/friends/:friendshipId  — Remove friend
// ─────────────────────────────────────────────────────────────
exports.removeFriend = async (req, res) => {
  try {
    const f = await Friend.findById(req.params.friendshipId);
    if (!f) return res.status(404).json({ msg: "Not found" });
    if (f.requester.toString() !== req.user && f.recipient.toString() !== req.user)
      return res.status(401).json({ msg: "Unauthorized" });

    await Friend.findByIdAndDelete(f._id);
    res.json({ msg: "Friend removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/friends/link — Get my shareable friend link
// ─────────────────────────────────────────────────────────────
exports.getMyLink = async (req, res) => {
  try {
    const userId = req.user;
    // Generate link using user's ID
    // Format: habitax://friend/USER_ID (for deep linking in app)
    const link = `habitax://friend/${userId}`;
    
    res.json({ 
      link,
      displayLink: `habitax.app/friend/${userId}` // For display purposes
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/friends/accept-link — Instant friendship from deep link
// Body: { fromUserId: "USER_A_ID" }
// Current user (User B) becomes instant friends with User A
// ─────────────────────────────────────────────────────────────
exports.acceptFriendLink = async (req, res) => {
  try {
    const { fromUserId } = req.body;
    if (!fromUserId) return res.status(400).json({ msg: "fromUserId is required" });

    const currentUser = req.user; // User B (who clicked the link)
    
    if (fromUserId === currentUser)
      return res.status(400).json({ msg: "Cannot add yourself" });

    // Verify fromUserId exists
    const otherUser = await User.findById(fromUserId);
    if (!otherUser) return res.status(404).json({ msg: "User not found" });

    // Check if already friends
    const existing = await Friend.findOne({
      $or: [
        { requester: currentUser, recipient: fromUserId },
        { requester: fromUserId, recipient: currentUser }
      ]
    });

    if (existing) {
      if (existing.status === "accepted") 
        return res.status(400).json({ msg: "Already friends" });
      if (existing.status === "pending")
        return res.status(400).json({ msg: "Request already pending" });
    }

    // Create instant friendship (User B initiated, skip request stage)
    const friendship = await Friend.create({
      requester: fromUserId,
      recipient: currentUser,
      status: "accepted" // Instant acceptance
    });

    // Create activities for both users
    await Activity.insertMany([
      { userId: fromUserId, type: "friend_added", data: { friendId: currentUser, method: "link" } },
      { userId: currentUser, type: "friend_added", data: { friendId: fromUserId, method: "link" } }
    ]);

    const friendUser = await User.findById(fromUserId).select("name email");

    res.status(201).json({
      msg: `You're now friends with ${friendUser.name}!`,
      friend: {
        _id: friendUser._id,
        name: friendUser.name,
        email: friendUser.email
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
