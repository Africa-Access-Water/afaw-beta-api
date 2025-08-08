const express = require("express");
const router = express.Router();
const { handleBlog, getAllBlogs, upload } = require("../controllers/blogController");

router.post("/blog", upload.single("image"), handleBlog);
router.get("/blogs", getAllBlogs);

module.exports = router;
