// routes/team.js
const express = require("express");
const router = express.Router();
const teamController = require("../controllers/teamController");
const authMiddleware = require("../middleware/authMiddleware");
router.use(authMiddleware);

router.get("/teams", teamController.getTeams);
router.get("/teams/:id", teamController.getTeamById);
router.post("/teams/", teamController.upload.single("image"), teamController.createTeam);
router.put("/teams/:id", teamController.upload.single("image"), teamController.updateTeam);
router.delete("/teams/:id", teamController.deleteTeam);

module.exports = router;