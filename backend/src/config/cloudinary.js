const cloudinary = require('cloudinary').v2; //cloudinary SDK
const { CloudinaryStorage } = require('multer-storage-cloudinary'); //multer adapter
const multer = require('multer'); //handles file uploads

//configure cloudinary with credentials from .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

//tell multer to store files directly on cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'lost-and-found', //folder in cloudinary account
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'], //allowed image types
    transformation: [{ width: 800, quality: 'auto' }], //resize and compress
  },
});

//multer middleware with 5MB limit
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, //5MB in bytes
  fileFilter: (req, file, cb) => {
    //only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

module.exports = upload;
