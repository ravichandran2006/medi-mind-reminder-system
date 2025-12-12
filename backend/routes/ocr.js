const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const auth = require('../middleware/auth');

const VENV_PYTHON_PATH = path.join(__dirname, '../../venv/Scripts/python.exe');
const pythonExecutable = (() => {
  const customPath = process.env.PYTHON_PATH;
  if (customPath && fs.existsSync(customPath)) {
    return customPath;
  }
  if (fs.existsSync(VENV_PYTHON_PATH)) {
    return VENV_PYTHON_PATH;
  }
  return 'python';
})();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    // Accept only image files
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

// POST /api/ocr/upload - Upload prescription image and extract data
router.post('/upload', auth, upload.single('prescription'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const imagePath = req.file.path;
    
    // Run Python OCR script
    const pythonProcess = spawn(pythonExecutable, [
      path.join(__dirname, '../ocr_service.py'),
      imagePath
    ]);

    let result = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    pythonProcess.on('close', (code) => {
      // Delete the uploaded file after processing
      fs.unlink(imagePath, (err) => {
        if (err) console.error('Error deleting file:', err);
      });

      if (code !== 0) {
        return res.status(500).json({ error: `OCR process exited with code ${code}: ${error}` });
      }

      try {
        const healthData = JSON.parse(result);
        console.log('📄 OCR extracted data:', healthData);
        res.json(healthData);
      } catch (e) {
        res.status(500).json({ error: 'Failed to parse OCR results', details: e.message });
      }
    });
  } catch (error) {
    console.error('Error processing OCR:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

module.exports = router;