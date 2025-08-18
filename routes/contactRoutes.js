const express = require('express');
const router = express.Router();
const { handleContact, getAllContacts } = require('../controllers/contactController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/contact', handleContact);
router.get('/fetch-contacts', getAllContacts); 

module.exports = router;
