# Phase 4: Social + Accountability + Consequence System

## Key Design Decisions (Review These)

> [!IMPORTANT]
> ### 1. Tab Bar Change: 5 Tabs
> Current: Home | Track | Forest | Profile (4 tabs)
> Proposed: Home | Track | **Social** | Forest | Profile (5 tabs)
>
> The Social tab becomes the hub for: leaderboard, friends, group habits, activity feed — all in one scrollable screen with section tabs.

> [!IMPORTANT]
> ### 2. Friend System: Request-Based
> Not auto-follow. User A sends request → User B accepts → bidirectional friendship.
> - Search by email (not username — simpler, already unique in your DB)
> - Friends can view each other's profile, stats, level, achievements

> [!IMPORTANT]
> ### 3. Group Habits: Daily UTC Midnight Deadline
> A cron-like check runs daily at UTC midnight. For each group habit:
> - If ALL members completed → everyone keeps streaks, no penalty
> - If ANY member missed → ALL members lose orbs + group streak resets
> - This creates **real social pressure** — you don't want to let your team down
>
> **How to trigger:** Since you're not running cron jobs, the penalty check is **lazy** — triggered when any member opens the app next day. First person to open triggers the check for the whole group.

> [!WARNING]
> ### 4. Consequence System: Calibrated Penalties
> Penalties should sting but not destroy motivation. Proposed:
> - **Solo streak break:** -2 orbs (soft, already loses streak naturally)
> - **Group failure (you failed):** -5 orbs from **you only**
> - **Group failure (teammate failed):** -2 orbs from you (lighter — not your fault)
> - **No plant damage** — too punishing, would make users quit

> [!TIP]
> ### 5. My Extra Suggestions (Beyond Your Spec)
>
> **A. Streak Shield (Orb Store Item)**
> Users can spend 10 orbs to buy a "Streak Shield" — protects against ONE streak break. Adds economy depth. Stored as `streakShields: Number` on User. Makes earning orbs more meaningful = stronger retention loop.
>
> **B. Nudge System**
> If your group member hasn't completed yet today, you can tap "Nudge" to send them a push-style in-app notification. Creates gentle accountability without punishment.
>
> **C. Group Chat (Simple)**
> A basic message list within each group habit. Messages stored in an array on the GroupHabit doc (capped at 50). Keeps it social and human.
>
> **D. Daily Summary Card**
> On HomeScreen: "Yesterday your group 'Morning Run' was 3/4 complete. Alex missed it. Everyone lost 2 orbs." — emotional, clear, drives behavior.

---

## Database Design

### [NEW] Friend.js
```
{
  requester:  ObjectId (User),   // who sent
  recipient:  ObjectId (User),   // who received
  status:     "pending" | "accepted" | "rejected",
  createdAt
}
Index: { requester: 1, recipient: 1 } (unique)
```

### [NEW] GroupHabit.js
```
{
  name:        String,            // "Morning Run"
  createdBy:   ObjectId (User),
  members:     [ObjectId (User)], // all participants
  invites:     [{ userId, status: "pending"|"accepted"|"declined" }],
  groupStreak: Number (default 0),
  lastCheckedDate: Date,          // last UTC midnight penalty was checked
  messages:    [{ userId, text, createdAt }],  // capped at 50
  createdAt
}
Index: { members: 1 }
```

### [NEW] GroupLog.js
```
{
  groupHabitId: ObjectId,
  userId:       ObjectId,
  date:         Date (UTC midnight),
  status:       "done" | "missed"
}
Index: { groupHabitId: 1, date: 1, userId: 1 } (unique)
```

### [NEW] Activity.js
```
{
  userId:    ObjectId,
  type:      "habit_done" | "streak_milestone" | "plant_evolved" |
             "group_penalty" | "achievement_unlocked" | "friend_added",
  data:      Mixed,       // { habitName, streak, orbs, etc. }
  visibility: "public" | "friends",
  createdAt
}
Index: { userId: 1, createdAt: -1 }
```

