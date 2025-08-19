const express = require('express');
const router = express.Router();
const donationController = require('../controllers/donationController');

// Create Checkout Session (from frontend form)
router.post('/donate', donationController.createCheckoutSession);

// Stripe Webhook endpoint (Stripe calls this directly)
router.post(
  '/stripe/ webhook',
  express.raw({ type: 'application/json' }), // must use raw body for signature validation
  donationController.stripeWebhookHandler
);

// New route for recurring donations
router.post('/subscribe', donationController.createSubscription);


// Get donations by donor
router.get('/:donorId', donationController.getDonations);

// Success + Cancel routes for Stripe Checkout
router.get("/success", (req, res) => {
  res.send("Payment successful! 🎉 Thank you for your donation.");
});

router.get("/cancel", (req, res) => {
  res.send("Payment canceled. ❌ You can try again anytime.");
});

// Get all donations (admin route)
router.get('/donations', donationController.getDonations);

router.get('/donors', donationController.getDonors);

module.exports = router;
