const GroupHabit = require("../models/GroupHabit");
const GroupLog   = require("../models/GroupLog");
const User       = require("../models/User");
const Friend     = require("../models/Friend");
const Activity   = require("../models/Activity");
const { toUTCMidnight } = require("../utils/streakCalculator");

// ── Penalty constants ─────────────────────────────────────────
const PENALTY_SELF  = 5;  // you failed your group
const PENALTY_OTHER = 2;  // your teammate failed

// ── Lazy penalty checker ──────────────────────────────────────
// Called when any member opens the app. Checks yesterday for
// incomplete members and applies penalties if needed.
async function checkGroupPenalties(group) {
  const todayUTC = toUTCMidnight(new Date());
  const yesterdayUTC = new Date(todayUTC.getTime() - 24 * 60 * 60 * 1000);

  // Already checked for yesterday?
  if (group.lastCheckedDate && toUTCMidnight(new Date(group.lastCheckedDate)).getTime() >= todayUTC.getTime()) {
    return null; // Already processed
  }

  // Find who completed yesterday
  const logs = await GroupLog.find({
    groupHabitId: group._id,
    date: yesterdayUTC,
    status: "done"
  });

  const completedSet = new Set(logs.map(l => l.userId.toString()));
  const allCompleted = group.members.every(m => completedSet.has(m.toString()));

  let penaltyResult = null;

  if (allCompleted) {
    // Everyone did it — increment group streak
    group.groupStreak += 1;
  } else {
    // Someone failed — apply penalties
    const failedMembers = group.members.filter(m => !completedSet.has(m.toString()));
    const passedMembers = group.members.filter(m => completedSet.has(m.toString()));

    // Penalize failed members (harder)
    for (const userId of failedMembers) {
      await User.findByIdAndUpdate(userId, {
        $inc: { energyOrbs: -PENALTY_SELF },
        $max: { energyOrbs: 0 } // don't go below 0 — handled below
      });
      // Ensure not negative
      await User.updateOne({ _id: userId, energyOrbs: { $lt: 0 } }, { energyOrbs: 0 });

      await Activity.create({
        userId,
        type: "group_penalty",
        data: { groupName: group.name, orbs: -PENALTY_SELF, reason: "you_missed" }
      });
    }

    // Penalize passed members (lighter — not their fault)
    for (const userId of passedMembers) {
      await User.findByIdAndUpdate(userId, { $inc: { energyOrbs: -PENALTY_OTHER } });
      await User.updateOne({ _id: userId, energyOrbs: { $lt: 0 } }, { energyOrbs: 0 });

      await Activity.create({
        userId,
        type: "group_penalty",
        data: { groupName: group.name, orbs: -PENALTY_OTHER, reason: "teammate_missed" }
      });
    }

    // Reset group streak
    group.groupStreak = 0;

    penaltyResult = {
      failed: failedMembers.length,
      passed: passedMembers.length,
      groupName: group.name
    };
  }

  group.lastCheckedDate = todayUTC;
  await group.save();
  return penaltyResult;
}

