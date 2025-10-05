const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function testPassword() {
  try {
    await mongoose.connect('mongodb://localhost:27017/medimate');
    console.log('✅ Connected to MongoDB');
    
    const user = await User.findOne({ email: 'tom@gmail.com' });
    console.log('User found:', user.firstName, user.lastName);
    console.log('Stored password hash:', user.password);
    
    // Test password comparison
    const password = '123456';
    console.log(`Testing password: "${password}"`);
    
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password matches:', isMatch);
    
    if (!isMatch) {
      console.log('Creating new hash...');
      const newHash = await bcrypt.hash(password, 10);
      console.log('New hash:', newHash);
      
      // Update with new hash
      user.password = newHash;
      await user.save();
      console.log('✅ Updated password hash');
      
      // Test again
      const retest = await bcrypt.compare(password, newHash);
      console.log('New hash matches:', retest);
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    mongoose.disconnect();
  }
}

testPassword();