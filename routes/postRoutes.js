const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const multer = require("multer");
const { postMediaStorage } = require("../utils/cloudinary");
const upload = multer({ storage: postMediaStorage });
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

// Routes
router.post("/posts", upload.single("image"), postController.createPost);
router.get("/posts", postController.getPosts);
router.get("/posts/:id", postController.getPostById);
router.put("/posts/:id", upload.single("image"), postController.updatePost);
router.delete("/posts/:id", postController.deletePost);

module.exports = router;
