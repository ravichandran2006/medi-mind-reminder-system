#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up MediMate Health Management System...\n');

// Check if Node.js is installed
try {
  const nodeVersion = execSync('node --version', { encoding: 'utf8' });
  console.log(`✅ Node.js version: ${nodeVersion.trim()}`);
} catch (error) {
  console.error('❌ Node.js is not installed. Please install Node.js first.');
  process.exit(1);
}

// Create backend .env file
const backendEnvPath = path.join(__dirname, 'backend', '.env');
const backendEnvContent = `PORT=5000
JWT_SECRET=medimate-super-secret-jwt-key-change-in-production
NODE_ENV=development
`;

if (!fs.existsSync(backendEnvPath)) {
  fs.writeFileSync(backendEnvPath, backendEnvContent);
  console.log('✅ Created backend .env file');
} else {
  console.log('ℹ️  Backend .env file already exists');
}

// Install frontend dependencies
console.log('\n📦 Installing frontend dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Frontend dependencies installed');
} catch (error) {
  console.error('❌ Failed to install frontend dependencies');
  process.exit(1);
}

// Install backend dependencies
console.log('\n📦 Installing backend dependencies...');
try {
  execSync('npm install', { cwd: path.join(__dirname, 'backend'), stdio: 'inherit' });
  console.log('✅ Backend dependencies installed');
} catch (error) {
  console.error('❌ Failed to install backend dependencies');
  process.exit(1);
}

console.log('\n🎉 Setup completed successfully!');
console.log('\n📋 Next steps:');
console.log('1. Start the backend server:');
console.log('   cd backend && npm run dev');
console.log('\n2. Start the frontend development server:');
console.log('   npm run dev');
console.log('\n3. Open your browser and navigate to:');
console.log('   http://localhost:8080');
console.log('\n4. Create a new account and start using MediMate!');
console.log('\n📚 For more information, check the README.md file'); 