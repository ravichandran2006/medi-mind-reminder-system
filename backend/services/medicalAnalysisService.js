const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

/**
 * Medical Analysis Service
 * Node.js implementation for analyzing medical documents using Groq API
 */
class MedicalAnalysisService {
  constructor(groqApiKey) {
    this.groqApiKey = groqApiKey;
    this.groqUrl = "https://api.groq.com/openai/v1/chat/completions";
    
    // Medical reference ranges
    this.referenceRanges = {
      "blood_sugar_fasting": { min: 70, max: 100, unit: "mg/dL" },
      "blood_sugar_random": { min: 70, max: 140, unit: "mg/dL" },
      "hba1c": { min: 4.0, max: 5.6, unit: "%" },
      "cholesterol_total": { min: 125, max: 200, unit: "mg/dL" },
      "ldl": { min: 0, max: 100, unit: "mg/dL" },
      "hdl_male": { min: 40, max: 999, unit: "mg/dL" },
      "hdl_female": { min: 50, max: 999, unit: "mg/dL" },
      "triglycerides": { min: 0, max: 150, unit: "mg/dL" },
      "blood_pressure_systolic": { min: 90, max: 120, unit: "mmHg" },
      "blood_pressure_diastolic": { min: 60, max: 80, unit: "mmHg" },
      "creatinine_male": { min: 0.74, max: 1.35, unit: "mg/dL" },
      "creatinine_female": { min: 0.59, max: 1.04, unit: "mg/dL" }
    };
  }

  async extractTextFromFile(filePath) {
    try {
      const fileContent = await fs.readFile(filePath);
      const stats = await fs.stat(filePath);
      const fileExt = path.extname(filePath).toLowerCase();
      
      let extractedText = "";
      
      // Try Python OCR first if available
      if (fileExt === '.pdf' || ['.jpg', '.jpeg', '.png', '.bmp', '.tiff'].includes(fileExt)) {
        try {
          const { exec } = require('child_process');
          const { promisify } = require('util');
          const execAsync = promisify(exec);
          
          // Try to use Python OCR script
          const pythonScript = path.join(__dirname, 'medicalAnalysis.py');
          const command = `py "${pythonScript}" "${filePath}" "test_key"`;
          
          console.log('🔍 Attempting Python OCR extraction...');
          const { stdout, stderr } = await execAsync(command);
          
          if (stdout && !stderr.includes('Error')) {
            try {
              const result = JSON.parse(stdout);
              if (result.extracted_text && result.extracted_text.length > 50) {
                extractedText = result.extracted_text;
                console.log(`✅ Python OCR successful: ${extractedText.length} characters extracted`);
              }
            } catch (parseError) {
              console.log('⚠️ Python OCR response parsing failed, using fallback');
            }
          }
        } catch (pythonError) {
          console.log('⚠️ Python OCR not available, using basic extraction');
        }
      }
      
      // Fallback: basic file analysis with better content extraction
      if (!extractedText || extractedText.length < 50) {
        if (fileExt === '.txt') {
          extractedText = await fs.readFile(filePath, 'utf8');
          console.log(`✅ Text file read: ${extractedText.length} characters`);
        } else {
          // Provide more detailed file information for better analysis
          extractedText = `Medical document uploaded: ${path.basename(filePath)}. ` +
                        `File type: ${fileExt.substring(1).toUpperCase()}. ` +
                        `File size: ${(stats.size / 1024).toFixed(2)}KB. ` +
                        `Document contains medical information that requires OCR processing. ` +
                        `For enhanced text extraction from images and PDFs, Tesseract OCR analysis was attempted. ` +
                        `Please ensure the document contains clear, readable text for optimal analysis.`;
        }
      }
      
      // Log extraction details for debugging
      console.log(`📄 Text extraction summary:`);
      console.log(`   - File: ${path.basename(filePath)}`);
      console.log(`   - Type: ${fileExt}`);
      console.log(`   - Size: ${(stats.size / 1024).toFixed(2)}KB`);
      console.log(`   - Extracted: ${extractedText.length} characters`);
      console.log(`   - OCR Used: ${extractedText.length > 200}`);
      console.log(`   - Content preview: ${extractedText.substring(0, 100)}...`);
      
      return {
        extractedText: extractedText || "Document uploaded but text extraction was limited.",
        fileSize: stats.size,
        fileType: fileExt,
        ocrUsed: extractedText.length > 200 // Assume OCR was used if substantial text extracted
      };
    } catch (error) {
      throw new Error(`Failed to process file: ${error.message}`);
    }
  }

