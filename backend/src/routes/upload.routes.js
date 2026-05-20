const express = require('express');
const upload = require('../config/cloudinary'); //multer + cloudinary config
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

//POST /api/upload - upload a single image
router.post('/', protect, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    res.json({
      url: req.file.path, //cloudinary URL
      public: req.file.filename, //cloudinary public ID
    });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});

module.exports = router;
