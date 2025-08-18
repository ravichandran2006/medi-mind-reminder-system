const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Medication = require('../models/Medication');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medimate';

async function initializeDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB successfully');

    // Get database instance
    const db = mongoose.connection.db;
    const databaseName = db.databaseName;
    console.log(`📊 Database: ${databaseName}`);

    // List existing collections
    const collections = await db.listCollections().toArray();
    console.log('📚 Existing collections:', collections.map(c => c.name));

    // Create collections if they don't exist
    const requiredCollections = ['users', 'medications', 'otps'];
    
    for (const collectionName of requiredCollections) {
      if (!collections.find(c => c.name === collectionName)) {
        await db.createCollection(collectionName);
        console.log(`✅ Created collection: ${collectionName}`);
      } else {
        console.log(`ℹ️  Collection already exists: ${collectionName}`);
      }
    }

    // Set up indexes for Users collection
    console.log('🔍 Setting up User indexes...');
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ phone: 1 }, { unique: true });
    console.log('✅ User indexes created');

    // Set up indexes for Medications collection
    console.log('🔍 Setting up Medication indexes...');
    await Medication.collection.createIndex({ userId: 1, createdAt: -1 });
    await Medication.collection.createIndex({ userId: 1, name: 1 });
    await Medication.collection.createIndex({ 
      userId: 1, 
      tabletShape: 1, 
      tabletColor: 1, 
      tabletSize: 1 
    });
    console.log('✅ Medication indexes created');

    // Create sample data for testing (optional)
    if (process.env.CREATE_SAMPLE_DATA === 'true') {
      console.log('📝 Creating sample data...');
      await createSampleData();
    }

    console.log('🎉 Database initialization completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Open MongoDB Compass');
    console.log('2. Connect to:', MONGODB_URI);
    console.log('3. Navigate to the "medimate" database');
    console.log('4. Verify collections and indexes are created');
    console.log('5. Start your application server');

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

async function createSampleData() {
  try {
    // Create a sample user
    const sampleUser = new User({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+919876543210',
      password: 'hashedPassword123' // In real app, this would be properly hashed
    });

    const savedUser = await sampleUser.save();
    console.log('✅ Sample user created:', savedUser.email);

    // Create sample medications
    const sampleMedications = [
      {
        userId: savedUser._id,
        name: 'Vitamin D3',
        dosage: '1000 IU',
        frequency: 'once',
        times: ['09:00'],
        startDate: new Date(),
        reminders: true,
        tabletShape: 'round',
        tabletColor: 'White',
        tabletSize: 'small',
        tabletTexture: 'smooth',
        form: 'tablet',
        manufacturer: 'HealthVit',
        instructions: 'Take with breakfast'
      },
      {
        userId: savedUser._id,
        name: 'Omega-3 Fish Oil',
        dosage: '1000mg',
        frequency: 'once',
        times: ['18:00'],
        startDate: new Date(),
        reminders: true,
        tabletShape: 'oval',
        tabletColor: 'Yellow',
        tabletSize: 'large',
        tabletTexture: 'coated',
        form: 'capsule',
        manufacturer: 'NatureMade',
        instructions: 'Take with dinner'
      }
    ];

    for (const medData of sampleMedications) {
      const medication = new Medication(medData);
      await medication.save();
      console.log('✅ Sample medication created:', medication.name);
    }

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  }
}

// Run the initialization
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };
