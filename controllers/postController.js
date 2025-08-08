const { cloudinary, postMediaStorage } = require("../utils/cloudinary");
const multer = require("multer");
const upload = multer({ storage: postMediaStorage });
const db = require("../config/db"); // or wherever your knex instance is

// CREATE
const createPost = async (req, res) => {
  try {
    const { title, content, type } = req.body;
    const image = req.file?.path || null; // cloudinary image path

    const [newPost] = await db("posts")
      .insert({ title, content, type, image_url: image })
      .returning("*");
      
    console.log("New Post Created:", newPost);

    res.status(201).json(newPost);
  } catch (err) {
    console.error("Error creating post:", err);
    res.status(500).json({ error: "Failed to create post" });
  }
};

// READ ALL
const getPosts = async (req, res) => {
  try {
    const posts = await db("posts").orderBy("created_at", "desc");
    res.json(posts);
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
};

// READ ONE
const getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await db("posts").where({ id }).first();

    if (!post) return res.status(404).json({ error: "Post not found" });

    res.json(post);
  } catch (err) {
    console.error("Error fetching post:", err);
    res.status(500).json({ error: "Failed to fetch post" });
  }
};

// UPDATE
const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, type } = req.body;
    const image = req.file?.path;

    const updatedFields = { title, content, type };
    if (image) updatedFields.image_url = image;

    const [updatedPost] = await db("posts")
      .where({ id })
      .update(updatedFields)
      .returning("*");

    res.json(updatedPost);
  } catch (err) {
    console.error("Error updating post:", err);
    res.status(500).json({ error: "Failed to update post" });
  }
};

// DELETE
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db("posts").where({ id }).del();

    if (!deleted) return res.status(404).json({ error: "Post not found" });

    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error("Error deleting post:", err);
    res.status(500).json({ error: "Failed to delete post" });
  }
};

module.exports = {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
};

