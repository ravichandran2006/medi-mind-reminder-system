const mongoose = require('mongoose');

const medicalAnalysisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  analysisResult: {
    patient_details: {
      name: String,
      age: String,
      gender: String,
      weight: String
    },
    conditions_found: [String],
    medications: [{
      name: String,
      dosage: String,
      frequency: String,
      duration: String,
      verification_status: String
    }],
    lab_values: [{
      parameter: String,
      value: String,
      unit: String,
      status: String,
      reference_range: String
    }],
    risk_assessment: {
      high_risk_factors: [String],
      moderate_risk_factors: [String],
      overall_risk_level: String
    },
    lifestyle_recommendations: {
      diet: [String],
      exercise: [String],
      sleep: [String],
      stress_management: [String]
    },
    dosage_verification: {
      appropriate_dosages: [String],
      concerning_dosages: [String],
      missing_information: [String]
    },
    recommendations: {
      immediate_actions: [String],
      follow_up_required: [String],
      lifestyle_changes: [String],
      red_flags: [String]
    },
    prescription_verification_summary: String,
    overall_assessment: String,
    analysis_timestamp: String,
    extracted_text: String,
    error: String
  }
}, { 
  timestamps: true 
});

// Index for efficient queries
medicalAnalysisSchema.index({ userId: 1, uploadDate: -1 });

module.exports = mongoose.model('MedicalAnalysis', medicalAnalysisSchema);