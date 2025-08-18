/**
 * Test script for SMS reminder system
 * 
 * This script tests the SMS reminder functionality by creating a sample medication
 * and scheduling reminders for it.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const MedicationForm = require('../models/MedicationForm');
const NotificationScheduler = require('../notificationScheduler');
const SMSService = require('../smsService');

// Sample test data
const testUser = {
  _id: new mongoose.Types.ObjectId(),
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  phone: '9876543210', // Sample Indian phone number
  password: 'password123'
};

const testMedication = {
  _id: new mongoose.Types.ObjectId(),
  userId: testUser._id,
  name: 'Test Medication',
  dosage: '10mg',
  frequency: 'twice',
  times: ['09:00', '21:00'],
  startDate: new Date().toISOString().split('T')[0], // Today
  endDate: null, // No end date
  days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
  instructions: 'Take with water',
  reminders: true,
  tabletColor: 'white',
  tabletSize: 'medium',
  tabletAppearance: 'round'
};

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Test SMS service availability
async function testSmsServiceAvailability() {
  const status = await SMSService.getStatus();
  console.log('SMS Service Status:', status);
  return status.available;
}

// Test sending an immediate SMS
async function testImmediateSms() {
  console.log('\n📱 Testing immediate SMS...');
  const result = await SMSService.sendMedicationReminder(
    testUser.phone,
    `${testUser.firstName} ${testUser.lastName}`,
    testMedication.name,
    testMedication.times[0]
  );
  console.log('SMS Result:', result);
  return result.success;
}

// Test scheduling a medication reminder
async function testScheduleReminder() {
  try {
    console.log('\n🗓️ Testing reminder scheduling...');
    
    // Create a notification scheduler
    const notificationScheduler = new NotificationScheduler();
    
    // Initialize the scheduler with data
    notificationScheduler.setData([testUser], [testMedication]);
    await notificationScheduler.initializeNotifications();
  
  // Add a medication reminder
  const result = await notificationScheduler.addMedicationReminder(
    testUser._id.toString(),
    testMedication
  );
  
  if (result.success) {
      console.log('✅ Successfully scheduled medication reminder');
      console.log('📋 Scheduled jobs count:', notificationScheduler.scheduledJobs.size);
    } else {
      console.log('❌ Failed to schedule medication reminder:', result.error);
    }
  } catch (error) {
    console.log('❌ Test failed:', error);
  }
  
  // Get all scheduled jobs
  const jobs = notificationScheduler.getScheduledJobs();
  console.log(`\n📋 Scheduled Jobs (${jobs.length}):`);
  jobs.forEach(job => {
    console.log(`  - ${job.id}: Next run at ${job.nextDate}`);
  });
  
  return jobs.length > 0;
}

// Main test function
async function runTests() {
  try {
    await connectToDatabase();
    
    // Test SMS service
    const smsAvailable = await testSmsServiceAvailability();
    console.log(smsAvailable ? '✅ SMS service is available' : '⚠️ SMS service is in DEV mode');
    
    // Test immediate SMS
    const immediateSmsResult = await testImmediateSms();
    console.log(immediateSmsResult ? '✅ Immediate SMS test passed' : '❌ Immediate SMS test failed');
    
    // Test scheduling
    const schedulingResult = await testScheduleReminder();
    console.log(schedulingResult ? '✅ Reminder scheduling test passed' : '❌ Reminder scheduling test failed');
    
    console.log('\n🎉 All tests completed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('📝 Database connection closed');
    process.exit(0);
  }
}

// Run the tests
runTests();