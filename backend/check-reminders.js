const mongoose = require('mongoose');
require('dotenv').config();

async function checkMedicationReminders() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medimate');
    console.log('✅ Connected to MongoDB');
    
    const User = require('./models/User');
    const MedicationForm = require('./models/MedicationForm');
    
    // Get all users and medications
    const users = await User.find({});
    const medications = await MedicationForm.find({});
    
    console.log('\n📋 Users with phone numbers:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Phone: ${user.phone || 'NO PHONE'}`);
      console.log(`   User ID: ${user._id}`);
      console.log('   ---');
    });
    
    console.log('\n💊 Medications with reminders:');
    medications.forEach((med, index) => {
      console.log(`${index + 1}. ${med.medicationName || med.name}`);
      console.log(`   User ID: ${med.userId}`);
      console.log(`   Times: ${med.times ? JSON.stringify(med.times) : 'NO TIMES'}`);
      console.log(`   Reminders: ${med.reminders ? 'Enabled' : 'Disabled'}`);
      console.log(`   Schedule: ${med.scheduleType || 'Not set'}`);
      console.log('   ---');
    });
    
    // Check if users have medications assigned
    console.log('\n🔗 User-Medication matches:');
    users.forEach(user => {
      const userMeds = medications.filter(med => 
        med.userId === user._id.toString() || 
        med.userId === user._id
      );
      console.log(`${user.firstName}: ${userMeds.length} medications`);
      if (userMeds.length > 0) {
        userMeds.forEach(med => {
          console.log(`   - ${med.medicationName || med.name} (${med.times ? med.times.length : 0} times)`);
        });
      }
    });
    
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkMedicationReminders();