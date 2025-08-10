const express = require('express');
const router = express.Router();
const twilio = require('twilio');

// Debug log to confirm route is loaded
console.log("✅ OTP routes loaded");

// Twilio credentials from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifySid = process.env.TWILIO_VERIFY_SID; // Add this to your .env file

// Twilio client
const client = twilio(accountSid, authToken);

// Send OTP to Indian mobile number
router.post('/send-otp', async (req, res) => {
  const { mobile } = req.body;

  // Validate: must be exactly 10 digits, numeric only
  if (!mobile || !/^\d{10}$/.test(mobile)) {
    return res.status(400).json({ error: 'Valid 10-digit mobile number required' });
  }

  try {
    const fullMobile = `+91${mobile}`;
    const verification = await client.verify.v2
      .services(verifySid)
      .verifications.create({ to: fullMobile, channel: 'sms' });

    res.json({
      success: true,
      message: 'OTP sent successfully',
      sid: verification.sid
    });
  } catch (err) {
    console.error("❌ OTP Send Error:", err.message);
    res.status(500).json({
      success: false,
      error: 'Failed to send OTP',
      details: err.message
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
    const verificationCheck = await client.verify.v2.services(verifySid)
      .verificationChecks.create({ to: fullMobile, code: otp });

    if (verificationCheck.status === 'approved') {
      res.json({ success: true, verified: true });
    } else {
      res.status(400).json({ success: false, verified: false, error: 'Invalid OTP' });
    }
  } catch (err) {
    console.error("❌ OTP Verify Error:", err.message);
    res.status(500).json({ success: false, error: 'Verification failed', details: err.message });
  }
});

module.exports = router;
