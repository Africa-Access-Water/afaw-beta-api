require("dotenv").config();
const { sendMail } = require("../services/mailService");
const config = require('../config/config');
const {
  adminContactNotificationEmail,
  userContactConfirmationEmail,
} = require("../utils/emailTemplates");
const knex = require("../config/db"); // make sure knex is initialized properly

const handleContact = async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    // Create table if it doesn't exist
    const hasTable = await knex.schema.hasTable("contacts");
    if (!hasTable) {
      await knex.schema.createTable("contacts", (table) => {
        table.increments("id").primary();
        table.string("name", 100);
        table.string("email", 100);
        table.text("message");
        table.timestamp("created_at").defaultTo(knex.fn.now());
      });
    }

    // Insert data
    await knex("contacts").insert({ name, email, message });

    // Send admin email
    await sendMail({
      from: `"Africa Access Water" <${config.email.user}>`,
      to: config.email.user,
      subject: `Website Contact Submission : ${name}`,
      html: adminContactNotificationEmail(name, email, message),
    });

    // Send confirmation to user
    await sendMail({
      from: `"Africa Access Water" <${config.email.user}>`,
      to: email,
      subject: `Hello ${name}, Thank you for contacting us`,
      html: userContactConfirmationEmail(name),
    });

    res.json({
      success: true,
      message: "Message received and emails sent.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong." });
  }
};

const getAllContacts = async (req, res) => {
  try {
    const contacts = await knex("contacts").orderBy("created_at", "desc");
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAllDonations = async (req, res) => {
  try {
    const donations = await knex("donations").orderBy("created_at", "desc");
    res.json(donations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  handleContact,
  getAllContacts,
  getAllDonations,
};