// ─────────────────────────────────────────────────────────────
// POST /api/groups/create
// ─────────────────────────────────────────────────────────────
exports.createGroup = async (req, res) => {
  try {
    const { name, inviteEmails = [] } = req.body;
    if (!name) return res.status(400).json({ msg: "Group name is required" });

    // Resolve invite emails to user IDs
    const invites = [];
    for (const email of inviteEmails) {
      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (user && user._id.toString() !== req.user) {
        invites.push({ userId: user._id, status: "pending" });
      }
    }

    const group = await GroupHabit.create({
      name,
      createdBy: req.user,
      members: [req.user], // creator is auto-member
      invites
    });

    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/groups — My groups + pending invites
// ─────────────────────────────────────────────────────────────
exports.getGroups = async (req, res) => {
  try {
    // Groups I'm a member of
    const myGroups = await GroupHabit.find({ members: req.user })
      .populate("members", "name email")
      .sort({ createdAt: -1 });

    // Groups I'm invited to
    const invitedGroups = await GroupHabit.find({
      "invites.userId": req.user,
      "invites.status": "pending"
    }).populate("createdBy", "name");

    // Check penalties lazily for each group
    const todayUTC = toUTCMidnight(new Date());
    for (const group of myGroups) {
      await checkGroupPenalties(group);
    }

    // Get today's completion status for each group
    const todayLogs = await GroupLog.find({
      groupHabitId: { $in: myGroups.map(g => g._id) },
      date: todayUTC,
      status: "done"
    });

    const logMap = {};
    todayLogs.forEach(l => {
      if (!logMap[l.groupHabitId]) logMap[l.groupHabitId] = new Set();
      logMap[l.groupHabitId].add(l.userId.toString());
    });

    const groupsWithStatus = myGroups.map(g => ({
      ...g._doc,
      todayStatus: g.members.map(m => ({
        _id: m._id,
        name: m.name,
        done: logMap[g._id]?.has(m._id.toString()) ?? false
      }))
    }));

    res.json({
      groups: groupsWithStatus,
      invites: invitedGroups.map(g => ({
        _id: g._id,
        name: g.name,
        createdBy: g.createdBy?.name || "Unknown"
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PUT /api/groups/respond-invite
// ─────────────────────────────────────────────────────────────
exports.respondInvite = async (req, res) => {
  try {
    const { groupId, action } = req.body;
    if (!["accepted", "declined"].includes(action))
      return res.status(400).json({ msg: "Action must be 'accepted' or 'declined'" });

    const group = await GroupHabit.findById(groupId);
    if (!group) return res.status(404).json({ msg: "Group not found" });

    const invite = group.invites.find(
      i => i.userId.toString() === req.user && i.status === "pending"
    );
    if (!invite) return res.status(404).json({ msg: "No pending invite found" });

    invite.status = action;

    if (action === "accepted") {
      group.members.push(req.user);
      await Activity.create({
        userId: req.user,
        type: "group_joined",
        data: { groupName: group.name }
      });
    }

    await group.save();
    res.json({ msg: `Invite ${action}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/groups/mark/:groupHabitId — Mark today's completion
// ─────────────────────────────────────────────────────────────
exports.markGroupDone = async (req, res) => {
  try {
    const group = await GroupHabit.findById(req.params.groupHabitId);
    if (!group) return res.status(404).json({ msg: "Group not found" });
    if (!group.members.some(m => m.toString() === req.user))
      return res.status(401).json({ msg: "Not a member" });

    const todayUTC = toUTCMidnight(new Date());

    // Check if already marked
    const existing = await GroupLog.findOne({
      groupHabitId: group._id, date: todayUTC, userId: req.user
    });
    if (existing) return res.status(409).json({ msg: "Already marked today" });

    await GroupLog.create({
      groupHabitId: group._id, userId: req.user, date: todayUTC, status: "done"
    });

    // Check if ALL members completed now
    const todayLogs = await GroupLog.countDocuments({
      groupHabitId: group._id, date: todayUTC, status: "done"
    });

    const allDone = todayLogs >= group.members.length;

    if (allDone) {
      await Activity.create({
        userId: req.user,
        type: "group_completed",
        data: { groupName: group.name }
      });
    }

    res.json({
      msg: "Marked done",
      allMembersComplete: allDone,
      completedCount: todayLogs,
      totalMembers: group.members.length
    });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ msg: "Already marked today" });
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/groups/nudge — Nudge a lazy member
// ─────────────────────────────────────────────────────────────
exports.nudgeMember = async (req, res) => {
  try {
    const { groupHabitId, userId } = req.body;
    const group = await GroupHabit.findById(groupHabitId);
    if (!group) return res.status(404).json({ msg: "Group not found" });
    if (!group.members.some(m => m.toString() === req.user))
      return res.status(401).json({ msg: "Not a member" });

    // We store the nudge as an activity on the nudged person
    const nudger = await User.findById(req.user).select("name");
    await Activity.create({
      userId,
      type: "habit_done", // reusing type for nudge notification
      data: { nudge: true, from: nudger?.name || "Someone", groupName: group.name }
    });

    res.json({ msg: "Nudge sent" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
