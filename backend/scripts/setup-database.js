const mongoose = require('mongoose');
require('dotenv').config();

async function setupDatabases() {
  try {
    console.log('🚀 Setting up separate databases for MediMate...\n');
    
    // Get database URIs from environment or use defaults
    const userDbUri = process.env.USER_DB_URI || 'mongodb://localhost:27017/medimate';
    const medicationDbUri = process.env.MEDICATION_DB_URI || 'mongodb://localhost:27017/medication_forms_db';
    
    console.log('📊 Database Configuration:');
    console.log(`   👤 User Database: ${userDbUri}`);
    console.log(`   💊 Medication Database: ${medicationDbUri}\n`);
    
    // Connect to User Database
    console.log('🔗 Connecting to User Database...');
    const userDb = await mongoose.createConnection(userDbUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to User Database\n');
    
    // Connect to Medication Database
    console.log('🔗 Connecting to Medication Database...');
    const medicationDb = await mongoose.createConnection(medicationDbUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to Medication Database\n');
    
    // Set up User Database collections and indexes
    console.log('👤 Setting up User Database...');
    await setupUserDatabase(userDb);
    
    // Set up Medication Database collections and indexes
    console.log('💊 Setting up Medication Database...');
    await setupMedicationDatabase(medicationDb);
    
    // Close connections
    await userDb.close();
    await medicationDb.close();
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ User Database (medimate) - Ready for user credentials');
    console.log('   ✅ Medication Database (medication_forms_db) - Ready for medication forms');
    console.log('\n🚀 You can now start your application!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

async function setupUserDatabase(userDb) {
  try {
    // Create Users collection
    const userCollection = userDb.collection('users');
    
    // Create indexes for Users with shorter timeout
    await Promise.all([
      userCollection.createIndex({ email: 1 }, { unique: true, maxTimeMS: 5000 }),
      userCollection.createIndex({ phone: 1 }, { unique: true, maxTimeMS: 5000 }),
      userCollection.createIndex({ createdAt: -1 }, { maxTimeMS: 5000 })
    ]);
    
    console.log('   ✅ Users collection created with indexes');
    
  } catch (error) {
    console.error('   ❌ Error setting up User Database:', error);
    throw error;
  }
}

async function setupMedicationDatabase(medicationDb) {
  try {
    // Create Medications collection
    const medicationCollection = medicationDb.collection('medications');
    
    // Create comprehensive indexes for Medications with shorter timeout
    await Promise.all([
      medicationCollection.createIndex({ userId: 1 }, { maxTimeMS: 5000 }),
      medicationCollection.createIndex({ createdAt: -1 }, { maxTimeMS: 5000 }),
      medicationCollection.createIndex({ name: 1 }, { maxTimeMS: 5000 }),
      medicationCollection.createIndex({ tabletShape: 1 }, { maxTimeMS: 5000 }),
      medicationCollection.createIndex({ tabletColor: 1 }, { maxTimeMS: 5000 }),
      medicationCollection.createIndex({ tabletSize: 1 }, { maxTimeMS: 5000 }),
      medicationCollection.createIndex({ form: 1 }, { maxTimeMS: 5000 }),
      medicationCollection.createIndex({ 
        tabletShape: 1, 
        tabletColor: 1, 
        tabletSize: 1 
      }, { maxTimeMS: 5000 })
    ]);
    
    console.log('   ✅ Medications collection created with comprehensive indexes');
    
    // Ask if user wants to create sample medication data
    if (process.env.CREATE_SAMPLE_DATA === 'true') {
      console.log('\n📝 Creating sample medication data...');
      await createSampleMedications(medicationCollection);
    }
    
  } catch (error) {
    console.error('   ❌ Error setting up Medication Database:', error);
    throw error;
  }
}

async function createSampleMedications(collection) {
  try {
    const sampleMedications = [
      {
        userId: new mongoose.Types.ObjectId(),
        name: 'Paracetamol 500mg',
        dosage: '1 tablet',
        frequency: 'Every 6 hours',
        times: ['09:00', '15:00', '21:00'],
        tabletShape: 'Round',
        tabletColor: 'White',
        tabletSize: 'Medium',
        tabletMarkings: 'P500',
        tabletTexture: 'Smooth',
        manufacturer: 'Generic Pharma',
        genericName: 'Acetaminophen',
        strength: '500mg',
        form: 'Tablet',
        instructions: 'Take with food if stomach upset occurs',
        reminders: true,
        createdAt: new Date()
      },
      {
        userId: new mongoose.Types.ObjectId(),
        name: 'Vitamin D3',
        dosage: '1 capsule',
        frequency: 'Once daily',
        times: ['08:00'],
        tabletShape: 'Oval',
        tabletColor: 'Yellow',
        tabletSize: 'Small',
        tabletMarkings: 'VD3',
        tabletTexture: 'Smooth',
        manufacturer: 'Health Supplements',
        genericName: 'Cholecalciferol',
        strength: '1000 IU',
        form: 'Capsule',
        instructions: 'Take in the morning with breakfast',
        reminders: true,
        createdAt: new Date()
      }
    ];
    
    await collection.insertMany(sampleMedications);
    console.log('   ✅ Sample medication data created');
    
  } catch (error) {
    console.error('   ❌ Error creating sample data:', error);
  }
}

// Run the setup
setupDatabases();
