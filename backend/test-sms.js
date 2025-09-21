require('dotenv').config();
const SMSService = require('./smsService');

async function testSMS() {
  console.log('🔍 Testing SMS Configuration...');
  console.log('');
  
  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log('   TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? `${process.env.TWILIO_ACCOUNT_SID.substring(0, 10)}...` : 'Missing');
  console.log('   TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? `${process.env.TWILIO_AUTH_TOKEN.substring(0, 10)}...` : 'Missing');
  console.log('   TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER || 'Missing');
  console.log('');
  
  // Check SMS service status
  console.log('📱 SMS Service Status:');
  const status = SMSService.getStatus();
  console.log('   Configured:', status.configured);
  console.log('   Available:', status.available);
  console.log('   Account SID:', status.accountSid);
  console.log('   Phone Number:', status.phoneNumber);
  console.log('');
  
  // Test phone number formatting
  const testPhone = '+919876543210'; // Replace with your actual phone number
  console.log('📞 Testing Phone Number Formatting:');
  console.log('   Input:', testPhone);
  console.log('   Formatted:', SMSService.formatPhoneNumber(testPhone));
  console.log('   Valid:', SMSService.validatePhoneNumber(testPhone));
  console.log('');
  
  // Test SMS sending
  console.log('📤 Testing SMS Send...');
  try {
    const result = await SMSService.sendMedicationReminder(
      testPhone,
      'Test User',
      'Vitamin D',
      '15:30',
      '1000mg',
      'Take with food'
    );
    
    console.log('   Result:', result);
    
    if (result.success) {
      console.log('✅ SMS test successful!');
      if (result.devMode) {
        console.log('⚠️  Running in DEV MODE - no actual SMS sent');
      } else {
        console.log('📱 Real SMS sent with ID:', result.messageId);
      }
    } else {
      console.log('❌ SMS test failed:', result.error);
      console.log('   Error code:', result.code);
      if (result.twilioCode) {
        console.log('   Twilio error code:', result.twilioCode);
      }
    }
  } catch (error) {
    console.log('❌ SMS test error:', error.message);
  }
}

testSMS().catch(console.error);
