const mongoose = require('mongoose');
require('dotenv').config();

async function fixMedicationAssignments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medimate');
    console.log('✅ Connected to MongoDB');
    
    const User = require('./models/User');
    const MedicationForm = require('./models/MedicationForm');
    
    // Get Chris Evans user (the logged-in user from screenshot)
    const chrisUser = await User.findOne({ email: 'chris@gmail.com' });
    if (!chrisUser) {
      console.log('❌ Chris Evans user not found');
      return;
    }
    
    console.log(`👤 Found Chris Evans: ${chrisUser._id}`);
    
    // Update all medications to belong to Chris Evans
    const result = await MedicationForm.updateMany(
      {}, // Update all medications
      { userId: chrisUser._id.toString() }
    );
    
    console.log(`📊 Updated ${result.modifiedCount} medications`);
    
    // Verify the update
    const updatedMedications = await MedicationForm.find({ userId: chrisUser._id.toString() });
    console.log(`✅ Chris now has ${updatedMedications.length} medications:`);
    
    updatedMedications.forEach((med, index) => {
      console.log(`${index + 1}. ${med.medicationName || med.name}`);
      console.log(`   Times: ${med.times ? JSON.stringify(med.times) : 'NO TIMES'}`);
      console.log(`   Phone for reminders: ${chrisUser.phone}`);
    });
    
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixMedicationAssignments();