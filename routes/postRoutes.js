const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const multer = require("multer");
const { postMediaStorage } = require("../utils/cloudinary");
const upload = multer({ storage: postMediaStorage });
const { requireManagerOrAbove } = require("../middleware/roleMiddleware");

// --- Public routes ---
router.get("/posts", postController.getPosts);
router.get("/posts/:id", postController.getPostById);

// --- Protected routes (Manager and above) ---
router.post("/posts", requireManagerOrAbove(), upload.single("image"), postController.createPost);
router.put("/posts/:id", requireManagerOrAbove(), upload.single("image"), postController.updatePost);
router.delete("/posts/:id", requireManagerOrAbove(), postController.deletePost);

module.exports = router;
