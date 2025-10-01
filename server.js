const express = require('express');
const cors = require('cors');
require('dotenv').config();
const config = require('./config/config');
const bodyParser = require('body-parser');
const { sendMail } = require("./services/mailService");


// Routes
const contactRoutes = require('./routes/contactRoutes');
const blogRoutes = require('./routes/blogRoutes');
const postRoutes = require('./routes/postRoutes');
const teamRoutes = require("./routes/teamRoutes");
const authRoutes = require("./routes/authRoutes");
const donationRoutes = require('./routes/donationRoutes');
const pdfRoutes = require('./routes/pdfRoutes');
const projectRoutes = require('./routes/projectRoutes');    
const donationController = require('./controllers/donationController');

const app = express();
const PORT = config.port;

// Enable CORS (allow list if provided)
if (config.corsAllowedOrigins && config.corsAllowedOrigins.length > 0) {
  app.use(cors({ origin: config.corsAllowedOrigins }));
} else {
  app.use(cors());
}

app.get("/test-email", async (req, res) => {
  try {
    await sendMail({
      from: `"Africa Access Water" <${process.env.EMAIL_USER}>`,
      to: "katongobupe444@gmail.com",
      subject: "Test Email",
      html: "<h1>Hello</h1><p>This is a test.</p>"
    });
    res.send("Email sent!");
  } catch (err) {
    console.error("Email test error:", err);
    res.status(500).send(err.message);
  }
});

// stripe listen --forward-to localhost:5000/api/donations/stripe/webhook

// ⚠️ Webhook must use raw body BEFORE bodyParser.json()
app.post(
  '/api/donations/stripe/webhook',
  express.raw({ type: 'application/json' }),
  donationController.stripeWebhookHandler
);

// Body parser for normal JSON routes
app.use(bodyParser.json());

// Default route
app.get('/', (req, res) => {
    res.send('Server Status: Running ✅');
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api', postRoutes);
app.use("/api", teamRoutes);
app.use('/api', contactRoutes);
app.use('/api', blogRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/projects', projectRoutes);

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
