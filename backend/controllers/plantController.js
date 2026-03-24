const Plant = require("../models/Plant");
const User  = require("../models/User");
const { STAGE_THRESHOLDS } = require("../models/Plant");
const { checkTreeAchievements, checkPlantingAchievements } = require("../utils/achievementChecker");

// ─────────────────────────────────────────────────────────────
// Growth Logic:
//   seed  → bush  when orbsInvested >= 5
//   bush  → tree  when orbsInvested >= 15 (cumulative)
//   tree  = max stage, no further growth
//
// The user spends 1 orb at a time. We check after each spend
// whether a stage upgrade has been reached.
// ─────────────────────────────────────────────────────────────

const STAGE_ORDER = ["seed", "bush", "tree"];

function getNextStage(currentStage) {
  const idx = STAGE_ORDER.indexOf(currentStage);
  return idx < STAGE_ORDER.length - 1 ? STAGE_ORDER[idx + 1] : null;
}

// ─────────────────────────────────────────────────────────────
// GET /api/plants
// All plants for the authenticated user.
// ─────────────────────────────────────────────────────────────
exports.getPlants = async (req, res) => {
  try {
    const plants = await Plant.find({ userId: req.user }).sort({ createdAt: -1 });

    // Attach stage metadata so frontend doesn't need to hardcode thresholds
    const result = plants.map(p => ({
      ...p._doc,
      nextStageThreshold: STAGE_THRESHOLDS[p.stage] ?? null,
      isMaxStage: p.stage === "tree"
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/plants/add
// Plant a new seed (free). Each user can have multiple plants.
// Body: { type }  — e.g. "focus_tree", "discipline_tree"
// ─────────────────────────────────────────────────────────────
exports.addPlant = async (req, res) => {
  try {
    const { type = "focus_tree" } = req.body;

    const plant = await Plant.create({
      userId: req.user,
      type,
      stage: "seed",
      orbsInvested: 0
    });

    // Phase 3: check planting achievements
    const totalPlants = await Plant.countDocuments({ userId: req.user });
    const newAchievements = await checkPlantingAchievements(req.user, totalPlants);

    const response = { ...plant._doc };
    if (newAchievements.length > 0) {
      response.newAchievements = newAchievements.map(a => ({ key: a.key, label: a.label, description: a.description }));
    }

    res.status(201).json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/plants/grow
// Body: { plantId }
// Deduct 1 orb from the user and invest it into the plant.
// If cumulative orbsInvested crosses a threshold, upgrade stage.
// ─────────────────────────────────────────────────────────────
exports.growPlant = async (req, res) => {
  try {
    const { plantId } = req.body;
    if (!plantId) return res.status(400).json({ msg: "plantId is required" });

    const [plant, user] = await Promise.all([
      Plant.findById(plantId),
      User.findById(req.user)
    ]);

    if (!plant) return res.status(404).json({ msg: "Plant not found" });
    if (plant.userId.toString() !== req.user)
      return res.status(401).json({ msg: "Unauthorized" });

    if (plant.stage === "tree")
      return res.status(400).json({ msg: "🌳 Plant is fully grown!" });

    if (user.energyOrbs < 1)
      return res.status(400).json({ msg: "Not enough Energy Orbs ⚡" });

    // ── Deduct 1 orb atomically ──
    await User.findByIdAndUpdate(req.user, { $inc: { energyOrbs: -1 } });

    // ── Invest orb into plant ──
    plant.orbsInvested += 1;

    // ── Check for stage upgrade ──
    const threshold = STAGE_THRESHOLDS[plant.stage];
    const nextStage = getNextStage(plant.stage);
    let evolved = false;
    let responseMsg = "🌱 Your plant is growing!";

    if (nextStage && plant.orbsInvested >= threshold) {
      plant.stage = nextStage;
      evolved = true;
      responseMsg = plant.stage === "tree"
        ? "Your plant evolved into a Tree!"
        : "Your plant evolved into a Bush!";
    }

    await plant.save();

    // Fetch updated orb count
    const updatedUser = await User.findById(req.user).select("energyOrbs");

    // Phase 3: check tree achievements if evolved to tree
    let newAchievements = [];
    if (evolved && plant.stage === "tree") {
      const totalTrees = await Plant.countDocuments({ userId: req.user, stage: "tree" });
      newAchievements = await checkTreeAchievements(req.user, totalTrees);
    }

    const response = {
      msg: responseMsg,
      evolved,
      plant: {
        ...plant._doc,
        nextStageThreshold: STAGE_THRESHOLDS[plant.stage] ?? null,
        isMaxStage: plant.stage === "tree"
      },
      energyOrbs: updatedUser.energyOrbs
    };

    if (newAchievements.length > 0) {
      response.newAchievements = newAchievements.map(a => ({ key: a.key, label: a.label, description: a.description }));
    }

    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
