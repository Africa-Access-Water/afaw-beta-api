const express = require('express');
const cors = require('cors');
require('dotenv').config();
const bodyParser = require('body-parser');

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
const PORT = process.env.PORT || 3001;

// Enable CORS
app.use(cors());

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
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
