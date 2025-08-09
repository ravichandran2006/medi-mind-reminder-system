const NotificationScheduler = require('./notificationScheduler');
const SMSService = require('./smsService');

// Test data
const testUsers = [
  {
    id: '1',
    firstName: 'Test',
    lastName: 'User',
    phone: '+1234567890',
    email: 'test@example.com'
  }
];

const testMedications = [
  {
    id: '1',
    userId: '1',
    name: 'Vitamin D',
    dosage: '1000mg',
    frequency: 'once',
    times: ['09:20'],
    startDate: '2025-08-02',
    endDate: '2025-08-09',
    days: ['thursday'],
    instructions: 'Take with food',
    reminders: true
  }
];

async function testSMSScheduling() {
  console.log('🧪 Testing SMS Scheduling System...\n');

  // Initialize notification scheduler
  const scheduler = new NotificationScheduler();
  scheduler.setData(testUsers, testMedications);

  console.log('📊 Current Data:');
  console.log(`   Users: ${testUsers.length}`);
  console.log(`   Medications: ${testMedications.length}`);

  // Test SMS service availability
  console.log('\n📱 SMS Service Status:');
  console.log(`   Available: ${SMSService.isAvailable()}`);
  
  if (!SMSService.isAvailable()) {
    console.log('   ⚠️  Running in DEV MODE - SMS will be logged but not sent');
  }

  // Test scheduling a medication reminder
  console.log('\n📅 Testing Medication Reminder Scheduling:');
  const user = testUsers[0];
  const medication = testMedications[0];
  
  console.log(`   User: ${user.firstName} ${user.lastName}`);
  console.log(`   Medication: ${medication.name}`);
  console.log(`   Times: ${medication.times.join(', ')}`);
  console.log(`   Days: ${medication.days.join(', ')}`);

  // Schedule the reminder
  scheduler.scheduleMedicationReminder(user, medication, '09:20');

  console.log('\n✅ Test completed!');
  console.log('📝 Check the console for scheduled job details.');
  console.log('⏰ The reminder will be triggered at the scheduled time.');
  
  // Get scheduled jobs status
  const status = scheduler.getStatus();
  console.log('\n📊 Scheduled Jobs Status:');
  console.log(`   Total Jobs: ${status.totalJobs}`);
  console.log(`   Active Jobs: ${status.activeJobs}`);
}

// Run the test
testSMSScheduling().catch(console.error); 