const Project = require("../models/projectModel");
const { cloudinary, upload } = require("../utils/cloudinary");

// Helper: Extract Cloudinary public_id from URL
function extractPublicId(url) {
  if (!url) return null;
  const parts = url.split("/");
  const file = parts.pop().split(".")[0];
  const folder = parts.slice(parts.indexOf("upload") + 1).join("/");
  return folder ? `${folder}/${file}` : file;
}

class ProjectController {
  // CREATE
  static async create(req, res) {
    try {
      const { name, description, category, donation_goal, donation_raised } =
        req.body;

      const coverImage = req.files?.cover_image?.[0]?.path || null;
      const media = req.files?.media
        ? req.files.media.map((file) => file.path).filter(Boolean)
        : [];
      const pdfDocument = req.files?.pdf_document?.[0]?.path || null;

      const data = {
        name,
        description,
        category: category || null,
        cover_image: coverImage,
        media: JSON.stringify(media),
        pdf_document: pdfDocument,
        donation_goal: donation_goal ? parseFloat(donation_goal) : 0,
        donation_raised: donation_raised ? parseFloat(donation_raised) : 0,
      };

      const id = await Project.create(data);
      res
        .status(201)
        .json({ message: "Project created successfully", id, data });
    } catch (err) {
      console.error("Error creating project:", err);
      res.status(500).json({ error: err.message });
    }
  }

  static async update(req, res) {
    try {
      const project = await Project.findById(req.params.id);
      if (!project) return res.status(404).json({ error: "Project not found" });

      // --- Cover Image ---
      let coverImage = project.cover_image;
      if (req.files?.cover_image?.[0]) {
        if (project.cover_image) {
          await cloudinary.uploader.destroy(
            extractPublicId(project.cover_image)
          );
        }
        coverImage = req.files.cover_image[0].path;
      }

      // --- Media Handling ---
      // Start with existing media from hidden inputs
      let media = Array.isArray(req.body.existing_media)
        ? req.body.existing_media
        : req.body.existing_media
        ? [req.body.existing_media]
        : [];

      // Remove media marked for deletion
      const removeList = [].concat(req.body.remove_media || []);
      for (let url of removeList) {
        await cloudinary.uploader.destroy(extractPublicId(url));
        media = media.filter((m) => m !== url);
      }

      // Append new uploads, but prevent duplicates by **filename**
      if (req.files?.media?.length) {
        const newMedia = req.files.media.map((f) => f.path).filter(Boolean);

        // Build a set of existing basenames for deduplication
        const existingBasenames = new Set(
          media.map((url) => url.split("/").pop())
        );

        // Deduplicate media by URL
        media = Array.from(new Set(media));

        // Only add new files if basename not already in existing media
        newMedia.forEach((url) => {
          const basename = url.split("/").pop();
          if (!existingBasenames.has(basename)) {
            media.push(url);
            existingBasenames.add(basename);
          }
        });
      }

      // --- PDF Document ---
      let pdfDocument = project.pdf_document;
      if (req.files?.pdf_document?.[0]) {
        if (project.pdf_document) {
          await cloudinary.uploader.destroy(
            extractPublicId(project.pdf_document),
            {
              resource_type: "raw",
            }
          );
        }
        pdfDocument = req.files.pdf_document[0].path;
      }

      // --- Update Project ---
      const updatedData = {
        name: req.body.name ?? project.name,
        description: req.body.description ?? project.description,
        category: req.body.category ?? project.category,
        cover_image: coverImage,
        media: JSON.stringify(media), // stringify final array
        pdf_document: pdfDocument,
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

      // Delete PDF document
      if (project.pdf_document) {
        const pdfId = extractPublicId(project.pdf_document);
        await cloudinary.uploader.destroy(pdfId, { resource_type: "raw" });
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
