const mongoose = require('mongoose');
const MedicationForm = require('./models/MedicationForm');
const User = require('./models/User');

async function checkNewMedication() {
  try {
    await mongoose.connect('mongodb://localhost:27017/medimate');
    console.log('✅ Connected to MongoDB');
    
    // Get all medications sorted by creation date
    const meds = await MedicationForm.find().sort({ createdAt: -1 });
    
    console.log('\n📋 ALL MEDICATIONS (newest first):');
    meds.forEach(m => {
      console.log(`- ${m.name} (ID: ${m._id})`);
      console.log(`  User ID: ${m.userId}`);
      console.log(`  Times: ${m.times?.join(', ') || 'no times'}`);
      console.log(`  Created: ${m.createdAt || 'unknown'}`);
      console.log('');
    });
    
    // Check if there's a "dolo 650" medication
    const dolo = meds.find(m => m.name.toLowerCase().includes('dolo'));
    if (dolo) {
      console.log('🎯 Found DOLO 650 medication!');
      console.log(`   User ID: ${dolo.userId}`);
      console.log(`   Times: ${dolo.times?.join(', ')}`);
      
      // Check which user this belongs to
      const user = await User.findById(dolo.userId);
      if (user) {
        console.log(`   Belongs to: ${user.firstName} ${user.lastName} (${user.email})`);
      } else {
        console.log('   ❌ No user found with this ID!');
      }
    } else {
      console.log('❌ DOLO 650 medication not found in database');
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    mongoose.disconnect();
  }
}

checkNewMedication();