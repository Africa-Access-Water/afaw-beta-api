const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const contactRoutes = require('./routes/contactRoutes');
const blogRoutes = require('./routes/blogRoutes');
const postRoutes = require('./routes/postRoutes');
const teamRoutes = require("./routes/teamRoutes");
const authRoutes = require("./routes/authRoutes");
const donationRoutes = require('./routes/donationRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());


// Default route
app.get('/', (req, res) => {
    res.send('Server Status: Running ✅');
});

app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // Retrieve subscription from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription);

    // Update your DB
    await Subscription.updateStripeSubscriptionId(session.id, stripeSubscription.id, 'active');
  }

  res.json({ received: true });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api', contactRoutes);
app.use('/api', blogRoutes);
app.use('/api', postRoutes);
app.use("/api", teamRoutes);







// Start Server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
