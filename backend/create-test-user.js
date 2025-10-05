const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createTestUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medimate');
    console.log('✅ Connected to MongoDB');
    
    const User = require('./models/User');
    
    // Check if test user already exists
    let testUser = await User.findOne({ email: 'test@example.com' });
    
    if (testUser) {
      console.log('🔄 Updating existing test user password...');
      const hashedPassword = await bcrypt.hash('123456', 10);
      testUser.password = hashedPassword;
      await testUser.save();
    } else {
      console.log('👤 Creating new test user...');
      const hashedPassword = await bcrypt.hash('123456', 10);
      
      testUser = new User({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phone: '1234567890',
        password: hashedPassword
      });
      
      await testUser.save();
    }
    
    console.log('✅ Test user ready!');
    console.log('📧 Email: test@example.com');
    console.log('🔐 Password: 123456');
    
    // Also update tom@gmail.com with known password
    const tomUser = await User.findOne({ email: 'tom@gmail.com' });
    if (tomUser) {
      console.log('\n🔄 Updating tom@gmail.com password...');
      const hashedPassword = await bcrypt.hash('123456', 10);
      tomUser.password = hashedPassword;
      await tomUser.save();
      console.log('✅ tom@gmail.com password updated to: 123456');
    }
    
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createTestUser();