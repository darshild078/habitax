/**
 * habitService.js
 * Centralized API calls for Phase 1 habit tracking (logging + streaks).
 * Cost-related calls remain in their respective screens using the API singleton.
 */
import API from "./api";

/**
 * Mark a habit as done for today.
 * Returns { currentStreak, longestStreak, log } on success.
 * Throws on network error; caller handles 409 (already logged).
 */
export const markHabitDone = (habitId) =>
  API.post(`/logs/mark/${habitId}`).then(res => res.data);

/**
 * Fetch the last N days of logs for a habit (default 30).
 * Returns { habitId, name, currentStreak, longestStreak, logs[] }
 */
export const getHabitHistory = (habitId, days = 30) =>
  API.get(`/logs/history/${habitId}`, { params: { days } }).then(res => res.data);

/**
 * Get all user habits with doneToday boolean.
 * Returns Array<{ _id, name, currentStreak, longestStreak, doneToday }>
 */
export const getTodayStatus = () =>
  API.get("/logs/today").then(res => res.data);
