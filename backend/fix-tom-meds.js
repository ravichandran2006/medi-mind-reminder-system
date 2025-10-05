const mongoose = require('mongoose');
require('dotenv').config();

async function fixMedicationOwnership() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medimate');
    console.log('✅ Connected to MongoDB');
    
    const User = require('./models/User');
    const MedicationForm = require('./models/MedicationForm');
    
    // Get Tom Jerry user (current logged in user)
    const tomUser = await User.findOne({ email: 'tom@gmail.com' });
    if (!tomUser) {
      console.log('❌ Tom Jerry user not found');
      return;
    }
    
    console.log(`👤 Found Tom Jerry: ${tomUser._id}`);
    console.log(`📱 Phone: ${tomUser.phone}`);
    
    // Update ALL medications to belong to Tom Jerry
    const result = await MedicationForm.updateMany(
      {}, // Update all medications
      { userId: tomUser._id.toString() }
    );
    
    console.log(`📊 Updated ${result.modifiedCount} medications to Tom Jerry`);
    
    // Verify the update and show current medications
    const updatedMedications = await MedicationForm.find({ userId: tomUser._id.toString() });
    console.log(`\n✅ Tom Jerry now has ${updatedMedications.length} medications:`);
    
    updatedMedications.forEach((med, index) => {
      console.log(`${index + 1}. ${med.name}`);
      console.log(`   Times: ${JSON.stringify(med.times)}`);
      console.log(`   Reminders: ${med.reminders ? 'Enabled' : 'Disabled'}`);
      console.log(`   User ID: ${med.userId}`);
      console.log(`   Phone for SMS: ${tomUser.phone}`);
      console.log('   ---');
    });
    
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixMedicationOwnership();