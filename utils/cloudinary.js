const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

cloudinary.api
  .usage()
  .then(res => {
    console.log("✅ Cloudinary connection successful!");
    console.log("📦 Cloudinary usage:", res);
  })
  .catch(err => {
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

module.exports = { cloudinary, blogMediaStorage };
