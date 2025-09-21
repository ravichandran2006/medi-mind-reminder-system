// Test immediate SMS sending
require('dotenv').config();

console.log('Testing immediate SMS...');

// Check environment
console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? 'SET' : 'MISSING');
console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? 'SET' : 'MISSING'); 
console.log('TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER || 'MISSING');

// Test SMS service
const SMSService = require('./smsService');

async function testSMS() {
  try {
    // Replace with your actual phone number
    const testPhone = '+919952608247'; // ⚠️ CHANGE THIS TO YOUR ACTUAL PHONE NUMBER
    
    console.log('\nTesting SMS to:', testPhone);
    
    const result = await SMSService.sendMedicationReminder(
      testPhone,
      'Test User',
      'Calcium',
      '15:30',
      '500mg',
      'Take with food'
    );
    
    console.log('SMS Result:', result);
    
    if (result.success) {
      if (result.devMode) {
        console.log('⚠️ SMS sent in DEV MODE (not real SMS)');
      } else {
        console.log('✅ Real SMS sent successfully!');
      }
    } else {
      console.log('❌ SMS failed:', result.error);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testSMS();
