const express = require('express');
const router = express.Router();
const { handleContact, getAllContacts } = require('../controllers/contactController');

router.post('/contact', handleContact);
router.get('/fetch-contacts', getAllContacts); 

module.exports = router;
