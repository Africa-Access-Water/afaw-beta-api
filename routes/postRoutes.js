const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const multer = require("multer");
const { postMediaStorage } = require("../utils/cloudinary");
const upload = multer({ storage: postMediaStorage });
const authMiddleware = require("../middleware/authMiddleware");

// --- Public routes ---
router.get("/posts", postController.getPosts);
router.get("/posts/:id", postController.getPostById);

// --- Protected routes ---
router.post("/posts", authMiddleware, upload.single("image"), postController.createPost);
router.put("/posts/:id", authMiddleware, upload.single("image"), postController.updatePost);
router.delete("/posts/:id", authMiddleware, postController.deletePost);

module.exports = router;
