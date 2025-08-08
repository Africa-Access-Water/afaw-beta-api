const multer = require("multer");
const { blogMediaStorage } = require("../utils/cloudinary");
const upload = multer({ blogMediaStorage });

const pool = require("../config/db");

const ensureBlogsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS blogs (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      author VARCHAR(100) NOT NULL,
      content TEXT NOT NULL,
      image TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

const handleBlog = async (req, res) => {
  const { title, author, content } = req.body;
  const imageUrl = req.file ? req.file.path : null;

  if (!title || !author || !content)
    return res.status(400).json({ error: "All fields (except image) are required." });

  try {
    await ensureBlogsTable();

    await pool.query(
      `INSERT INTO blogs (title, author, content, image) VALUES ($1, $2, $3, $4)`,
      [title, author, content, imageUrl]
    );

    res.status(201).json({ success: true, message: "Blog post created successfully." });
  } catch (err) {
    console.error("Error creating blog:", err);
    res.status(500).json({ error: "Server error while creating blog." });
  }
};

const getAllBlogs = async (req, res) => {
  try {
    await ensureBlogsTable();

    const result = await pool.query(`SELECT * FROM blogs ORDER BY created_at DESC`);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching blogs:", err);
    res.status(500).json({ error: "Server error while fetching blogs." });
  }
};

module.exports = {
  handleBlog,
  getAllBlogs,
  upload,
};
