const mongoose = require('mongoose');
const User = require('./models/User');

async function checkUsers() {
  try {
    await mongoose.connect('mongodb://localhost:27017/medimate');
    console.log('✅ Connected to MongoDB');
    
    const users = await User.find();
    console.log(`\nFound ${users.length} users:`);
    
    for (const user of users) {
      console.log(`- ${user.name} (${user.email})`);
      console.log(`  ID: ${user._id}`);
      console.log(`  Phone: ${user.phone}`);
      console.log(`  Password hash: ${user.password}`);
      console.log('');
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    mongoose.disconnect();
  }
}

checkUsers();