  async analyzeWithGroq(documentInfo, fileName) {
    const systemPrompt = `You are an expert medical AI assistant specialized in analyzing medical prescriptions and reports. You MUST extract ALL available information from the document.

IMPORTANT: Carefully read through the entire document text and extract EVERY piece of patient information, even if it's partially formatted or abbreviated.

### CRITICAL EXTRACTION RULES:
1. **Patient Information** - Look for ANY mention of:
   - Names (Patient, Mr., Mrs., Dr., any capitalized names)
   - Ages (numbers followed by "years", "yrs", "y.o.", or age context)
   - Gender (Male, Female, M, F, Man, Woman, Mr., Mrs.)
   - Dates (any date format: DD/MM/YYYY, MM-DD-YYYY, written dates)
   - Doctor names (Dr., Doctor, Physician, any medical titles)
   - Hospital/Clinic names

2. **Dosage Recommendations** - ALWAYS provide specific recommendations:
   - Current dosage analysis (appropriate/needs adjustment)
   - Specific dosage suggestions with rationale
   - Timing recommendations (morning, evening, with food)
   - Duration of treatment
   - Monitoring requirements

3. **Medical Information** - Extract EVERYTHING:
   - All medications (brand names, generic names, abbreviations)
   - All lab values (numbers with units)
   - All conditions/diagnoses
   - All symptoms mentioned

### Document Analysis:
File: ${fileName}
Content: ${documentInfo.extractedText}

File details:
- Size: ${(documentInfo.fileSize / 1024).toFixed(2)}KB
- Type: ${documentInfo.fileType}
- OCR processed: ${documentInfo.ocrUsed ? 'Yes' : 'No'}

### Required JSON Output:
{
  "patientInfo": {
    "name": "EXTRACT ANY NAME FOUND - check entire text",
    "age": "EXTRACT ANY AGE MENTIONED - look for numbers + years/yrs",
    "gender": "EXTRACT GENDER - look for M/F/Male/Female/Mr/Mrs",
    "reportDate": "EXTRACT ANY DATE FOUND",
    "doctor": "EXTRACT DOCTOR NAME if mentioned"
  },
  "conditions": [
    { "name": "condition", "confidence": 90, "context": "where found in text" }
  ],
  "riskAssessment": {
    "level": "Low/Moderate/High",
    "score": 65,
    "factors": ["specific risk factors from document"]
  },
  "medications": [
    { "name": "medication", "dosage": "exact dosage", "frequency": "how often", "duration": "how long", "notes": "additional info" }
  ],
  "labValues": [
    { "test": "test name", "value": "result", "normalRange": "normal range", "status": "Normal/Abnormal", "interpretation": "what it means" }
  ],
  "dosageRecommendations": {
    "current_analysis": "Analysis of current dosages",
    "specific_recommendations": [
      {
        "medication": "drug name",
        "current_dose": "current amount",
        "recommended_dose": "suggested amount",
        "timing": "when to take",
        "reason": "why this recommendation",
        "monitoring": "what to watch for"
      }
    ],
    "general_guidance": ["Take medications with food", "Monitor for side effects", "Follow up in X weeks"]
  },
  "recommendations": [
    "Specific actionable recommendations"
  ],
  "visualizations": {
    "riskGauge": 65,
    "summary": {
      "conditions": 2,
      "medications": 3,
      "labValues": 4,
      "recommendations": 5
    }
  },
  "overallAssessment": "Comprehensive summary with dosage guidance and patient-specific advice"
}

### MANDATORY REQUIREMENTS:
- NEVER return "Not available" unless you've thoroughly searched the entire text
- If you find partial information (like "John" or "45 years"), extract it
- ALWAYS provide dosage recommendations based on the medications found
- Extract information even if formatting is poor or abbreviated
- Respond with ONLY valid JSON, no other text

Analyze this document NOW and extract EVERYTHING available:`;

    try {
      const headers = {
        'Authorization': `Bearer ${this.groqApiKey}`,
        'Content-Type': 'application/json'
      };
      
      const data = {
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Analyze this medical document and respond with valid JSON only.' }
        ],
        temperature: 0.1, // Lower temperature for more consistent JSON output
        max_tokens: 3000
      };
      
      const response = await axios.post(this.groqUrl, data, { headers });
      let aiResponse = response.data.choices[0].message.content;
      
      // Clean up the response to extract JSON
      aiResponse = aiResponse.trim();
      
      // Remove any markdown code blocks if present
      if (aiResponse.startsWith('```json')) {
        aiResponse = aiResponse.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (aiResponse.startsWith('```')) {
        aiResponse = aiResponse.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }
      
      // Try to find JSON object if response has extra text
      const jsonStart = aiResponse.indexOf('{');
      const jsonEnd = aiResponse.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        aiResponse = aiResponse.substring(jsonStart, jsonEnd + 1);
      }
      
      // Try to parse JSON response
      try {
        const analysis = JSON.parse(aiResponse);
        console.log('✅ Successfully parsed AI response JSON');
        
        // Convert new format to match database schema if needed
        const convertedAnalysis = this.convertToLegacyFormat(analysis);
        return convertedAnalysis;
      } catch (jsonError) {
        console.error('❌ JSON parsing failed:', jsonError);
        console.log('Raw AI response:', aiResponse.substring(0, 500));
        
        // Return a structured fallback response
        return this.createFallbackAnalysis(documentInfo, fileName, aiResponse);
      }
      
    } catch (error) {
      console.error('Groq API error:', error);
      return this.createFallbackAnalysis(documentInfo, fileName, `API Error: ${error.message}`);
    }
  }

  convertToLegacyFormat(newFormatAnalysis) {
    // Convert the new comprehensive format to the existing database schema format
    const converted = {
      // Patient details mapping
      patient_details: {
        name: newFormatAnalysis.patientInfo?.name || null,
        age: newFormatAnalysis.patientInfo?.age || null,
        gender: newFormatAnalysis.patientInfo?.gender || null,
        weight: null // Not in new format, keeping null
      },
      
      // Conditions mapping
      conditions_found: newFormatAnalysis.conditions?.map(c => c.name) || [],
      
      // Medications mapping
      medications: newFormatAnalysis.medications?.map(med => ({
        name: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration,
        verification_status: "needs_review", // Default value
        age_appropriate: true,
        weight_adjusted: false,
        safety_rating: "needs_review",
        notes: med.notes || ""
      })) || [],
      
      // Lab values mapping
      lab_values: newFormatAnalysis.labValues?.map(lab => ({
        parameter: lab.test,
        value: lab.value,
        unit: lab.normalRange ? lab.normalRange.split(' ').pop() : "",
        status: lab.status,
        reference_range: lab.normalRange,
        risk_level: lab.status === 'Abnormal' ? 'high' : 'low',
        interpretation: lab.interpretation || ""
      })) || [],
      
      // Risk assessment mapping
      risk_assessment: {
        overall_risk_level: newFormatAnalysis.riskAssessment?.level?.toLowerCase() || "moderate",
        cardiovascular_risk: "moderate", // Default
        diabetic_risk: "moderate", // Default
        medication_adherence_risk: "moderate", // Default
        high_risk_factors: newFormatAnalysis.riskAssessment?.factors || [],
        moderate_risk_factors: []
      },
      
      // Dosage recommendations (enhanced with new structure)
      dosage_recommendations: {
        current_dosages_appropriate: newFormatAnalysis.dosageRecommendations?.current_analysis?.includes('appropriate') || true,
        recommended_adjustments: newFormatAnalysis.dosageRecommendations?.specific_recommendations?.map(rec => ({
          medication: rec.medication,
          current_dose: rec.current_dose,
          recommended_dose: rec.recommended_dose,
          reason: rec.reason,
          urgency: "medium",
          timing: rec.timing,
          monitoring: rec.monitoring
        })) || [],
        new_medications_suggested: [],
        contraindications: [],
        monitoring_required: newFormatAnalysis.dosageRecommendations?.general_guidance || ["Regular follow-up recommended"],
        general_guidance: newFormatAnalysis.dosageRecommendations?.general_guidance || []
      },
      
      // Lifestyle recommendations mapping
      lifestyle_recommendations: {
        diet: newFormatAnalysis.recommendations?.filter(r => r.toLowerCase().includes('diet') || r.toLowerCase().includes('food') || r.toLowerCase().includes('sugar')) || ["Maintain balanced diet"],
        exercise: newFormatAnalysis.recommendations?.filter(r => r.toLowerCase().includes('exercise') || r.toLowerCase().includes('activity')) || ["Regular physical activity"],
        sleep: ["Maintain 7-8 hours of sleep", "Regular sleep schedule"],
        stress_management: ["Practice relaxation techniques"],
        monitoring: ["Monitor vital signs regularly"]
      },
      
      // Drug interactions (new structure)
      drug_interactions: {
        major_interactions: [],
        moderate_interactions: [],
        food_interactions: [],
        supplement_interactions: []
      },
      
      // Recommendations mapping
      recommendations: {
        immediate_actions: ["Schedule appointment with healthcare provider"],
        follow_up_required: ["Regular medical follow-up recommended"],
        lifestyle_changes: newFormatAnalysis.recommendations || [],
        red_flags: [],
        next_appointment: "Within 2-4 weeks"
      },
      
      // Summary fields
      prescription_verification_summary: "needs_review",
      overall_assessment: newFormatAnalysis.overallAssessment || "Medical document analyzed successfully.",
      confidence_score: 85,
      
      // New visualization data
      visualizations: newFormatAnalysis.visualizations || {
        riskGauge: newFormatAnalysis.riskAssessment?.score || 50,
        summary: {
          conditions: newFormatAnalysis.conditions?.length || 0,
          medications: newFormatAnalysis.medications?.length || 0,
          labValues: newFormatAnalysis.labValues?.length || 0,
          recommendations: newFormatAnalysis.recommendations?.length || 0
        }
      }
    };
    
    return converted;
  }

  verifyLabValues(labValues, gender) {
    const verifiedLabs = [];
    
    for (const lab of labValues || []) {
      // Handle both old and new parameter field names
      const parameter = (lab.parameter || lab.test || '').toLowerCase();
      const value = lab.value;
      
      if (!value || isNaN(parseFloat(value))) {
        continue;
      }
      
      const numericValue = parseFloat(value);
      
      // Find matching reference range
      let refKey = null;
      for (const key of Object.keys(this.referenceRanges)) {
        if (key.split('_').some(keyword => parameter.includes(keyword))) {
          refKey = key;
          break;
        }
      }
      
      if (refKey) {
        let refRange = this.referenceRanges[refKey];
        
        // Handle gender-specific ranges
        if (refKey.includes('male') && gender?.toLowerCase() === 'female') {
          const femaleKey = refKey.replace('male', 'female');
          if (this.referenceRanges[femaleKey]) {
            refRange = this.referenceRanges[femaleKey];
          }
        }
        
        // Determine status
        let status = 'normal';
        if (numericValue < refRange.min) {
          status = 'low';
        } else if (numericValue > refRange.max) {
          status = 'high';
        }
        
        lab.status = status;
        lab.reference_range = `${refRange.min}-${refRange.max} ${refRange.unit}`;
        
        // Add interpretation for new format
        if (!lab.interpretation) {
          if (status === 'high') {
            lab.interpretation = `Above normal range - may indicate health concern`;
          } else if (status === 'low') {
            lab.interpretation = `Below normal range - may indicate deficiency`;
          } else {
            lab.interpretation = `Within normal range`;
          }
        }
      }
      
      verifiedLabs.push(lab);
    }
    
    return verifiedLabs;
  }

  createFallbackAnalysis(documentInfo, fileName, rawResponse) {
    console.log('⚠️ Creating fallback analysis due to JSON parsing failure');
    
    // Extract basic information from filename and content
    const fileNameLower = fileName.toLowerCase();
    const contentLower = documentInfo.extractedText.toLowerCase();
    
    // Try to detect medical conditions from filename/content
    const detectedConditions = [];
    const conditionKeywords = {
      'diabetes': ['diabetes', 'diabetic', 'blood sugar', 'glucose', 'hba1c'],
      'hypertension': ['hypertension', 'blood pressure', 'bp', 'systolic', 'diastolic'],
      'hyperlipidemia': ['cholesterol', 'lipid', 'triglycerides', 'ldl', 'hdl'],
      'heart disease': ['cardiac', 'heart', 'cardiovascular', 'ecg', 'ekg'],
      'kidney disease': ['kidney', 'renal', 'creatinine', 'urea', 'dialysis']
    };
    
    Object.entries(conditionKeywords).forEach(([condition, keywords]) => {
      if (keywords.some(keyword => fileNameLower.includes(keyword) || contentLower.includes(keyword))) {
        detectedConditions.push(condition);
      }
    });
    
    // Try to detect medications
    const detectedMedications = [];
    const commonMeds = {
      'metformin': ['metformin'],
      'lisinopril': ['lisinopril'],
      'atorvastatin': ['atorvastatin', 'lipitor'],
      'amlodipine': ['amlodipine'],
      'insulin': ['insulin']
    };
    
    Object.entries(commonMeds).forEach(([med, variations]) => {
      if (variations.some(variant => contentLower.includes(variant))) {
        detectedMedications.push({
          name: med,
          dosage: "Dosage not clearly extracted",
          frequency: "Frequency not specified",
          duration: "Duration not specified",
          verification_status: "needs_review",
          age_appropriate: true,
          weight_adjusted: false,
          safety_rating: "needs_review"
        });
      }
    });
    
    return {
      // New comprehensive format
      patientInfo: {
        name: "Not available",
        age: "Not available",
        gender: "Not available",
        reportDate: new Date().toISOString().split('T')[0],
        doctor: "Not available"
      },
      conditions: detectedConditions.length > 0 ? 
        detectedConditions.map(condition => ({
          name: condition,
          confidence: 60,
          context: `Detected from document content`
        })) : [{
          name: "Unable to extract conditions from document",
          confidence: 25,
          context: "Document analysis was limited"
        }],
      riskAssessment: {
        level: "Moderate",
        score: 50,
        factors: ["Incomplete document analysis", "Limited text extraction", "Requires manual review"]
      },
      medications: detectedMedications.length > 0 ? detectedMedications.map(med => ({
        name: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration,
        notes: "Requires verification"
      })) : [],
      labValues: [],
      recommendations: [
        "Schedule appointment with healthcare provider",
        "Bring original documents to appointment",
        "Monitor symptoms regularly",
        "Follow prescribed medication schedule",
        "Maintain healthy lifestyle"
      ],
      visualizations: {
        riskGauge: 50,
        summary: {
          conditions: detectedConditions.length,
          medications: detectedMedications.length,
          labValues: 0,
          recommendations: 5
        }
      },
      overallAssessment: `Document analysis was limited due to processing constraints. The file "${fileName}" was uploaded successfully but requires manual review by a healthcare professional. ${rawResponse ? 'AI processing encountered formatting issues.' : 'Text extraction was limited.'}`
    };
  }

  checkDrugInteractions(medications) {
    const interactions = [];
    const drugInteractions = {
      "warfarin": ["aspirin", "ibuprofen", "naproxen"],
      "metformin": ["alcohol", "contrast dye"],
      "lisinopril": ["potassium supplements", "spironolactone"],
      "simvastatin": ["erythromycin", "clarithromycin", "gemfibrozil"]
    };

    const medNames = (medications || []).map(med => med.name?.toLowerCase() || '');
    
    for (const med of medNames) {
      if (drugInteractions[med]) {
        for (const interactionMed of drugInteractions[med]) {
          if (medNames.includes(interactionMed)) {
            interactions.push(`Potential interaction: ${med} and ${interactionMed}`);
          }
        }
      }
    }
    
    return interactions;
  }

  async analyzeMedicalDocument(filePath, originalFileName) {
    try {
      // Extract text using enhanced methods (with OCR when available)
      const documentInfo = await this.extractTextFromFile(filePath);
      
      console.log(`📄 Extracted ${documentInfo.extractedText.length} characters from ${originalFileName}`);
      console.log(`🔍 OCR used: ${documentInfo.ocrUsed}`);
      
      // Analyze with AI
      const analysis = await this.analyzeWithGroq(documentInfo, originalFileName);
      
      // Post-process analysis
      if (analysis.lab_values && analysis.lab_values.length > 0) {
        const gender = analysis.patient_details?.gender;
        analysis.lab_values = this.verifyLabValues(analysis.lab_values, gender);
      }
      
      // Check drug interactions
      if (analysis.medications && analysis.medications.length > 0) {
        const interactions = this.checkDrugInteractions(analysis.medications);
        if (interactions.length > 0) {
          if (!analysis.recommendations) {
            analysis.recommendations = {};
          }
          if (!analysis.recommendations.red_flags) {
            analysis.recommendations.red_flags = [];
          }
          analysis.recommendations.red_flags.push(...interactions);
        }
      }
      
      // Add metadata
      analysis.analysis_timestamp = new Date().toISOString();
      analysis.extracted_text = documentInfo.extractedText.substring(0, 500) + 
        (documentInfo.extractedText.length > 500 ? "..." : "");
      analysis.file_info = {
        size: documentInfo.fileSize,
        type: documentInfo.fileType,
        original_name: originalFileName,
        ocr_used: documentInfo.ocrUsed
      };
      
      // Enhanced assessment based on extraction quality
      if (!analysis.overall_assessment) {
        analysis.overall_assessment = "Document uploaded successfully. ";
      }
      
      if (documentInfo.ocrUsed) {
        analysis.overall_assessment += " Advanced OCR text extraction was performed for comprehensive analysis.";
      } else {
        analysis.overall_assessment += " Basic text extraction was performed. For enhanced analysis of images/PDFs, ensure Tesseract OCR is available.";
      }
      
      // Add extraction quality indicator
      analysis.extraction_quality = {
        text_length: documentInfo.extractedText.length,
        ocr_used: documentInfo.ocrUsed,
        confidence: documentInfo.extractedText.length > 200 ? 'high' : 
                   documentInfo.extractedText.length > 50 ? 'medium' : 'low'
      };
      
      return analysis;
      
    } catch (error) {
      console.error('Error analyzing medical document:', error);
      return {
        error: `Analysis failed: ${error.message}`,
        prescription_verification_summary: "needs_review",
        overall_assessment: "Failed to analyze document. Please ensure the file is valid and try again.",
        analysis_timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = MedicalAnalysisService;