/**
 * profileComputer.js — Pure computation functions for user identity.
 * No DB access. Receives data as arguments.
 */

// ── Level System ──────────────────────────────────────────────
const LEVELS = [
  { number: 1, title: "Sprout",      threshold: 0 },
  { number: 2, title: "Sapling",     threshold: 10 },
  { number: 3, title: "Grower",      threshold: 30 },
  { number: 4, title: "Cultivator",  threshold: 75 },
  { number: 5, title: "Forester",    threshold: 150 },
  { number: 6, title: "Elder Tree",  threshold: 300 },
  { number: 7, title: "Forest King", threshold: 500 },
];

/**
 * Compute user level from totalOrbsEarned.
 * Returns { number, title, currentXP, nextLevelXP, progress }
 */
function computeLevel(totalOrbsEarned) {
  let level = LEVELS[0];

  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalOrbsEarned >= LEVELS[i].threshold) {
      level = LEVELS[i];
      break;
    }
  }

  const nextLevel = LEVELS.find(l => l.threshold > totalOrbsEarned);

  return {
    number: level.number,
    title: level.title,
    currentXP: totalOrbsEarned,
    nextLevelXP: nextLevel ? nextLevel.threshold : null,
    progress: nextLevel
      ? (totalOrbsEarned - level.threshold) / (nextLevel.threshold - level.threshold)
      : 1 // max level
  };
}

// ── Discipline Type ───────────────────────────────────────────
const DISCIPLINE_TIERS = [
  { min: 30, title: "Unbreakable" },
  { min: 14, title: "Dedicated" },
  { min: 7,  title: "Focused" },
  { min: 3,  title: "Consistent" },
  { min: 0,  title: "Beginner" },
];

/**
 * Compute discipline type from the user's best current streak.
 */
function computeDisciplineType(bestCurrentStreak) {
  for (const tier of DISCIPLINE_TIERS) {
    if (bestCurrentStreak >= tier.min) return tier.title;
  }
  return "Beginner";
}

module.exports = { computeLevel, computeDisciplineType, LEVELS, DISCIPLINE_TIERS };
