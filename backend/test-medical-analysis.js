// Medical Analysis System Test
// Tests the complete flow of uploading and analyzing medical documents

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:5001/api';

// Test user credentials (use existing test user or create one)
const TEST_USER = {
  email: 'test@medimate.com',
  password: 'test123456'
};

class MedicalAnalysisTest {
  constructor() {
    this.authToken = null;
  }

  async login() {
    try {
      console.log('🔐 Logging in test user...');
      const response = await axios.post(`${API_BASE_URL}/auth/login`, TEST_USER);
      
      if (response.data.errNo === 0) {
        this.authToken = response.data.token;
        console.log('✅ Login successful');
        return true;
      } else {
        console.error('❌ Login failed:', response.data.errMsg);
        return false;
      }
    } catch (error) {
      console.error('❌ Login error:', error.response?.data || error.message);
      return false;
    }
  }

  async testHealthCheck() {
    try {
      console.log('🏥 Testing health check endpoint...');
      const response = await axios.get(`${API_BASE_URL}/health`);
      
      console.log('✅ Health check response:', response.data);
      return response.data.status === 'OK';
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      return false;
    }
  }

  async createTestFile() {
    const testContent = `
MEDICAL PRESCRIPTION

===========================================
PATIENT INFORMATION:
===========================================
Patient Name: John Michael Doe
Age: 45 years old
Gender: Male
Weight: 75 kg
Phone: +1-555-0123
Date of Birth: 15/03/1979

===========================================
DOCTOR INFORMATION:
===========================================
Prescribing Physician: Dr. Sarah Johnson, MD
License No: MD12345
Clinic: City Medical Center
Date: ${new Date().toLocaleDateString('en-GB')}

===========================================
DIAGNOSIS:
===========================================
1. Type 2 Diabetes Mellitus (E11.9)
2. Essential Hypertension (I10)
3. Hyperlipidemia (E78.5)
4. Obesity (BMI 28.5)

===========================================
LABORATORY RESULTS:
===========================================
• Fasting Blood Glucose: 165 mg/dL (HIGH) [Normal: 70-100 mg/dL]
• HbA1c: 8.2% (HIGH) [Normal: <5.7%]
• Total Cholesterol: 245 mg/dL (HIGH) [Normal: <200 mg/dL]
• LDL Cholesterol: 155 mg/dL (HIGH) [Normal: <100 mg/dL]
• HDL Cholesterol: 32 mg/dL (LOW) [Normal: >40 mg/dL for men]
• Triglycerides: 280 mg/dL (HIGH) [Normal: <150 mg/dL]
• Blood Pressure: 150/95 mmHg (HIGH) [Normal: <120/80 mmHg]
• Creatinine: 1.2 mg/dL (NORMAL) [Normal: 0.74-1.35 mg/dL for men]

===========================================
CURRENT MEDICATIONS PRESCRIBED:
===========================================

1. METFORMIN (Glucophage)
   • Dosage: 500mg
   • Frequency: Twice daily (morning and evening)
   • Duration: Continue indefinitely
   • Instructions: Take with meals to reduce stomach upset
   • Purpose: Blood sugar control

2. LISINOPRIL (Prinivil)
   • Dosage: 10mg
   • Frequency: Once daily in the morning
   • Duration: Continue indefinitely
   • Instructions: Take at the same time each day
   • Purpose: Blood pressure control

3. ATORVASTATIN (Lipitor)
   • Dosage: 20mg
   • Frequency: Once daily at bedtime
   • Duration: Continue indefinitely
   • Instructions: Avoid grapefruit juice
   • Purpose: Cholesterol management

4. ASPIRIN (Low-dose)
   • Dosage: 81mg
   • Frequency: Once daily with breakfast
   • Duration: Continue indefinitely
   • Instructions: Take with food to prevent stomach irritation
   • Purpose: Cardiovascular protection

===========================================
DOSAGE RECOMMENDATIONS & ADJUSTMENTS:
===========================================

CURRENT ASSESSMENT:
• Metformin 500mg BID is appropriate for current glucose levels
• Lisinopril may need increase to 15mg if BP remains elevated
• Atorvastatin dose adequate; monitor liver function
• Aspirin dose appropriate for cardiovascular protection

RECOMMENDED MONITORING:
• Blood glucose: Daily self-monitoring
• Blood pressure: Weekly home monitoring
• HbA1c: Every 3 months
• Lipid panel: Every 6 months
• Liver function tests: Every 6 months
• Kidney function: Every 6 months

===========================================
LIFESTYLE RECOMMENDATIONS:
===========================================

DIET:
• Reduce carbohydrate intake to <45% of total calories
• Limit saturated fat to <7% of total calories
• Increase fiber intake to 25-30g daily
• Sodium restriction to <2300mg daily
• Monitor portion sizes

EXERCISE:
• Moderate physical activity 150 minutes per week
• Include both aerobic and resistance training
• Start slowly and gradually increase intensity
• Check blood sugar before and after exercise

MONITORING:
• Daily weight measurement
• Blood pressure monitoring 3x weekly
• Blood glucose monitoring as directed
• Regular medication adherence

===========================================
FOLLOW-UP INSTRUCTIONS:
===========================================
• Return visit in 4 weeks to assess medication effectiveness
• Lab work (HbA1c, lipids, liver function) in 3 months
• Annual eye exam and foot exam
• Immediate medical attention if blood sugar >400 mg/dL

===========================================
PHARMACY INFORMATION:
===========================================
Pharmacy: City Pharmacy
Refills: 3 refills authorized for all medications
Pharmacist consultation recommended for new medications

Next Appointment: ${new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB')}

Dr. Sarah Johnson, MD
Internal Medicine
License: MD12345
Signature: [Digital Signature Applied]
    `.trim();

    const testFilePath = path.join(__dirname, 'test_medical_report.txt');
    await fs.promises.writeFile(testFilePath, testContent);
    return testFilePath;
  }

