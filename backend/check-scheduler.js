require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const MedicationForm = require('./models/MedicationForm');
const NotificationScheduler = require('./notificationScheduler');

async function checkScheduler() {
  try {
    console.log('🔍 Checking Notification Scheduler...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medimate');
    console.log('✅ Connected to MongoDB\n');
    
    // Get users and medications
    const users = await User.find({});
    const medications = await MedicationForm.find({});
    
    console.log(`📊 Found ${users.length} users and ${medications.length} medications\n`);
    
    // Show user details
    users.forEach(user => {
      console.log(`👤 User: ${user.firstName} ${user.lastName}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   📱 Phone: ${user.phone}`);
      console.log(`   🆔 ID: ${user._id}\n`);
    });
    
    // Show medication details
    medications.forEach(med => {
      console.log(`💊 Medication: ${med.name}`);
      console.log(`   👤 User ID: ${med.userId}`);
      console.log(`   ⏰ Times: ${med.times?.join(', ') || 'None'}`);
      console.log(`   📅 Start Date: ${med.startDate}`);
      console.log(`   📅 End Date: ${med.endDate || 'No end date'}`);
      console.log(`   📋 Days: ${med.days?.join(', ') || 'All days'}`);
      console.log(`   🔔 Reminders: ${med.reminders ? 'Enabled' : 'Disabled'}`);
      console.log(`   🆔 ID: ${med._id}\n`);
    });
    
    // Test scheduler
    const scheduler = new NotificationScheduler();
    scheduler.setData(users, medications);
    
    console.log('📅 Initializing scheduler...');
    await scheduler.scheduleMedicationReminders();
    
    const jobs = scheduler.getScheduledJobs();
    console.log(`\n🕐 Scheduled Jobs: ${jobs.length}`);
    jobs.forEach(job => {
      console.log(`   📋 Job ID: ${job.id}`);
      console.log(`   ▶️ Running: ${job.running}`);
      console.log(`   ⏰ Next Date: ${job.nextDate}\n`);
    });
    
    // Check current time
    const now = new Date();
    const istTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    console.log(`🕐 Current IST Time: ${istTime.toLocaleString()}`);
    console.log(`🕐 Current IST Time (24h): ${istTime.getHours()}:${istTime.getMinutes().toString().padStart(2, '0')}\n`);
    
    // Check Twilio status
    const SMSService = require('./smsService');
    const smsStatus = SMSService.getStatus();
    console.log('📱 SMS Service Status:');
    console.log(`   Configured: ${smsStatus.configured}`);
    console.log(`   Available: ${smsStatus.available}`);
    console.log(`   Phone: ${smsStatus.phoneNumber}\n`);
    
    await mongoose.disconnect();
    console.log('✅ Check complete');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkScheduler();
