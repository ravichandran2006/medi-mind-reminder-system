const express = require('express');
const router = express.Router();
const twilio = require('twilio');

// Debug log to confirm route is loaded
console.log("✅ OTP routes loaded");

// Twilio credentials from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifySid = process.env.TWILIO_VERIFY_SID;

// Check if Twilio is properly configured
const isTwilioConfigured = accountSid && authToken && verifySid;

if (!isTwilioConfigured) {
  console.log('⚠️ Twilio credentials not fully configured:');
  console.log(`   Account SID: ${accountSid ? 'Set' : 'Missing'}`);
  console.log(`   Auth Token: ${authToken ? 'Set' : 'Missing'}`);
  console.log(`   Verify SID: ${verifySid ? 'Set' : 'Missing'}`);
  console.log('📱 OTP will work in development mode with fixed OTP: 123456');
}

// Twilio client (only if credentials are available)
let client = null;
if (isTwilioConfigured) {
  try {
    client = twilio(accountSid, authToken);
    console.log('✅ Twilio client initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Twilio client:', error.message);
  }
}

// Store OTPs in memory for development (in production, use Redis or database)
const otpStore = new Map();

// Send OTP to Indian mobile number
router.post('/send-otp', async (req, res) => {
  try {
    const { phone, mobile } = req.body;
    const phoneNumber = phone || mobile; // Accept both 'phone' and 'mobile'

    // Validate: must be exactly 10 digits, numeric only
    if (!phoneNumber || !/^\d{10}$/.test(phoneNumber)) {
      return res.status(400).json({ error: 'Valid 10-digit mobile number required' });
    }

    const fullMobile = `+91${phoneNumber}`;
    
    if (isTwilioConfigured && client) {
      // Use Twilio Verify service
      const verification = await client.verify.v2
        .services(verifySid)
        .verifications.create({ to: fullMobile, channel: 'sms' });

      return res.json({
        success: true,
        message: 'OTP sent successfully via Twilio',
        sid: verification.sid
      });
    } else {
      // Development mode: generate and store OTP locally
      const otp = '123456'; // Fixed OTP for development
      otpStore.set(phoneNumber, {
        otp,
        timestamp: Date.now(),
        attempts: 0
      });
      
      console.log(`📱 [DEV MODE] OTP for ${phoneNumber}: ${otp}`);
      
      return res.json({
        success: true,
        message: 'OTP sent successfully (Development Mode)',
        devMode: true,
        otp: otp // Only in development mode
      });
    }
  } catch (err) {
    console.error('❌ OTP send error:', err.response?.data || err.message || err);
    return res.status(500).json({
      message: 'OTP send failed',
      error: err.response?.data || err.message || String(err)
    });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  const { mobile, otp } = req.body;
  
  if (!mobile || !otp) {
    return res.status(400).json({ error: 'Mobile and OTP required' });
  }

  try {
    const fullMobile = `+91${mobile}`;
    
    if (isTwilioConfigured && client) {
      // Use Twilio Verify service
      const verificationCheck = await client.verify.v2.services(verifySid)
        .verificationChecks.create({ to: fullMobile, code: otp });

      if (verificationCheck.status === 'approved') {
        res.json({ success: true, verified: true });
      } else {
        res.status(400).json({ success: false, verified: false, error: 'Invalid OTP' });
      }
    } else {
      // Development mode: verify against stored OTP
      const storedData = otpStore.get(mobile);
      
      if (!storedData) {
        return res.status(400).json({ success: false, verified: false, error: 'OTP expired or not found' });
      }
      
      // Check if OTP is expired (5 minutes)
      const now = Date.now();
      const otpAge = now - storedData.timestamp;
      const fiveMinutes = 5 * 60 * 1000;
      
      if (otpAge > fiveMinutes) {
        otpStore.delete(mobile);
        return res.status(400).json({ success: false, verified: false, error: 'OTP expired' });
      }
      
      // Increment attempts
      storedData.attempts++;
      
      if (storedData.otp === otp) {
        otpStore.delete(mobile); // Clear OTP after successful verification
        res.json({ success: true, verified: true, devMode: true });
      } else {
        if (storedData.attempts >= 3) {
          otpStore.delete(mobile); // Clear OTP after too many attempts
          return res.status(400).json({ success: false, verified: false, error: 'Too many failed attempts' });
        }
        res.status(400).json({ success: false, verified: false, error: 'Invalid OTP' });
      }
    }
  } catch (err) {
    console.error("❌ OTP Verify Error:", err.message);
    res.status(500).json({ success: false, error: 'Verification failed', details: err.message });
  }
});

module.exports = router;
