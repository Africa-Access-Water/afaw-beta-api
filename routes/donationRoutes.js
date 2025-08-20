const express = require('express');
const router = express.Router();
const donationController = require('../controllers/donationController');

// --- Stripe Routes ---
router.post('/donate', donationController.createCheckoutSession);

router.post(
  '/stripe/webhook',  // ✅ fixed path
  express.raw({ type: 'application/json' }), // required for signature validation
  donationController.stripeWebhookHandler
);

// --- Recurring Donations ---
router.post('/subscribe', donationController.createSubscription);

// --- Donation Data Routes ---
router.get('/donations', donationController.getDonations); // all donations (admin)
router.get('/donors', donationController.getDonors);       // list donors

// --- Checkout Result Pages ---
router.get("/success", (req, res) => {
  res.send("Payment successful! 🎉 Thank you for your donation.");
});

router.get("/cancel", (req, res) => {
  res.send("Payment canceled. ❌ You can try again anytime.");
});

module.exports = router;
