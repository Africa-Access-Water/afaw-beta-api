const express = require('express');
const router = express.Router();
const { handleContact, getAllContacts } = require('../controllers/contactController');
const authMiddleware = require('../middleware/authMiddleware');

// --- Public route (anyone can send a message) ---
router.post('/contact', handleContact);

// --- Protected route (only logged-in users/admins can view) ---
router.get('/fetch-contacts', authMiddleware, getAllContacts);

module.exports = router;
