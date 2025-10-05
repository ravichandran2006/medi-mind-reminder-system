const mongoose = require('mongoose');
const SMSService = require('./smsService');
require('dotenv').config();

async function testChrisSMS() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medimate');
    console.log('✅ Connected to MongoDB');
    
    const User = require('./models/User');
    const MedicationForm = require('./models/MedicationForm');
    
    // Get Chris Evans and his medications
    const chrisUser = await User.findOne({ email: 'chris@gmail.com' });
    const medications = await MedicationForm.find({ userId: chrisUser._id.toString() });
    
    console.log(`👤 Testing SMS for: ${chrisUser.firstName} ${chrisUser.lastName}`);
    console.log(`📱 Phone: ${chrisUser.phone}`);
    console.log(`💊 Medications: ${medications.length}`);
    
    if (medications.length > 0) {
      const med = medications[0]; // Test with first medication
      console.log(`\n🔔 Sending test SMS for: ${med.medicationName}`);
      
      // Format phone number properly
      let phoneNumber = chrisUser.phone;
      if (!phoneNumber.startsWith('+')) {
        phoneNumber = '+91' + phoneNumber; // Add India country code
      }
      
      console.log(`📱 Formatted phone: ${phoneNumber}`);
      
      // Send test SMS
      const result = await SMSService.sendMedicationReminder(
        phoneNumber,
        chrisUser.firstName,
        med.medicationName,
        'Now (Test)',
        '1 tablet',
        'Take with food',
        med._id
      );
      
      console.log('\n📨 SMS Result:', result);
      
      if (result.success) {
        console.log('✅ SMS sent successfully!');
        console.log('📱 Check your phone for the reminder');
      } else if (result.code === 'UNVERIFIED_PHONE') {
        console.log('❌ ISSUE: Phone number needs to be verified in Twilio');
        console.log('🔧 SOLUTION OPTIONS:');
        console.log('   1. Verify the phone number at: https://console.twilio.com/us1/develop/phone-numbers/manage/verified');
        console.log('   2. Or upgrade Twilio account to send to unverified numbers');
        console.log('   3. Or use a different verified phone number for testing');
      } else {
        console.log('❌ SMS failed:', result.error);
      }
    }
    
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testChrisSMS();