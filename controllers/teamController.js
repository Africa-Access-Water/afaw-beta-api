const { cloudinary, teamMediaStorage } = require("../utils/cloudinary");
const multer = require("multer");
const upload = multer({ storage: teamMediaStorage });
const db = require("../config/db"); // your Knex instance

// CREATE
const createTeam = async (req, res) => {
  try {
    const { type, title, full_name, socials, position, bio } = req.body;
    const image = req.file?.path || null;

    const [newMember] = await db("teams")
      .insert({
        type,
        title,
        full_name,
        socials,
        position,
        bio,
        image_url: image,
      })
      .returning("*");

    console.log("New Team Member Created:", newMember);
    res.status(201).json(newMember);
  } catch (err) {
    console.error("Error creating team member:", err);
    res.status(500).json({ error: "Failed to create team member" });
  }
};

// READ ALL
const getTeams = async (req, res) => {
  try {
    const members = await db("teams").orderBy("created_at", "desc");
    res.json(members);
  } catch (err) {
    console.error("Error fetching team members:", err);
    res.status(500).json({ error: "Failed to fetch team members" });
  }
};

// READ ONE
const getTeamById = async (req, res) => {
  try {
    const { id } = req.params;
    const member = await db("teams").where({ id }).first();

    if (!member) return res.status(404).json({ error: "Team member not found" });

    res.json(member);
  } catch (err) {
    console.error("Error fetching team member:", err);
    res.status(500).json({ error: "Failed to fetch team member" });
  }
};

// UPDATE
const updateTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, title, full_name, socials, position, bio } = req.body;
    const image = req.file?.path;

    const updatedFields = {
      type,
      title,
      full_name,
      socials,
      position,
      bio,
    };

    if (image) updatedFields.image_url = image;

    const [updatedMember] = await db("teams")
      .where({ id })
      .update(updatedFields)
      .returning("*");

    if (!updatedMember) return res.status(404).json({ error: "Team member not found" });

    res.json(updatedMember);
  } catch (err) {
    console.error("Error updating team member:", err);
    res.status(500).json({ error: "Failed to update team member" });
  }
};

// DELETE
const deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db("teams").where({ id }).del();

    if (!deleted) return res.status(404).json({ error: "Team member not found" });

    res.json({ message: "Team member deleted successfully" });
  } catch (err) {
    console.error("Error deleting team member:", err);
    res.status(500).json({ error: "Failed to delete team member" });
  }
};

module.exports = {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  upload,
};
