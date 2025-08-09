#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupEnvironment() {
  console.log('🔧 MediMate Backend Environment Setup');
  console.log('=====================================\n');

  const envPath = path.join(__dirname, '.env');
  const envExamplePath = path.join(__dirname, 'env.example');

  // Check if .env already exists
  if (fs.existsSync(envPath)) {
    const overwrite = await question('⚠️  .env file already exists. Overwrite? (y/N): ');
    if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
      console.log('❌ Setup cancelled.');
      rl.close();
      return;
    }
  }

  console.log('📝 Please provide the following information:\n');

  // Get JWT Secret
  const jwtSecret = await question('JWT Secret (or press Enter for default): ');
  
  // Get Twilio credentials
  console.log('\n📱 Twilio Configuration (optional for development):');
  console.log('   If you don\'t have Twilio credentials, leave blank for development mode.\n');
  
  const twilioAccountSid = await question('Twilio Account SID: ');
  const twilioAuthToken = await question('Twilio Auth Token: ');
  const twilioPhoneNumber = await question('Twilio Phone Number (+1234567890): ');

  // Build .env content
  let envContent = `# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=${jwtSecret || 'your-super-secret-jwt-key-change-this-in-production'}

# Twilio Configuration (for SMS notifications)
`;

  if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
    envContent += `TWILIO_ACCOUNT_SID=${twilioAccountSid}
TWILIO_AUTH_TOKEN=${twilioAuthToken}
TWILIO_PHONE_NUMBER=${twilioPhoneNumber}
`;
  } else {
    envContent += `# TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
# TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
# TWILIO_PHONE_NUMBER=+1234567890
`;
  }

  envContent += `
# Database Configuration (for future use)
# MONGODB_URI=mongodb://localhost:27017/medimate
# DATABASE_URL=postgresql://username:password@localhost:5432/medimate

# Optional: Logging
LOG_LEVEL=info
`;

  // Write .env file
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ .env file created successfully!');
  } catch (error) {
    console.error('❌ Error creating .env file:', error.message);
    rl.close();
    return;
  }

  // Check if Twilio is configured
  const isTwilioConfigured = twilioAccountSid && twilioAuthToken && twilioPhoneNumber;
  
  if (isTwilioConfigured) {
    console.log('\n📱 Twilio Configuration: ✅ Complete');
    console.log('   SMS notifications will be sent via Twilio');
  } else {
    console.log('\n📱 Twilio Configuration: ⚠️  Development Mode');
    console.log('   SMS notifications will be logged to console only');
    console.log('   To enable real SMS, update your .env file with Twilio credentials');
  }

  console.log('\n🚀 Next Steps:');
  console.log('   1. Install dependencies: npm install');
  console.log('   2. Start the server: npm start');
  console.log('   3. Test the API: node test-api.js');
  
  if (!isTwilioConfigured) {
    console.log('\n💡 To get Twilio credentials:');
    console.log('   1. Sign up at https://www.twilio.com');
    console.log('   2. Get your Account SID and Auth Token from the dashboard');
    console.log('   3. Get a phone number from the Phone Numbers section');
    console.log('   4. Update your .env file with the credentials');
  }

  console.log('\n✨ Setup complete!');
  rl.close();
}

// Run setup
setupEnvironment().catch(error => {
  console.error('❌ Setup failed:', error);
  rl.close();
  process.exit(1);
}); 