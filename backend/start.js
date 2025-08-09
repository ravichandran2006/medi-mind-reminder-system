#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found!');
  console.log('📝 Please create a .env file with the following variables:');
  console.log('');
  console.log('PORT=5000');
  console.log('JWT_SECRET=your-super-secret-jwt-key-change-this-in-production');
  console.log('TWILIO_ACCOUNT_SID=your_twilio_account_sid_here');
  console.log('TWILIO_AUTH_TOKEN=your_twilio_auth_token_here');
  console.log('TWILIO_PHONE_NUMBER=+1234567890');
  console.log('');
  console.log('💡 You can copy env.example to .env and update the values');
  console.log('   cp env.example .env');
  process.exit(1);
}

// Load environment variables
require('dotenv').config();

// Check required environment variables
const requiredEnvVars = [
  'JWT_SECRET',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_NUMBER'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.log('❌ Missing required environment variables:');
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  console.log('');
  console.log('📝 Please update your .env file with the missing variables');
  process.exit(1);
}

// Check if dependencies are installed
const packageJsonPath = path.join(__dirname, 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.log('❌ package.json not found!');
  console.log('📝 Please run: npm install');
  process.exit(1);
}

const nodeModulesPath = path.join(__dirname, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('❌ node_modules not found!');
  console.log('📝 Please run: npm install');
  process.exit(1);
}

console.log('✅ Environment check passed!');
console.log('🚀 Starting MediMate Backend Server...');
console.log('');

// Start the server
require('./server.js'); 