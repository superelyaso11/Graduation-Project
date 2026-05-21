const express = require('express');
const upload = require('../config/cloudinary'); //multer + cloudinary config
const { protect } = require('../middleware/auth.middleware');
const { analyzeImage } = require('../services/gemini.service'); //gemini service

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

//POST /api/upload/analyze - analyze an image with Gemini AI
router.post('/analyze', protect, async (req, res) => {
  const { imageUrl } = req.body; //cloudinary URL to analyze

  if (!imageUrl) {
    return res.status(400).json({ message: 'Image URL is required' });
  }

  try {
    const result = await analyzeImage(imageUrl); //call gemini service

    if (!result.success) {
      return res.status(200).json({
        success: false,
        message: 'Could not analyze image, please fill in manually',
      });
    }

    res.json({
      success: true,
      category: result.category,
      description: result.description,
    });
  } catch (error) {
    res.status(500).json({ message: 'Analyze failed', error: error.message });
  }
});

module.exports = router;
