const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
require("dotenv").config();

// Configure Cloudinary
const config = require('../config/config');
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

cloudinary.api
  .usage()
  .then((res) => {
    console.log("✅ Cloudinary connection successful!");
    console.log("📦 Cloudinary usage:", res);
  })
  .catch((err) => {
    console.error("❌ Cloudinary connection failed:", err.message);
  });

// Configure storage
const blogMediaStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "blog_images", // optional folder name
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

const postMediaStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "posts",
    allowed_formats: ["jpg", "png", "jpeg", "gif", "mp4", "webm"],
    public_id: (req, file) => Date.now() + "-" + file.originalname,
  },
});

const teamMediaStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "teams",
    allowed_formats: ["jpg", "png", "jpeg", "gif", "mp4", "webm"],
    public_id: (req, file) => Date.now() + "-" + file.originalname,
  },
});

// Helper to sanitize filenames
const sanitizeFilename = (filename) =>
  filename
    .replace(/[^a-zA-Z0-9-_ ]/g, "") // remove special characters
    .replace(/\s+/g, "_"); // replace spaces with underscores

// Storage for project files
const projectMediaStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    if (file.fieldname === "pdf_document") {
      return {
        folder: "projects/pdf",
        resource_type: "raw",
        public_id:
          sanitizeFilename(file.originalname.replace(/\.pdf$/i, "")) + ".pdf",
      };
    } else if (file.fieldname === "cover_image") {
      return {
        folder: "projects/cover",
        resource_type: "image",
        public_id: Date.now() + "-" + sanitizeFilename(file.originalname),
      };
    } else {
      // media (images/videos)
      return {
        folder: "projects/media",
        resource_type: "auto",
        public_id: Date.now() + "-" + sanitizeFilename(file.originalname),
      };
    }
  },
});

const upload = multer({ storage: projectMediaStorage });

module.exports = {
  cloudinary,
  blogMediaStorage,
  postMediaStorage,
  teamMediaStorage,
  projectMediaStorage,
  upload,
};
