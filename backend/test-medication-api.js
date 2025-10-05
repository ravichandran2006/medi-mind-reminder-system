const axios = require('axios');

async function testMedicationAPI() {
  try {
    console.log('🧪 Testing Medication API...');
    
    // First login to get token
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'tom@gmail.com',
      password: '123456'
    });
    
    console.log('✅ Login successful');
    const token = loginResponse.data.token;
    
    // Test fetching medications
    console.log('\n📋 Testing GET /api/medications...');
    const getMeds = await axios.get('http://localhost:5001/api/medications', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ GET medications successful');
    console.log('Current medications:', getMeds.data.medications.length);
    getMeds.data.medications.forEach(med => {
      console.log(`   - ${med.name} at ${med.times.join(', ')}`);
    });
    
    // Test creating a new medication (simulating frontend add)
    console.log('\n💊 Testing POST /api/medications (adding test medication)...');
    const newMedication = {
      name: 'Test Medicine API',
      dosage: '1 tablet',
      frequency: 'twice',
      times: ['14:30', '22:30'],
      startDate: '2025-10-04',
      tabletColor: 'white',
      tabletSize: 'medium',
      tabletAppearance: 'round',
      reminders: true,
      instructions: 'Take with water'
    };
    
    const createResponse = await axios.post('http://localhost:5001/api/medications', newMedication, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ POST medication successful');
    console.log('Created medication ID:', createResponse.data.medication._id);
    
    // Verify it was saved by fetching again
    console.log('\n🔄 Verifying medication was saved...');
    const verifyMeds = await axios.get('http://localhost:5001/api/medications', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('Updated medication count:', verifyMeds.data.medications.length);
    const testMed = verifyMeds.data.medications.find(m => m.name.includes('Test Medicine'));
    if (testMed) {
      console.log('🎉 Test medication found in database!');
      console.log(`   Name: ${testMed.name}`);
      console.log(`   Times: ${testMed.times.join(', ')}`);
    } else {
      console.log('❌ Test medication not found in database');
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

testMedicationAPI();