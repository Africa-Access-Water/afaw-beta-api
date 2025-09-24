const express = require('express');
const { ProjectController, upload } = require('../controllers/ProjectController');

const router = express.Router();

// File upload middleware with Cloudinary storage
router.post(
  '/',
  upload.fields([
    { name: 'cover_image', maxCount: 1 },
    { name: 'media', maxCount: 10 },
  ]),
  ProjectController.create
);

router.get('/', ProjectController.getAll);
router.get('/:id', ProjectController.getById);

router.put(
  '/:id',
  upload.fields([
    { name: 'cover_image', maxCount: 1 },
    { name: 'media', maxCount: 10 },
  ]),
  ProjectController.update
);

router.delete('/:id', ProjectController.delete);
router.get('/:id/donations', ProjectController.getProjectWithDonations);

module.exports = router;
