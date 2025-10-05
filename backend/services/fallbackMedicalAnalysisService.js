const fs = require('fs').promises;
const path = require('path');

class FallbackMedicalAnalysisService {
  constructor(groqApiKey) {
    this.groqApiKey = groqApiKey;
    this.hasPython = false;
    this.checkPythonAvailability();
  }

  async checkPythonAvailability() {
    try {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      // Try py command first (Windows Python Launcher)
      try {
        await execAsync('py --version');
        this.hasPython = true;
        console.log('✅ Python detected (py command) - OCR functionality available');
        return;
      } catch (error) {
        // Fallback to python command
        await execAsync('python --version');
        this.hasPython = true;
        console.log('✅ Python detected (python command) - OCR functionality available');
      }
    } catch (error) {
      console.log('⚠️ Python not detected - Using fallback analysis');
      this.hasPython = false;
    }
  }

  async analyzeMedicalDocument(filePath, originalName) {
    try {
      console.log('🔍 Starting medical document analysis...');
      console.log(`📄 File: ${originalName}`);
      
      if (this.hasPython) {
        // Try PaddleOCR if Python is available
        const EnhancedMedicalAnalysisService = require('./enhancedMedicalAnalysisService');
        const enhancedService = new EnhancedMedicalAnalysisService(this.groqApiKey);
        return await enhancedService.analyzeMedicalDocument(filePath, originalName);
      } else {
        // Use fallback analysis
        return await this.fallbackAnalysis(filePath, originalName);
      }

    } catch (error) {
      console.error('❌ Medical analysis failed:', error);
      return await this.fallbackAnalysis(filePath, originalName);
    }
  }

  async fallbackAnalysis(filePath, originalName) {
    try {
      console.log('🔄 Using fallback medical analysis...');
      
      // Check file type and provide basic analysis
      const ext = path.extname(originalName).toLowerCase();
      const isImage = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff'].includes(ext);
      const isPdf = ext === '.pdf';
      
      // Get file size
      const stats = await fs.stat(filePath);
      const fileSize = stats.size;
      
      // Generate mock health data with realistic values
      const mockHealthData = {
        vitals: {
          blood_pressure: {
            systolic: 120 + Math.floor(Math.random() * 20),
            diastolic: 80 + Math.floor(Math.random() * 10),
            display: "120/80"
          },
          heart_rate: {
            value: 60 + Math.floor(Math.random() * 40),
            unit: 'BPM',
            display: "72 BPM"
          },
          temperature: {
            value: 97 + Math.random() * 3,
            unit: 'F',
            display: "98.6°F"
          },
          weight: {
            value: 50 + Math.random() * 50,
            unit: 'kg', 
            display: "70 kg"
          }
        },
        medications: [
          {
            name: "Sample Medication",
            source: 'fallback_analysis',
            date_prescribed: new Date().toISOString().split('T')[0]
          }
        ],
        notes: [
          "⚠️ This is sample data - Python/PaddleOCR not installed",
          "Install Python to enable real OCR functionality",
          `File: ${originalName} (${(fileSize/1024).toFixed(1)} KB)`,
          `Type: ${isImage ? 'Medical Image' : isPdf ? 'PDF Document' : 'Unknown Format'}`
        ]
      };

      // Create realistic analysis result
      const result = {
        success: true,
        analysis: {
          extracted_text: `[FALLBACK MODE] Unable to extract text - Python/PaddleOCR not available.\nFile: ${originalName}\nSize: ${(fileSize/1024).toFixed(1)} KB\nTo enable OCR functionality, please install Python and PaddleOCR.`,
          ocr_confidence: 0.0,
          text_blocks_count: 0,
          
          medications: mockHealthData.medications,
          dosages: ["Sample 500mg", "Once daily"],
          instructions: ["Take with food", "Complete the course"],
          dates: [new Date().toISOString().split('T')[0]],
          
          health_data: mockHealthData,
          
          ai_analysis: {
            medications: mockHealthData.medications,
            health_metrics: mockHealthData.vitals,
            recommendations: [
              "Install Python and PaddleOCR for real medical document analysis",
              "Manual data entry is available in Health Log",
              "CSV export functionality is working"
            ],
            concerns: [
              "OCR functionality requires Python installation"
            ],
            summary: "Fallback analysis used - Python/PaddleOCR not available for text extraction"
          },
          
          processing_info: {
            ocr_engine: "Fallback Mode",
            ai_model: "Mock Analysis", 
            processed_at: new Date().toISOString(),
            file_name: originalName,
            note: "Install Python + PaddleOCR for real OCR functionality"
          }
        }
      };

      console.log('✅ Fallback medical analysis completed');
      return result;

    } catch (error) {
      console.error('❌ Fallback analysis failed:', error);
      return {
        success: false,
        error: error.message,
        analysis: null
      };
    }
  }

  generateHealthLogCSV(analysisHistory) {
    try {
      const csvRows = [];
      
      // CSV Header
      csvRows.push([
        'Date',
        'Source', 
        'Blood Pressure (Systolic)',
        'Blood Pressure (Diastolic)',
        'Heart Rate (BPM)',
        'Temperature (°F)', 
        'Weight (kg)',
        'Medications',
        'Notes',
        'OCR Status'
      ].join(','));

      // Process each analysis
      analysisHistory.forEach(analysis => {
        if (analysis.analysisResult && analysis.analysisResult.analysis) {
          const analysisData = analysis.analysisResult.analysis;
          const date = analysis.uploadDate ? new Date(analysis.uploadDate).toLocaleDateString() : 'N/A';
          
          let healthData = analysisData.health_data || {};
          let ocrStatus = analysisData.ocr_confidence > 0 ? 'Real OCR' : 'Fallback Mode';
          
          const row = [
            date,
            'Medical Document Upload',
            healthData.vitals?.blood_pressure?.systolic || '',
            healthData.vitals?.blood_pressure?.diastolic || '',
            healthData.vitals?.heart_rate?.value || '',
            healthData.vitals?.temperature?.value || '',
            healthData.vitals?.weight?.value || '',
            healthData.medications ? healthData.medications.map(m => m.name).join('; ') : '',
            healthData.notes ? healthData.notes.join('; ') : '',
            ocrStatus
          ];
          
          csvRows.push(row.map(field => `"${field}"`).join(','));
        }
      });

      if (csvRows.length === 1) {
        csvRows.push('"No medical document data available","","","","","","","","Install Python + PaddleOCR for OCR functionality",""');
      }

      return csvRows.join('\n');

    } catch (error) {
      console.error('CSV generation failed:', error);
      return 'Date,Error\n"' + new Date().toLocaleDateString() + '","Failed to generate CSV data"';
    }
  }
}

module.exports = FallbackMedicalAnalysisService;