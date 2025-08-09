const SMSService = require('./smsService');
const User = require('./models/User');

// Test data - this should match your actual signup data
const testUser = {
  id: '1',
  firstName: 'Sudharsan',
  lastName: 'Vs',
  phone: '+919952608247', // Replace with your actual phone number used during signup
  email: 'sudharsanv0607@gmail.com'
};

const testMedication = {
  id: '1',
  userId: '1',
  name: 'Vitamin D',
  dosage: '500mg, 2 tablet',
  frequency: 'twice',
  times: ['09:20', '21:00'],
  startDate: '2025-08-02',
  endDate: '2025-08-09',
  days: ['thursday'],
  instructions: 'take tablet after the food',
  reminders: true
};

async function testUserSMS() {
  console.log('🧪 Testing User SMS with Real Phone Number...\n');

  // Check SMS service status
  console.log('📱 SMS Service Status:');
  const status = SMSService.getStatus();
  console.log(`   Configured: ${status.configured}`);
  console.log(`   Available: ${status.available}`);
  console.log(`   Account SID: ${status.accountSid}`);
  console.log(`   Phone Number: ${status.phoneNumber}`);

  if (!status.available) {
    console.log('\n❌ SMS service not available. Please check your Twilio credentials.');
    return;
  }

  // Test phone number formatting
  console.log('\n📞 Phone Number Testing:');
  console.log(`   Original: ${testUser.phone}`);
  const formattedPhone = SMSService.formatPhoneNumber(testUser.phone);
  console.log(`   Formatted: ${formattedPhone}`);
  console.log(`   Valid: ${SMSService.validatePhoneNumber(formattedPhone)}`);

  if (!formattedPhone) {
    console.log('\n❌ Invalid phone number format. Please check your phone number.');
    return;
  }

  // Test SMS sending
  console.log('\n📱 Testing SMS Sending:');
  const userName = `${testUser.firstName} ${testUser.lastName}`;
  
  try {
    const result = await SMSService.sendMedicationReminder(
      formattedPhone,
      userName,
      testMedication.name,
      '09:20'
    );

    if (result.success) {
      console.log('✅ SMS test completed successfully!');
      if (result.devMode) {
        console.log('📝 Note: This was sent in DEV MODE (logged but not actually sent)');
      } else {
        console.log(`📱 Real SMS sent with ID: ${result.messageId}`);
      }
    } else {
      console.log('❌ SMS test failed:');
      console.log(`   Error: ${result.error}`);
      console.log(`   Code: ${result.code}`);
    }
  } catch (error) {
    console.error('❌ Unexpected error during SMS test:', error);
  }

  console.log('\n🔧 To fix SMS issues:');
  console.log('   1. Make sure your Twilio credentials are correct in .env file');
  console.log('   2. Verify your Twilio phone number is active');
  console.log('   3. Check that your phone number is in the correct format (+country code)');
  console.log('   4. Ensure your Twilio account has sufficient credits');
}

// Run the test
testUserSMS().catch(console.error); 