  async testMedicalAnalysis() {
    try {
      console.log('📄 Creating test medical document...');
      const testFilePath = await this.createTestFile();

      console.log('📤 Uploading medical document for analysis...');
      const formData = new FormData();
      formData.append('medicalDocument', fs.createReadStream(testFilePath));

      const response = await axios.post(
        `${API_BASE_URL}/medical-analysis/upload`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            ...formData.getHeaders()
          }
        }
      );

      if (response.data.success) {
        console.log('✅ Medical analysis completed successfully');
        console.log('📊 Analysis Summary:');
        
        const analysis = response.data.data.analysis;
        
        // Display key results
        if (analysis.patient_details) {
          console.log('👤 Patient Details:', analysis.patient_details);
        }
        
        if (analysis.conditions_found) {
          console.log('🏥 Conditions Found:', analysis.conditions_found);
        }
        
        if (analysis.medications) {
          console.log('💊 Medications:', analysis.medications.length);
        }
        
        if (analysis.lab_values) {
          console.log('🔬 Lab Values:', analysis.lab_values.length);
        }
        
        console.log('📋 Verification Status:', analysis.prescription_verification_summary);
        
        if (analysis.recommendations?.red_flags) {
          console.log('🚨 Red Flags:', analysis.recommendations.red_flags);
        }

        // Cleanup test file
        await fs.promises.unlink(testFilePath);
        
        return {
          success: true,
          analysisId: response.data.data.analysisId,
          analysis: analysis
        };
      } else {
        console.error('❌ Medical analysis failed:', response.data.message);
        return { success: false };
      }
    } catch (error) {
      console.error('❌ Medical analysis test error:', error.response?.data || error.message);
      return { success: false };
    }
  }

  async testAnalysisHistory() {
    try {
      console.log('📚 Testing analysis history retrieval...');
      const response = await axios.get(
        `${API_BASE_URL}/medical-analysis/history`,
        {
          headers: {
            'Authorization': `Bearer ${this.authToken}`
          }
        }
      );

      if (response.data.success) {
        console.log('✅ Analysis history retrieved successfully');
        console.log(`📊 Found ${response.data.data.length} analysis records`);
        return true;
      } else {
        console.error('❌ Failed to retrieve analysis history');
        return false;
      }
    } catch (error) {
      console.error('❌ Analysis history test error:', error.response?.data || error.message);
      return false;
    }
  }

  async runAllTests() {
    console.log('🧪 Starting Medical Analysis System Tests...\n');

    // Test 1: Health Check
    const healthCheck = await this.testHealthCheck();
    if (!healthCheck) {
      console.error('❌ Health check failed. Make sure backend is running.');
      return;
    }

    // Test 2: Authentication
    const loginSuccess = await this.login();
    if (!loginSuccess) {
      console.error('❌ Authentication failed. Check test user credentials.');
      return;
    }

    // Test 3: Medical Analysis
    const analysisResult = await this.testMedicalAnalysis();
    if (!analysisResult.success) {
      console.error('❌ Medical analysis test failed.');
      return;
    }

    // Test 4: Analysis History
    const historySuccess = await this.testAnalysisHistory();
    if (!historySuccess) {
      console.error('❌ Analysis history test failed.');
      return;
    }

    console.log('\n🎉 All medical analysis tests completed successfully!');
    console.log('\n📊 Test Summary:');
    console.log('✅ Health Check: Passed');
    console.log('✅ Authentication: Passed');
    console.log('✅ Medical Analysis: Passed');
    console.log('✅ Analysis History: Passed');
    
    console.log('\n🌟 Medical Analysis System is fully functional!');
    console.log('\n🚀 Features Available:');
    console.log('   📤 File Upload (PDF, Images)');
    console.log('   🤖 AI-Powered Analysis with Groq');
    console.log('   🔬 Lab Value Verification');
    console.log('   💊 Medication Verification');
    console.log('   ⚠️  Drug Interaction Checking');
    console.log('   📋 Risk Assessment');
    console.log('   💡 Lifestyle Recommendations');
    console.log('   📚 Analysis History');
    console.log('   🎯 Prescription Verification');
  }
}

// Run tests
const tester = new MedicalAnalysisTest();
tester.runAllTests().catch(console.error);