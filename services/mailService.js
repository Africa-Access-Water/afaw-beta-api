require("dotenv").config();
const nodemailer = require("nodemailer");
const config = require('../config/config');

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: true,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

transporter.verify(function (error, success) {
  if (error) {
    console.error("Mail server connection failed:", error);
  } else {
    console.log("Mail server is ready to take messages");
  }
});

const sendMail = async (mailOptions) => {
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
    return info;
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
};

module.exports = { sendMail };
