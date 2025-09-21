// Simple SMS debug script
console.log('Starting SMS debug...');

// Load environment
require('dotenv').config();
console.log('Environment loaded');

// Check Twilio variables
console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? 'SET' : 'MISSING');
console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? 'SET' : 'MISSING');
console.log('TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER ? 'SET' : 'MISSING');

// Test Twilio initialization
try {
  const twilio = require('twilio');
  console.log('Twilio module loaded');
  
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    console.log('Twilio client created successfully');
  } else {
    console.log('Twilio credentials missing - running in DEV MODE');
  }
} catch (error) {
  console.error('Error with Twilio:', error.message);
}

console.log('Debug complete');
