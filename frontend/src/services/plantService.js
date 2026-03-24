/**
 * plantService.js — API wrappers for Phase 2 Forest / Plant system.
 */
import API from "./api";

/** Fetch all plants for the logged-in user */
export const getPlants = () =>
  API.get("/plants").then(r => r.data);

/** Plant a new seed. type = "focus_tree" | "discipline_tree" | "calm_tree" */
export const addPlant = (type = "focus_tree") =>
  API.post("/plants/add", { type }).then(r => r.data);

/**
 * Invest 1 Energy Orb into a plant.
 * Returns { msg, evolved, plant, energyOrbs }
 */
export const growPlant = (plantId) =>
  API.post("/plants/grow", { plantId }).then(r => r.data);

/** Fetch authenticated user's profile (energyOrbs lives here) */
export const getUserProfile = () =>
  API.get("/auth/profile").then(r => r.data);
