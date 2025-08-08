require("dotenv").config();
const { sendMail } = require("../services/mailService");
const {
  adminContactNotificationEmail,
  userContactConfirmationEmail,
} = require("../utils/emailTemplates");
const pool = require("../config/db"); // Importing the database connection pool

const handleContact = async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message)
    return res.status(400).json({ error: "All fields are required." });

  try {

    await pool.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(100),
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(
      `INSERT INTO contacts (name, email, message) VALUES ($1, $2, $3)`,
      [name, email, message]
    );

    await sendMail({
      from: `"Africa Access Water" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `Website Contact Submission : ${name}`,
      html: adminContactNotificationEmail(name, email, message),
    });

    await sendMail({
      from: `"Africa Access Water" <${process.env.EMAIL_USER}>`,
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
    const result = await pool.query(
      `SELECT * FROM contacts ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  handleContact,
  getAllContacts,
};
