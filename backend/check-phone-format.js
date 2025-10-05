const mongoose = require('mongoose');
const User = require('./models/User');

async function checkPhoneFormat() {
  try {
    await mongoose.connect('mongodb://localhost:27017/medimate');
    console.log('✅ Connected to MongoDB');
    
    const user = await User.findOne({ email: 'tom@gmail.com' });
    console.log('Current phone format:', user.phone);
    console.log('Full international format would be: +91' + user.phone);
    
    // Test different phone formats that might work better
    const formats = [
      user.phone,                    // 9952608247
      '+91' + user.phone,           // +919952608247  
      '91' + user.phone,            // 919952608247
      '+91 ' + user.phone,          // +91 9952608247
    ];
    
    console.log('\n📱 Phone number format options:');
    formats.forEach((format, index) => {
      console.log(`${index + 1}. ${format}`);
    });
    
    console.log('\n📋 Recommendation: Use +919952608247 (current format is correct)');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    mongoose.disconnect();
  }
}

checkPhoneFormat();