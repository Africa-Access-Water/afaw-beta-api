const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const contactRoutes = require('./routes/contactRoutes');
const blogRoutes = require('./routes/blogRoutes');
const postRoutes = require('./routes/postRoutes');
const teamRoutes = require("./routes/teamRoutes");
const authRoutes = require("./routes/authRoutes");

const Stripe = require('stripe');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());


// Default route
app.get('/', (req, res) => {
    res.send('Server Status: Running ✅');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', contactRoutes);
app.use('/api', blogRoutes);
app.use('/api', postRoutes);
app.use("/api", teamRoutes);

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

app.post("/create-checkout-session", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: "price_1RxTjIFfzj9QdbyubOCnQ573", // ✅ real Price ID from Stripe dashboard
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: "http://localhost:5500/success.html",
      cancel_url: "http://localhost:5500/cancel.html",
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});






// Start Server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
