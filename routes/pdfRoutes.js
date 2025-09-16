const express = require('express');
const router = express.Router();
const pdfController = require('../controllers/pdfController');

// PDF generation routes
router.post('/download-receipt', pdfController.generateDonationReceipt);

module.exports = router;
