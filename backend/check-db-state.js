const mongoose = require('mongoose');
const User = require('./models/User');
const MedicationForm = require('./models/MedicationForm');

async function checkDatabaseState() {
  try {
    await mongoose.connect('mongodb://localhost:27017/medimate');
    console.log('✅ Connected to MongoDB');
    
    const users = await User.find();
    const meds = await MedicationForm.find();
    
    console.log('\n=== CURRENT DATABASE STATE ===');
    console.log(`👥 Users: ${users.length}`);
    users.forEach(u => {
      const name = u.firstName ? `${u.firstName} ${u.lastName || ''}` : (u.name || 'NO_NAME');
      console.log(`   - ${name} (${u.email}) - Phone: ${u.phone} - ID: ${u._id}`);
    });
    
    console.log(`\n💊 Medications: ${meds.length}`);
    meds.forEach(m => {
      console.log(`   - ${m.name} for user: ${m.userId} - Times: ${m.times?.join(', ') || 'none'}`);
    });
    
    console.log('\n=== USER-MEDICATION MAPPING ===');
    users.forEach(user => {
      const userMeds = meds.filter(m => m.userId === user._id.toString());
      console.log(`📋 ${user.firstName || user.email} has ${userMeds.length} medications:`);
      userMeds.forEach(med => {
        console.log(`   ✓ ${med.name} at ${med.times?.join(', ') || 'no times set'}`);
      });
    });
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    mongoose.disconnect();
  }
}

checkDatabaseState();