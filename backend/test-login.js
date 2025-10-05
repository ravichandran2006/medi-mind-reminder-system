const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medimate');
    console.log('✅ Connected to MongoDB');
    
    // Import User model
    const User = require('./models/User');
    
    // Get all users
    const users = await User.find({}, 'firstName lastName email phone');
    console.log('\n📋 Users in database:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Phone: ${user.phone}`);
      console.log('   ---');
    });
    
    console.log(`\n📊 Total users: ${users.length}`);
    
    // Test login with common passwords
    const bcrypt = require('bcryptjs');
    const testPasswords = ['123456', 'password', 'admin', 'test123'];
    
    if (users.length > 0) {
      const firstUser = await User.findOne({ email: users[0].email });
      console.log(`\n🔐 Testing login for: ${firstUser.email}`);
      
      for (const pwd of testPasswords) {
        const isMatch = await bcrypt.compare(pwd, firstUser.password);
        if (isMatch) {
          console.log(`✅ Password found: ${pwd}`);
          break;
        }
      }
    }
    
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testConnection();