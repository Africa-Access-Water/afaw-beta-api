require("dotenv").config();
const db = require("../config/db");
const { sendMail } = require("../services/mailService");
const {
  adminContactNotificationEmail,
  userContactConfirmationEmail,
} = require("../utils/emailTemplates");

const handleContact = async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message)
    return res.status(400).json({ error: "All fields are required." });

  db.run(
    `INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)`,
    [name, email, message],
    async function (err) {
      if (err) return res.status(500).json({ error: err.message });

      try {
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
      } catch (emailError) {
        console.error(emailError);
        res.status(500).json({ error: "Failed to send email." });
      }
    }
  );
};

const getAllContacts = (req, res) => {
  db.all(`SELECT * FROM contacts ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

module.exports = {
  handleContact,
  getAllContacts,
};
