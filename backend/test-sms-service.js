const SMSService = require('./smsService');

console.log('='.repeat(60));
console.log('SMS Service Test');
console.log('='.repeat(60));
console.log('');

// Test 1: Check service status
console.log('📊 Service Status:');
const status = SMSService.getStatus();
console.log(JSON.stringify(status, null, 2));
console.log('');

// Test 2: Check if service is available
console.log('🔍 Service Availability:');
console.log(`Available: ${SMSService.isAvailable()}`);
console.log('');

// Test 3: Test phone number validation
console.log('📱 Phone Number Validation Tests:');
const testPhones = [
  '+12345678901',
  '2345678901',
  '+919876543210',
  '9876543210',
  'invalid',
  ''
];

testPhones.forEach(phone => {
  const isValid = SMSService.validatePhoneNumber(phone);
  const formatted = SMSService.formatPhoneNumber(phone);
  console.log(`  Phone: ${phone || '(empty)'}`);
  console.log(`    Valid: ${isValid}`);
  console.log(`    Formatted: ${formatted || 'null'}`);
  console.log('');
});

// Test 4: Test sending medication reminder (will run in dev mode if Twilio not configured)
console.log('💊 Testing Medication Reminder:');
console.log('');

async function testMedicationReminder() {
  const result = await SMSService.sendMedicationReminder(
    '+12345678901',
    'John Doe',
    'Aspirin',
    '10:00 AM',
    '100mg',
    'Take with food',
    'med123'
  );
  console.log('Result:', JSON.stringify(result, null, 2));
  console.log('');
}

// Test 5: Test sending health log reminder
async function testHealthLogReminder() {
  console.log('📋 Testing Health Log Reminder:');
  const result = await SMSService.sendHealthLogReminder(
    '+12345678901',
    'John Doe'
  );
  console.log('Result:', JSON.stringify(result, null, 2));
  console.log('');
}

// Test 6: Test sending appointment reminder
async function testAppointmentReminder() {
  console.log('📅 Testing Appointment Reminder:');
  const result = await SMSService.sendAppointmentReminder(
    '+12345678901',
    'John Doe',
    '2024-01-15',
    '2:00 PM'
  );
  console.log('Result:', JSON.stringify(result, null, 2));
  console.log('');
}

// Test 7: Test sending health alert
async function testHealthAlert() {
  console.log('🚨 Testing Health Alert:');
  const result = await SMSService.sendHealthAlert(
    '+12345678901',
    'John Doe',
    'HIGH_BLOOD_PRESSURE',
    'Your blood pressure reading is above normal range'
  );
  console.log('Result:', JSON.stringify(result, null, 2));
  console.log('');
}

// Run all async tests
(async () => {
  await testMedicationReminder();
  await testHealthLogReminder();
  await testAppointmentReminder();
  await testHealthAlert();
  
  console.log('='.repeat(60));
  console.log('✅ All tests completed!');
  console.log('='.repeat(60));
})();

