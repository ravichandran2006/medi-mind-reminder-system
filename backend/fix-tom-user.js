const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function fixTomUser() {
  try {
    await mongoose.connect('mongodb://localhost:27017/medimate');
    console.log('✅ Connected to MongoDB');
    
    // Find Tom user
    const tomUser = await User.findOne({ email: 'tom@gmail.com' });
    
    if (tomUser) {
      console.log('Found Tom user:', tomUser._id);
      console.log('Current data:', {
        name: tomUser.name,
        firstName: tomUser.firstName,
        lastName: tomUser.lastName,
        email: tomUser.email,
        phone: tomUser.phone
      });
      
      // Update with proper firstName/lastName
      tomUser.firstName = 'Tom';
      tomUser.lastName = 'Jerry';
      
      // Ensure password is properly hashed
      if (!tomUser.password.startsWith('$2a$') && !tomUser.password.startsWith('$2b$')) {
        console.log('Re-hashing password...');
        tomUser.password = await bcrypt.hash('123456', 10);
      }
      
      await tomUser.save();
      console.log('✅ Updated Tom user with firstName and lastName');
      
      // Verify the fix
      const updated = await User.findOne({ email: 'tom@gmail.com' });
      console.log('Updated data:', {
        firstName: updated.firstName,
        lastName: updated.lastName,
        email: updated.email,
        phone: updated.phone
      });
      
    } else {
      console.log('Tom user not found, creating new one...');
      
      const hashedPassword = await bcrypt.hash('123456', 10);
      const newUser = new User({
        firstName: 'Tom',
        lastName: 'Jerry',
        email: 'tom@gmail.com',
        phone: '9952608247',
        password: hashedPassword
      });
      
      await newUser.save();
      console.log('✅ Created new Tom user');
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    mongoose.disconnect();
  }
}

fixTomUser();