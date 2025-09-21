#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupEnvironment() {
  console.log('🔧 Medi-Mind Environment Setup');
  console.log('================================\n');

  const envPath = path.join(__dirname, '.env');
  
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

  // Database Configuration
  const mongodbUri = await question('MongoDB URI (default: mongodb://localhost:27017/medimate): ') || 'mongodb://localhost:27017/medimate';
  
  // JWT Secret
  const jwtSecret = await question('JWT Secret (default: your-secret-key-change-in-production): ') || 'your-secret-key-change-in-production';
  
  // Twilio Configuration
  console.log('\n📱 Twilio Configuration (Required for SMS/OTP):');
  console.log('Get these from: https://console.twilio.com/\n');
  
  const twilioAccountSid = await question('Twilio Account SID: ');
  const twilioAuthToken = await question('Twilio Auth Token: ');
  const twilioPhoneNumber = await question('Twilio Phone Number (e.g., +1234567890): ');
  const twilioVerifySid = await question('Twilio Verify Service SID: ');
  
  // Groq API (Optional)
  console.log('\n🤖 Groq AI API (Optional - for AI chat features):');
  const groqApiKey = await question('Groq API Key (optional): ');
  
  // Server Configuration
  const port = await question('Server Port (default: 5001): ') || '5001';
  const nodeEnv = await question('Node Environment (default: development): ') || 'development';

  // Create .env content
  const envContent = `# Database Configuration
MONGODB_URI=${mongodbUri}

# JWT Secret Key (Change this in production)
JWT_SECRET=${jwtSecret}

# Twilio Configuration for SMS and OTP
TWILIO_ACCOUNT_SID=${twilioAccountSid}
TWILIO_AUTH_TOKEN=${twilioAuthToken}
TWILIO_PHONE_NUMBER=${twilioPhoneNumber}
TWILIO_VERIFY_SID=${twilioVerifySid}

# Groq AI API Key (Optional - for AI chat features)
GROQ_API_KEY=${groqApiKey}

# Server Configuration
PORT=${port}
NODE_ENV=${nodeEnv}
`;

  try {
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ .env file created successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Restart your backend server');
    console.log('2. Test the OTP functionality');
    console.log('3. If using Twilio trial account, verify your phone number in Twilio console');
    console.log('\n🔗 Useful links:');
    console.log('- Twilio Console: https://console.twilio.com/');
    console.log('- Twilio Verify Service: https://console.twilio.com/us1/develop/verify/services');
  } catch (error) {
    console.error('❌ Error creating .env file:', error.message);
  }

  rl.close();
}

setupEnvironment().catch(console.error);
