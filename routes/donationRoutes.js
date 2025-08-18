const express = require('express');
const router = express.Router();
const donationController = require('../controllers/donationController');

// One-time donation
router.post('/donate', donationController.createDonation);

// Recurring donation
router.post('/subscribe', donationController.createSubscription);

// Get donations by donor
router.get('/donations/:donorId', donationController.getDonations);

// Success + Cancel routes for Stripe Checkout
router.get("/success", (req, res) => {
  res.send("Payment successful! 🎉 Thank you for your donation.");
});

router.get("/cancel", (req, res) => {
  res.send("Payment canceled. ❌ You can try again anytime.");
});

module.exports = router;
