const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const multer = require("multer");
const upload = multer(); 

router.post("/signup", upload.none(), authController.signup);
router.post("/login", upload.none(), authController.login);
router.get("/profile", authMiddleware, authController.getProfile);

module.exports = router;
