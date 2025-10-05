const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');
const { promisify } = require('util');

const router = express.Router();
const execAsync = promisify(exec);

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueName = `${Date.now()}_${Math.round(Math.random() * 1E9)}_${file.originalname}`;
    cb(null, uniqueName);
  }
});

// File filter for medical documents
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/bmp',
    'image/tiff',
    'text/plain'  // Allow text files for testing
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, image files, and text files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Medical analysis model
const MedicalAnalysis = require('../models/MedicalAnalysis');

/**
 * POST /api/medical-analysis/upload
 * Upload and analyze medical document
 */
router.post('/upload', upload.single('medicalDocument'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please select a medical document.'
      });
    }

    console.log('📄 Medical document uploaded:', req.file.filename);
    console.log('👤 User ID:', req.user?.userId);

    const filePath = req.file.path;
    const groqApiKey = process.env.GROQ_API_KEY;

    if (!groqApiKey) {
      return res.status(500).json({
        success: false,
        message: 'Medical analysis service not configured. Please contact support.'
      });
    }

    // Execute medical analysis with fallback support
    const FallbackMedicalAnalysisService = require('../services/fallbackMedicalAnalysisService');
    const analysisService = new FallbackMedicalAnalysisService(groqApiKey);
    
    console.log('🔍 Running medical analysis (auto-detecting OCR capabilities)...');
    const analysisResult = await analysisService.analyzeMedicalDocument(filePath, req.file.originalname);

    // Save analysis to database
    const medicalAnalysis = new MedicalAnalysis({
      userId: req.user.userId,
      filename: req.file.filename,
      originalName: req.file.originalname,
      filePath: filePath,
      analysisResult: analysisResult,
      uploadDate: new Date(),
      fileSize: req.file.size,
      mimeType: req.file.mimetype
    });

    await medicalAnalysis.save();

    // Clean up uploaded file (optional - keep for record)
    // await fs.unlink(filePath);

    console.log('✅ Medical analysis completed successfully');

    res.json({
      success: true,
      message: 'Medical document analyzed successfully',
      data: {
        analysisId: medicalAnalysis._id,
        analysis: analysisResult.success ? analysisResult.analysis : analysisResult,
        uploadInfo: {
          filename: req.file.originalname,
          uploadDate: medicalAnalysis.uploadDate,
          fileSize: req.file.size
        }
      }
    });

  } catch (error) {
    console.error('❌ Medical analysis error:', error);

    // Clean up file on error
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error('Failed to cleanup file:', cleanupError);
      }
    }

    if (error.message.includes('Invalid file type')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to analyze medical document',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/medical-analysis/history
 * Get user's medical analysis history
 */
router.get('/history', async (req, res) => {
  try {
    const analyses = await MedicalAnalysis.find({ userId: req.user.userId })
      .select('-filePath') // Don't expose file paths
      .sort({ uploadDate: -1 })
      .limit(20);

    res.json({
      success: true,
      data: analyses
    });
  } catch (error) {
    console.error('Error fetching medical analysis history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analysis history'
    });
  }
});

/**
 * GET /api/medical-analysis/:id
 * Get specific medical analysis by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const analysis = await MedicalAnalysis.findOne({
      _id: req.params.id,
      userId: req.user.userId
    }).select('-filePath');

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Medical analysis not found'
      });
    }

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Error fetching medical analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analysis'
    });
  }
});

/**
 * DELETE /api/medical-analysis/:id
 * Delete medical analysis
 */
router.delete('/:id', async (req, res) => {
  try {
    const analysis = await MedicalAnalysis.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Medical analysis not found'
      });
    }

    // Delete file if it exists
    if (analysis.filePath) {
      try {
        await fs.unlink(analysis.filePath);
      } catch (fileError) {
        console.warn('Could not delete file:', fileError.message);
      }
    }

    await MedicalAnalysis.deleteOne({ _id: req.params.id });

    res.json({
      success: true,
      message: 'Medical analysis deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting medical analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete analysis'
    });
  }
});

/**
 * GET /api/medical-analysis/export-csv
 * Export health data from medical analyses as CSV
 */
router.get('/export-csv', async (req, res) => {
  try {
    // Get all user's medical analyses
    const analyses = await MedicalAnalysis.find({ userId: req.user.userId })
      .sort({ uploadDate: -1 });

    // Generate CSV using fallback service (works with or without Python)
    const FallbackMedicalAnalysisService = require('../services/fallbackMedicalAnalysisService');
    const analysisService = new FallbackMedicalAnalysisService(process.env.GROQ_API_KEY);
    
    const csvData = analysisService.generateHealthLogCSV(analyses);
    
    // Set headers for CSV download
    const filename = `health_data_${new Date().toISOString().split('T')[0]}.csv`;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    res.send(csvData);

  } catch (error) {
    console.error('Error exporting health data CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export health data'
    });
  }
});

/**
 * POST /api/medical-analysis/verify-prescription
 * Verify prescription against patient's existing medications
 */
router.post('/verify-prescription', async (req, res) => {
  try {
    const { analysisId } = req.body;

    if (!analysisId) {
      return res.status(400).json({
        success: false,
        message: 'Analysis ID required'
      });
    }

    // Get the medical analysis
    const analysis = await MedicalAnalysis.findOne({
      _id: analysisId,
      userId: req.user.userId
    });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Medical analysis not found'
      });
    }

    // Get user's existing medications
    const MedicationForm = require('../models/MedicationForm');
    const existingMedications = await MedicationForm.find({ userId: req.user.userId });

    // Cross-reference analysis medications with existing medications
    const prescribedMeds = analysis.analysisResult.medications || [];
    const existingMedNames = existingMedications.map(med => med.name.toLowerCase());

    const verification = {
      newMedications: [],
      duplicateMedications: [],
      conflictingMedications: [],
      recommendations: []
    };

    prescribedMeds.forEach(prescribed => {
      const prescribedName = prescribed.name.toLowerCase();
      
      if (existingMedNames.includes(prescribedName)) {
        verification.duplicateMedications.push({
          medication: prescribed.name,
          note: 'Already in your medication list'
        });
      } else {
        verification.newMedications.push(prescribed);
      }
    });

    // Add recommendations
    if (verification.duplicateMedications.length > 0) {
      verification.recommendations.push('Review duplicate medications with your doctor');
    }
    
    if (verification.newMedications.length > 0) {
      verification.recommendations.push('Consider adding new prescribed medications to your medication tracker');
    }

    res.json({
      success: true,
      data: verification
    });

  } catch (error) {
    console.error('Error verifying prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify prescription'
    });
  }
});

module.exports = router;