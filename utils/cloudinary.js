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


module.exports = {
  cloudinary,
  blogMediaStorage,
  postMediaStorage,
  teamMediaStorage,
};