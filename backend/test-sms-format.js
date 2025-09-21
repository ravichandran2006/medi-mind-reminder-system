// Test SMS phone number formatting
const SMSService = require('./smsService');

async function testSMSFormatting() {
  console.log('🧪 Testing SMS Phone Number Formatting');
  console.log('=====================================\n');

  const testNumbers = [
    '+919952608247',  // Indian number with +91
    '9952608247',     // Indian number without +91
    '+1234567890',    // US number with +1
    '2345678901',     // US number without +1
    '1234567890',     // Invalid (starts with 1)
    '123456789',      // Too short
    '12345678901',    // Too long
  ];

  testNumbers.forEach(number => {
    const formatted = SMSService.formatPhoneNumber(number);
    console.log(`Input: ${number.padEnd(15)} → Output: ${formatted}`);
  });

  console.log('\n✅ Phone number formatting test completed');
}

testSMSFormatting();