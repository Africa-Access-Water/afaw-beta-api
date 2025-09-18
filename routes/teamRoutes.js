// routes/team.js
const express = require("express");
const router = express.Router();
const teamController = require("../controllers/teamController");
const { requireManagerOrAbove } = require("../middleware/roleMiddleware");

// --- Public routes ---
router.get("/teams", teamController.getTeams);
router.get("/teams/:id", teamController.getTeamById);

// --- Protected routes (Manager and above) ---
router.post("/teams", requireManagerOrAbove(), teamController.upload.single("image"), teamController.createTeam);
router.put("/teams/:id", requireManagerOrAbove(), teamController.upload.single("image"), teamController.updateTeam);
router.delete("/teams/:id", requireManagerOrAbove(), teamController.deleteTeam);

module.exports = router;
