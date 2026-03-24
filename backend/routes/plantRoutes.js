const express = require("express");
const router  = express.Router();
const { getPlants, addPlant, growPlant } = require("../controllers/plantController");
const auth = require("../middleware/authMiddleware");

router.get("/",        auth, getPlants);   // GET  /api/plants
router.post("/add",    auth, addPlant);    // POST /api/plants/add
router.post("/grow",   auth, growPlant);   // POST /api/plants/grow

module.exports = router;
