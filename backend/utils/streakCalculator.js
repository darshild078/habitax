/**
 * streakCalculator.js
 *
 * Pure utility — no DB calls, no side effects.
 * Takes a habit document and returns the updated streak fields.
 *
 * ── How streak logic works ──────────────────────────────────────
 *
 * 1. Normalize today to UTC midnight (strip time component).
 * 2. If lastLoggedDate == today  → already logged, return null (caller handles 409).
 * 3. If lastLoggedDate == yesterday → consecutive day → currentStreak + 1.
 * 4. Otherwise (gap ≥ 2 days or first log) → streak resets to 1.
 * 5. longestStreak = max(longestStreak, currentStreak).
 *
 * ── Why UTC midnight? ───────────────────────────────────────────
 * Storing time-of-day would break same-day detection across timezones.
 * By always comparing midnight-to-midnight we get reliable date arithmetic.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Returns UTC midnight for a given date.
 * @param {Date} date
 * @returns {Date}
 */
function toUTCMidnight(date) {
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  ));
}

/**
 * Computes new streak values for a habit being marked done today.
 *
 * @param {Object} habit - Mongoose habit document (plain fields accessible)
 * @returns {{ alreadyLogged: boolean, currentStreak: number, longestStreak: number, todayUTC: Date }}
 */
function calculateStreak(habit) {
  const todayUTC = toUTCMidnight(new Date());

  const lastLogged = habit.lastLoggedDate
    ? toUTCMidnight(new Date(habit.lastLoggedDate))
    : null;

  // Guard: already logged today
  if (lastLogged && lastLogged.getTime() === todayUTC.getTime()) {
    return { alreadyLogged: true };
  }

  // Check if lastLogged was exactly yesterday
  const diffMs = lastLogged ? (todayUTC.getTime() - lastLogged.getTime()) : null;
  const isConsecutive = diffMs !== null && diffMs === MS_PER_DAY;

  // Phase 3: detect streak break (gap > 1 day with a previous streak)
  const streakBroken = !isConsecutive && (habit.currentStreak || 0) > 0 && lastLogged !== null;
  const previousStreak = streakBroken ? (habit.currentStreak || 0) : 0;

  const currentStreak = isConsecutive ? habit.currentStreak + 1 : 1;
  const longestStreak = Math.max(habit.longestStreak || 0, currentStreak);

  return {
    alreadyLogged: false,
    currentStreak,
    longestStreak,
    todayUTC,
    streakBroken,
    previousStreak
  };
}

module.exports = { calculateStreak, toUTCMidnight };
