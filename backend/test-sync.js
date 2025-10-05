const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login API...');
    
    const loginData = {
      email: 'tom@gmail.com',
      password: '123456'
    };
    
    console.log('Sending login request with:', loginData);
    
    const response = await axios.post('http://localhost:5001/api/auth/login', loginData);
    
    console.log('✅ Login successful!');
    console.log('User:', response.data.user);
    console.log('Token received:', response.data.token ? 'YES' : 'NO');
    
    if (response.data.token) {
      console.log('\nTesting medications API...');
      const medsResponse = await axios.get('http://localhost:5001/api/medications', {
        headers: {
          'Authorization': `Bearer ${response.data.token}`
        }
      });
      
      console.log('✅ Medications API success!');
      console.log('Found medications:', medsResponse.data.medications.length);
      medsResponse.data.medications.forEach(med => {
        console.log(`  📋 ${med.name} - Times: ${med.times.join(', ')}`);
      });
      
      console.log('\n🎉 SYNC IS WORKING! Frontend should be able to fetch data now. ✅');
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

testLogin();