### [MODIFY] User.js
```diff
+ streakShields: { type: Number, default: 0 }
```

---

## API Routes

### [NEW] friendRoutes.js → `/api/friends`
| Method | Route | Description |
|---|---|---|
| POST | `/request` | Send friend request (body: `{ email }`) |
| GET | `/requests` | Get pending incoming requests |
| PUT | `/respond` | Accept/reject (body: `{ friendshipId, action }`) |
| GET | `/list` | Get all accepted friends |
| GET | `/profile/:userId` | View friend's public profile |
| DELETE | `/:friendshipId` | Remove friend |

### [NEW] groupRoutes.js → `/api/groups`
| Method | Route | Description |
|---|---|---|
| POST | `/create` | Create group habit (body: `{ name, inviteEmails[] }`) |
| GET | `/` | Get all my groups |
| PUT | `/respond-invite` | Accept/decline group invite |
| POST | `/mark/:groupHabitId` | Mark today as done |
| POST | `/nudge` | Nudge a member (body: `{ groupHabitId, userId }`) |
| POST | `/message` | Send group message |
| GET | `/:groupHabitId` | Get group detail + today's status |

### [NEW] socialRoutes.js → `/api/social`
| Method | Route | Description |
|---|---|---|
| GET | `/leaderboard` | Weekly leaderboard (top 20) |
| GET | `/feed` | Activity feed (friends + self) |
| POST | `/buy-shield` | Buy streak shield (costs 10 orbs) |

---

## Frontend Architecture

### [NEW] SocialScreen.js
Top-level Social tab with 4 sub-sections switchable via horizontal pills:

**Leaderboard** → Ranked list: avatar, name, level, orbs this week, streak
**Friends** → Friend list + search + pending requests
**Groups** → Group habit cards with member completion status
**Feed** → Timeline of friend activity

### [MODIFY] App.js
- Add 5th tab: `{ key: 'social', label: 'Social', icon: '👥' }`
- Import and render `SocialScreen`

### [MODIFY] HomeScreen.js
- Add "Daily Summary" card below dashboard stats — shows group status from yesterday

---

## Files Summary

| File | Action | Purpose |
|---|---|---|
| `models/Friend.js` | NEW | Friendship model |
| `models/GroupHabit.js` | NEW | Group habit with members, invites, messages |
| `models/GroupLog.js` | NEW | Per-member daily completion for groups |
| `models/Activity.js` | NEW | Activity feed events |
| [models/User.js](file:///c:/Project/habitax/backend/models/User.js) | MODIFY | Add streakShields field |
| `controllers/friendController.js` | NEW | Friend CRUD |
| `controllers/groupController.js` | NEW | Group habit logic + penalty checker |
| `controllers/socialController.js` | NEW | Leaderboard, feed, shield purchase |
| [controllers/logController.js](file:///c:/Project/habitax/backend/controllers/logController.js) | MODIFY | Post activities on markDone, solo penalty |
| `routes/friendRoutes.js` | NEW | Friend API routes |
| `routes/groupRoutes.js` | NEW | Group habit API routes |
| `routes/socialRoutes.js` | NEW | Leaderboard + feed routes |
| [server.js](file:///c:/Project/habitax/backend/server.js) | MODIFY | Mount 3 new route groups |
| `screens/SocialScreen.js` | NEW | Social hub screen |
| [App.js](file:///c:/Project/habitax/frontend/App.js) | MODIFY | Add 5th tab |
| [HomeScreen.js](file:///c:/Project/habitax/frontend/src/screens/HomeScreen.js) | MODIFY | Daily summary card |

## Verification Plan

### Manual Testing
1. Send friend request by email → verify pending state → accept → appears in friend list
2. Create group habit → invite friend → friend accepts → both can mark daily
3. One member misses → next day trigger penalty check → verify orb deduction for all
4. Buy streak shield → break streak → verify shield consumed instead of orb penalty
5. Open Social tab → verify leaderboard ranks, feed loads, group status shows
6. Nudge a member → verify nudge toast appears
