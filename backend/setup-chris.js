const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function setupChrisCredentials() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medimate');
    console.log('✅ Connected to MongoDB');
    
    const User = require('./models/User');
    
    // Check if Chris Evans exists
    let chrisUser = await User.findOne({ email: 'chris@gmail.com' });
    
    if (!chrisUser) {
      console.log('👤 Creating Chris Evans user...');
      const hashedPassword = await bcrypt.hash('123456', 10);
      
      chrisUser = new User({
        firstName: 'Chris',
        lastName: 'Evans',
        email: 'chris@gmail.com',
        phone: '9952608247',
        password: hashedPassword
      });
      
      await chrisUser.save();
      console.log('✅ Chris Evans user created');
    } else {
      console.log('👤 Updating Chris Evans password...');
      const hashedPassword = await bcrypt.hash('123456', 10);
      chrisUser.password = hashedPassword;
      await chrisUser.save();
      console.log('✅ Chris Evans password updated');
    }
    
    console.log('📧 Email: chris@gmail.com');
    console.log('🔐 Password: 123456');
    console.log(`👤 User ID: ${chrisUser._id}`);
    
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

setupChrisCredentials();