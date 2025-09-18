const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { requireAdmin, requireManagerOrAbove, requireAnyRole } = require("../middleware/roleMiddleware");
const multer = require("multer");
const upload = multer(); 

router.post("/signup", upload.none(), authController.signup);
router.post("/login", upload.none(), authController.login);
router.get("/profile", requireAnyRole(), authController.getProfile);
router.get("/pending-users", requireAdmin(), authController.getPendingUsers);
router.put("/approve-user/:userId", requireAdmin(), authController.approveUser);
router.put("/reject-user/:userId", requireAdmin(), authController.rejectUser);

module.exports = router;
