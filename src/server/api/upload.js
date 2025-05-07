import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'public', 'images', 'products');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  upload.single('file')(req, res, function (err) {
    if (err) {
      return res.status(500).json({ message: 'Error uploading file' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Return just the filename
    res.status(200).json({ filename: req.file.filename });
  });
} 