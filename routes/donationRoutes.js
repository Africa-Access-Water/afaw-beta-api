const express = require('express');
const router = express.Router();
const donationController = require('../controllers/donationController');



// --- Recurring Donations ---

router.post('/donate', donationController.createCheckoutSession);
router.post('/subscribe', donationController.createSubscription);

// --- Donation Data Routes ---
router.get('/', donationController.getDonations); // all donations (admin)
router.get('/donors', donationController.getDonors);       // list donors

// --- Checkout Result Pages ---
router.get("/success", (req, res) => {
  
  res.json({ message: "Payment Success. ✅ Thank you for your support!", status: "success" });
});

router.get("/failed", (req, res) => {
  res.json({ message: "Payment Failed. ❌ Please try again or contact support.", status: "failed" });
});

module.exports = router;
