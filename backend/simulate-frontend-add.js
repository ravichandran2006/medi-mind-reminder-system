const axios = require('axios');

async function simulateFrontendAddMedication() {
  try {
    console.log('🔄 Simulating frontend medication addition...');
    
    // Step 1: Login (same as frontend)
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'tom@gmail.com',
      password: '123456'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful, token received');
    
    // Step 2: Check current medications
    console.log('\n2️⃣ Checking current medications...');
    const currentMeds = await axios.get('http://localhost:5001/api/medications', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log(`Found ${currentMeds.data.medications.length} existing medications`);
    
    // Step 3: Add "dolo 650" medication (exactly as frontend would)
    console.log('\n3️⃣ Adding DOLO 650 medication...');
    const doloMedication = {
      name: "dolo 650",
      dosage: "1 tablet",
      frequency: "once",
      times: ["14:48"], // Same time as in your screenshot
      startDate: "2025-10-04",
      endDate: "",
      days: [],
      instructions: "take before food",
      reminders: true,
      tabletColor: "white",
      tabletSize: "medium", 
      tabletAppearance: "round"
    };
    
    console.log('Sending medication data:', JSON.stringify(doloMedication, null, 2));
    
    const addResponse = await axios.post('http://localhost:5001/api/medications', doloMedication, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ DOLO 650 added successfully!');
    console.log('Response:', addResponse.data);
    
    // Step 4: Verify it was saved
    console.log('\n4️⃣ Verifying medication was saved...');
    const updatedMeds = await axios.get('http://localhost:5001/api/medications', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log(`Now have ${updatedMeds.data.medications.length} medications:`);
    updatedMeds.data.medications.forEach(med => {
      console.log(`   📋 ${med.name} at ${med.times.join(', ')} - Reminders: ${med.reminders}`);
    });
    
    // Step 5: Check if SMS scheduler picked it up
    console.log('\n5️⃣ Waiting for SMS scheduler to process...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    
    console.log('🎉 Test complete! DOLO 650 should now be in the system and scheduled for SMS reminders.');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', error.response.data);
    }
  }
}

simulateFrontendAddMedication();