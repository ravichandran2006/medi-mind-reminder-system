require('dotenv').config();
const SMSService = require('./smsService');

// The phone number provided by the user
const phoneNumber = '9952608247';

// Test sending an SMS in development mode
async function testSendSMS() {
  console.log('Testing SMS service in development mode...');
  
  // Get SMS service status
  const status = SMSService.getStatus();
  console.log('SMS Service Status:', status);
  
  // Force development mode by overriding the isAvailable method
  const originalIsAvailable = SMSService.isAvailable;
  SMSService.isAvailable = () => false;
  
  console.log('\n📱 Testing in development mode (no actual SMS will be sent)');
  console.log(`Attempting to send SMS to: ${phoneNumber}`);
  
  try {
    const result = await SMSService.sendMedicationReminder(
      phoneNumber,
      'Test User',
      'Test Medication',
      '10:00 AM'
    );
    
    console.log('\nSMS Result:', result);
    
    if (result.success && result.devMode) {
      console.log('✅ Test successful! SMS would be sent in production mode.');
      console.log('✅ The SMS reminder system is working correctly in development mode.');
      console.log(`✅ Message would be sent to ${phoneNumber} for medication 'Test Medication' at '10:00 AM'`);
    } else if (result.success) {
      console.log('✅ SMS sent successfully in production mode!');
    } else {
      console.log('❌ Failed to send SMS:', result.error);
      console.log('Error code:', result.code);
    }
    
    // Restore original method
    SMSService.isAvailable = originalIsAvailable;
  } catch (error) {
    console.error('❌ Error in test:', error);
    // Restore original method
    SMSService.isAvailable = originalIsAvailable;
  }
}

// Run the test
testSendSMS();