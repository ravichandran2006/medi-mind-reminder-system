const express = require('express');
const router = express.Router();
const twilio = require('twilio');

// Twilio credentials from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifySid = process.env.TWILIO_VERIFY_SID; // You must add this to your .env file!

const client = twilio(accountSid, authToken);

// Send OTP to Indian mobile number
router.post('/send-otp', async (req, res) => {
  const { mobile } = req.body;
  if (!mobile || mobile.length !== 10) {
    return res.status(400).json({ error: 'Valid 10-digit mobile number required' });
  }

  try {
    const fullMobile = `+91${mobile}`;
    await client.verify.v2.services(verifySid)
      .verifications.create({ to: fullMobile, channel: 'sms' });
    res.json({ message: 'OTP sent' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send OTP', details: err.message });
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
    const verification = await client.verify.v2.services(verifySid)
      .verificationChecks.create({ to: fullMobile, code: otp });
    if (verification.status === 'approved') {
      res.json({ verified: true });
    } else {
      res.status(400).json({ verified: false, error: 'Invalid OTP' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Verification failed', details: err.message });
  }
});

module.exports = router;