const Project = require("../models/projectModel");
const { cloudinary, projectMediaStorage } = require("../utils/cloudinary");
const multer = require("multer");

const upload = multer({ storage: projectMediaStorage });

// Helper: Extract Cloudinary public_id from URL
function extractPublicId(url) {
  if (!url) return null;
  const parts = url.split("/");
  const file = parts.pop().split(".")[0]; // remove extension
  const folder = parts.slice(parts.indexOf("upload") + 1).join("/");
  return folder ? `${folder}/${file}` : file;
}

class ProjectController {
  // CREATE a new project
  static async create(req, res) {
    try {
      const { name, description, category, donation_goal, donation_raised } =
        req.body;



      // Handle cover image upload
      const coverImage = req.files?.cover_image?.[0]?.path || null;

      // Handle multiple media uploads
      const media = req.files?.media
        ? req.files.media.map((file) => file.path).filter(Boolean)
        : [];

      const data = {
        name,
        description,
        category: category || null,
        cover_image: coverImage,
        media: JSON.stringify(media), // always store as valid JSON array
        donation_goal: donation_goal ? parseFloat(donation_goal) : 0,
        donation_raised: donation_raised ? parseFloat(donation_raised) : 0,
      };

      const id = await Project.create(data);

      // Return the created project data
      res
        .status(201)
        .json({ message: "Project created successfully", id, data });
    } catch (err) {
      console.error("Error creating project:", err);
      res.status(500).json({ error: err.message });
    }
  }

  // UPDATE project
  static async update(req, res) {
    try {
      const project = await Project.findById(req.params.id);
      if (!project) return res.status(404).json({ error: "Project not found" });

      // --- Handle cover image ---
      let coverImage = project.cover_image;
      if (req.files?.cover_image?.[0]) {
        if (project.cover_image) {
          const oldId = extractPublicId(project.cover_image);
          await cloudinary.uploader.destroy(oldId);
        }
        coverImage = req.files.cover_image[0].path;
      }

      // --- Existing media ---
      let media = [];
      if (project.media) {
        try {
          media = JSON.parse(project.media).filter(Boolean);
        } catch (err) {
          console.warn("Failed to parse project.media:", err);
          media = [];
        }
      }

      // --- Remove selected media ---
      if (req.body.remove_media) {
        const removeList = Array.isArray(req.body.remove_media)
          ? req.body.remove_media
          : [req.body.remove_media];
        for (let url of removeList) {
          const publicId = extractPublicId(url);
          await cloudinary.uploader.destroy(publicId);
          media = media.filter((m) => m !== url);
        }
      }

      // --- Add new media ---
      if (req.files?.media) {
        media = media.concat(
          req.files.media.map((file) => file.path).filter(Boolean)
        );
      }

      const updatedData = {
        name: req.body.name ?? project.name,
        description: req.body.description ?? project.description,
        category: req.body.category ?? project.category,
        cover_image: coverImage,
        media: JSON.stringify(media),
        donation_goal: req.body.donation_goal
          ? parseFloat(req.body.donation_goal)
          : project.donation_goal,
        donation_raised: req.body.donation_raised
          ? parseFloat(req.body.donation_raised)
          : project.donation_raised,
      };

      const updated = await Project.update(req.params.id, updatedData);

      res.json({ message: "Project updated successfully", updated });
    } catch (err) {
      console.error("Error updating project:", err);
      res.status(500).json({ error: err.message });
    }
  }

  // Get all projects
  static async getAll(req, res) {
    try {
      const projects = await Project.findAll();
      res.json(projects);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Get a single project by ID
  static async getById(req, res) {
    try {
      const project = await Project.findById(req.params.id);
      if (!project) return res.status(404).json({ error: "Project not found" });
      res.json(project);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

// Delete project (with cleanup)
static async delete(req, res) {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    // Delete cover image from Cloudinary
    if (project.cover_image) {
      const coverId = extractPublicId(project.cover_image);
      await cloudinary.uploader.destroy(coverId);
    }

    // Delete media files from Cloudinary
    let mediaFiles = [];
    if (project.media) {
      try {
        mediaFiles = JSON.parse(project.media).filter(Boolean); // ignore nulls
      } catch (err) {
        console.warn("Failed to parse project.media:", err);
        mediaFiles = [];
      }
    }

    for (let url of mediaFiles) {
      const publicId = extractPublicId(url);
      await cloudinary.uploader.destroy(publicId);
    }

    await Project.delete(req.params.id);
    res.json({ message: "Project deleted successfully" });
  } catch (err) {
    console.error("Error deleting project:", err);
    res.status(500).json({ error: err.message });
  }
}


  // Optional: get project with donations
  static async getProjectWithDonations(req, res) {
    try {
      const project = await Project.findById(req.params.id);
      if (!project) return res.status(404).json({ error: "Project not found" });

      const donations = await Project.getDonations(req.params.id);
      res.json({ project, donations });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = { ProjectController, upload };
