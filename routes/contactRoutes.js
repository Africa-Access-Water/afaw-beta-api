const express = require('express');
const router = express.Router();
const { handleContact, getAllContacts } = require('../controllers/contactController');
const { requireManagerOrAbove } = require('../middleware/roleMiddleware');

// --- Public route (anyone can send a message) ---
router.post('/contact', handleContact);

// --- Protected route (Manager and above can view contacts) ---
router.get('/fetch-contacts', requireManagerOrAbove(), getAllContacts);

module.exports = router;
