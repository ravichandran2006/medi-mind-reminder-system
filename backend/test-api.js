#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test data
const testUser = {
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  phone: '+1234567890',
  password: 'password123'
};

let authToken = null;

async function testAPI() {
  console.log('🧪 Testing MediMate Backend API...\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing health check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data.message);
    console.log('');

    // Test 2: User Registration
    console.log('2️⃣ Testing user registration...');
    const signupResponse = await axios.post(`${BASE_URL}/auth/signup`, testUser);
    authToken = signupResponse.data.token;
    console.log('✅ User registration successful');
    console.log('   User ID:', signupResponse.data.user.id);
    console.log('');

    // Test 3: User Login
    console.log('3️⃣ Testing user login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    authToken = loginResponse.data.token;
    console.log('✅ User login successful');
    console.log('');

    // Test 4: Get User Profile
    console.log('4️⃣ Testing get user profile...');
    const profileResponse = await axios.get(`${BASE_URL}/user/profile`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Get profile successful');
    console.log('   User:', `${profileResponse.data.user.firstName} ${profileResponse.data.user.lastName}`);
    console.log('');

    // Test 5: Add Medication
    console.log('5️⃣ Testing add medication...');
    const medicationData = {
      name: 'Test Medication',
      dosage: '10mg',
      frequency: 'daily',
      times: ['09:00', '21:00'],
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      startDate: new Date().toISOString().split('T')[0],
      reminders: true
    };
    
    const medicationResponse = await axios.post(`${BASE_URL}/medications`, medicationData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Add medication successful');
    console.log('   Medication ID:', medicationResponse.data.medication.id);
    console.log('');

    // Test 6: Get Medications
    console.log('6️⃣ Testing get medications...');
    const medicationsResponse = await axios.get(`${BASE_URL}/medications`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Get medications successful');
    console.log('   Medications count:', medicationsResponse.data.medications.length);
    console.log('');

    // Test 7: Add Health Data
    console.log('7️⃣ Testing add health data...');
    const healthData = {
      type: 'blood_pressure',
      value: '120/80',
      notes: 'Normal reading'
    };
    
    const healthResponse = await axios.post(`${BASE_URL}/health-data`, healthData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Add health data successful');
    console.log('   Health data ID:', healthResponse.data.healthData.id);
    console.log('');

    // Test 8: Get Health Data
    console.log('8️⃣ Testing get health data...');
    const getHealthResponse = await axios.get(`${BASE_URL}/health-data`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Get health data successful');
    console.log('   Health data count:', getHealthResponse.data.healthData.length);
    console.log('');

    // Test 9: Validate Phone Number
    console.log('9️⃣ Testing phone number validation...');
    const phoneValidationResponse = await axios.post(`${BASE_URL}/sms/validate-phone`, {
      phoneNumber: '+1234567890'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Phone validation successful');
    console.log('   Is valid:', phoneValidationResponse.data.isValid);
    console.log('   Formatted:', phoneValidationResponse.data.formatted);
    console.log('');

    // Test 10: Check SMS Service Status
    console.log('🔟 Testing SMS service status...');
    const smsStatusResponse = await axios.get(`${BASE_URL}/sms/status`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ SMS status check successful');
    console.log('   Configured:', smsStatusResponse.data.status.configured);
    console.log('   Available:', smsStatusResponse.data.status.available);
    console.log('');

    // Test 11: Send Test SMS
    console.log('1️⃣1️⃣ Testing SMS sending...');
    const testSmsResponse = await axios.post(`${BASE_URL}/sms/test`, {
      phoneNumber: '+1234567890',
      message: 'Test message from MediMate'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Test SMS sent successfully');
    console.log('   Message ID:', testSmsResponse.data.messageId);
    console.log('   Dev Mode:', testSmsResponse.data.devMode || false);
    console.log('');

    // Test 12: Schedule Medication Reminder
    console.log('1️⃣2️⃣ Testing medication reminder scheduling...');
    const scheduleResponse = await axios.post(`${BASE_URL}/sms/schedule-medication`, {
      medicationId: medicationResponse.data.medication.id
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Medication reminder scheduled successfully');
    console.log('');

    // Test 13: Get Scheduled Jobs
    console.log('1️⃣3️⃣ Testing scheduled jobs retrieval...');
    const jobsResponse = await axios.get(`${BASE_URL}/sms/scheduled-jobs`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Scheduled jobs retrieved successfully');
    console.log('   Jobs count:', jobsResponse.data.jobs.length);
    console.log('   Users:', jobsResponse.data.status.users);
    console.log('   Medications:', jobsResponse.data.status.medications);
    console.log('');

    console.log('🎉 All API tests passed successfully!');
    console.log('');
    console.log('📋 Test Summary:');
    console.log('   ✅ Health check');
    console.log('   ✅ User registration');
    console.log('   ✅ User login');
    console.log('   ✅ Get user profile');
    console.log('   ✅ Add medication');
    console.log('   ✅ Get medications');
    console.log('   ✅ Add health data');
    console.log('   ✅ Get health data');
    console.log('   ✅ Phone validation');
    console.log('   ✅ SMS service status');
    console.log('   ✅ Test SMS sending');
    console.log('   ✅ Medication reminder scheduling');
    console.log('   ✅ Scheduled jobs retrieval');
    console.log('');
    console.log('🚀 Backend is ready for use!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('   1. Make sure the server is running (npm start)');
    console.log('   2. Check that all environment variables are set');
    console.log('   3. Verify the server is running on port 5000');
    console.log('   4. Check the server logs for errors');
    
    process.exit(1);
  }
}

// Check if axios is installed
try {
  require('axios');
} catch (error) {
  console.log('❌ axios is not installed!');
  console.log('📝 Please install it: npm install axios');
  process.exit(1);
}

// Run the tests
testAPI(); 