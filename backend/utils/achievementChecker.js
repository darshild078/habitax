/**
 * achievementChecker.js — Idempotent achievement granting.
 * Safe to call multiple times; duplicates are silently ignored via unique index.
 */
const Achievement = require("../models/Achievement");

// ── Achievement Definitions ───────────────────────────────────
// No emojis — just clean names and descriptions.
const ACHIEVEMENT_DEFS = {
  // Streak-based
  streak_7:   { label: "Week Warrior",     description: "Maintained a 7-day streak" },
  streak_14:  { label: "Two Week Titan",   description: "Maintained a 14-day streak" },
  streak_30:  { label: "Monthly Master",   description: "Maintained a 30-day streak" },
  streak_100: { label: "Centurion",        description: "Maintained a 100-day streak" },

  // Tree-based
  first_tree: { label: "First Forest",     description: "Grew your first tree to full size" },
  trees_5:    { label: "Forest Guardian",  description: "Grew 5 trees to full size" },

  // Orb-based
  orbs_50:    { label: "Orb Collector",    description: "Earned 50 total Energy Orbs" },
  orbs_200:   { label: "Orb Master",       description: "Earned 200 total Energy Orbs" },

  // Planting-based
  plants_10:  { label: "Garden Architect", description: "Planted 10 seeds" },
};

/**
 * Try to grant an achievement. No-op if already unlocked.
 * Returns the achievement doc if newly created, or null.
 */
async function tryGrant(userId, key) {
  const def = ACHIEVEMENT_DEFS[key];
  if (!def) return null;

  try {
    const achievement = await Achievement.findOneAndUpdate(
      { userId, key },
      {
        userId,
        key,
        label: def.label,
        description: def.description,
        unlockedAt: new Date()
      },
      { upsert: true, new: true, setDefaultsOnInsert: true, rawResult: true }
    );
    // rawResult tells us if it was a new insert or an existing doc
    const isNew = achievement.lastErrorObject?.upserted;
    return isNew ? achievement.value : null;
  } catch (err) {
    // 11000 = duplicate key — already exists, ignore
    if (err.code === 11000) return null;
    console.error("Achievement grant error:", err.message);
    return null;
  }
}

/**
 * Check and grant streak-based achievements.
 * Call after every successful markDone.
 */
async function checkStreakAchievements(userId, currentStreak) {
  const grants = [];
  if (currentStreak >= 7)   grants.push(tryGrant(userId, "streak_7"));
  if (currentStreak >= 14)  grants.push(tryGrant(userId, "streak_14"));
  if (currentStreak >= 30)  grants.push(tryGrant(userId, "streak_30"));
  if (currentStreak >= 100) grants.push(tryGrant(userId, "streak_100"));

  const results = await Promise.all(grants);
  return results.filter(Boolean); // only newly granted
}

/**
 * Check and grant orb-based achievements.
 * Call after orbs are incremented.
 */
async function checkOrbAchievements(userId, totalOrbsEarned) {
  const grants = [];
  if (totalOrbsEarned >= 50)  grants.push(tryGrant(userId, "orbs_50"));
  if (totalOrbsEarned >= 200) grants.push(tryGrant(userId, "orbs_200"));

  const results = await Promise.all(grants);
  return results.filter(Boolean);
}

/**
 * Check and grant tree-based achievements.
 * Call after a plant evolves to "tree" stage.
 */
async function checkTreeAchievements(userId, totalFullyGrownTrees) {
  const grants = [];
  if (totalFullyGrownTrees >= 1) grants.push(tryGrant(userId, "first_tree"));
  if (totalFullyGrownTrees >= 5) grants.push(tryGrant(userId, "trees_5"));

  const results = await Promise.all(grants);
  return results.filter(Boolean);
}

/**
 * Check planting achievements.
 */
async function checkPlantingAchievements(userId, totalPlants) {
  const grants = [];
  if (totalPlants >= 10) grants.push(tryGrant(userId, "plants_10"));

  const results = await Promise.all(grants);
  return results.filter(Boolean);
}

module.exports = {
  ACHIEVEMENT_DEFS,
  tryGrant,
  checkStreakAchievements,
  checkOrbAchievements,
  checkTreeAchievements,
  checkPlantingAchievements
};
