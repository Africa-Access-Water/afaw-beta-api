// routes/team.js
const express = require("express");
const router = express.Router();
const teamController = require("../controllers/teamController");
const authMiddleware = require("../middleware/authMiddleware");

// --- Public routes ---
router.get("/teams", teamController.getTeams);
router.get("/teams/:id", teamController.getTeamById);

// --- Protected routes ---
router.post("/teams", authMiddleware, teamController.upload.single("image"), teamController.createTeam);
router.put("/teams/:id", authMiddleware, teamController.upload.single("image"), teamController.updateTeam);
router.delete("/teams/:id", authMiddleware, teamController.deleteTeam);

module.exports = router;
