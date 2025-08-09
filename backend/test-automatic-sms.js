const NotificationScheduler = require('./notificationScheduler');
const SMSService = require('./smsService');

// Test data - simulating a real user and medication
const testUsers = [
  {
    id: '1',
    firstName: 'Sudharsan',
    lastName: 'Vs',
    phone: '+1234567890', // Replace with your actual phone number for testing
    email: 'sudharsanv0607@gmail.com'
  }
];

const testMedications = [
  {
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
  }
];

async function testAutomaticSMS() {
  console.log('🧪 Testing Automatic SMS Scheduling System...\n');

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
    console.log('   📝 To enable real SMS, set up Twilio credentials in .env file');
  }

  // Test scheduling automatic medication reminders
  console.log('\n📅 Testing Automatic Medication Reminder Scheduling:');
  const user = testUsers[0];
  const medication = testMedications[0];
  
  console.log(`   User: ${user.firstName} ${user.lastName}`);
  console.log(`   Phone: ${user.phone}`);
  console.log(`   Medication: ${medication.name}`);
  console.log(`   Times: ${medication.times.join(', ')}`);
  console.log(`   Days: ${medication.days.join(', ')}`);
  console.log(`   Start Date: ${medication.startDate}`);
  console.log(`   End Date: ${medication.endDate}`);

  // Schedule automatic reminders for all times
  medication.times.forEach(time => {
    scheduler.scheduleMedicationReminder(user, medication, time);
  });

  console.log('\n✅ Automatic SMS scheduling test completed!');
  console.log('📝 Check the console for scheduled job details.');
  console.log('⏰ The reminders will be triggered automatically at the scheduled times.');
  
  // Get scheduled jobs status
  const status = scheduler.getStatus();
  console.log('\n📊 Scheduled Jobs Status:');
  console.log(`   Total Jobs: ${status.totalJobs || 'N/A'}`);
  console.log(`   Active Jobs: ${status.activeJobs || 'N/A'}`);
  
  console.log('\n🔧 To enable real SMS:');
  console.log('   1. Sign up for a Twilio account');
  console.log('   2. Get your Account SID and Auth Token');
  console.log('   3. Get a Twilio phone number');
  console.log('   4. Update the .env file with your credentials');
  console.log('   5. Restart the server');
}

// Run the test
testAutomaticSMS().catch(console.error); 