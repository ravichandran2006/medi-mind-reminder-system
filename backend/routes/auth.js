const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

const router = express.Router();

// Signup
router.post('/signup', 
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').isLength({ min: 2 }),
  body('lastName').isLength({ min: 2 }),
  body('phone').isLength({ min: 10, max: 13 }),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errNo: -3, errors: errors.array() });
      }

      const { firstName, lastName, email, phone, password } = req.body;

      // Normalize phone number (remove +91 prefix if present, keep only 10 digits)
      const normalizedPhone = phone.replace(/^\+91/, '');

      // Check if user already exists by email or phone
      let user = await User.findOne({ $or: [{ email }, { phone: normalizedPhone }] });
      if (user) {
        return res.status(400).json({ errNo: -1, errMsg: 'User already exists with this email or phone number' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      user = new User({ 
        firstName, 
        lastName, 
        email, 
        phone: normalizedPhone, 
        password: hashedPassword 
      });
      await user.save();

      const token = jwt.sign({ userId: user._id, firstName: user.firstName }, process.env.JWT_SECRET, { expiresIn: '1h' });

      res.json({ 
        errNo: 0, 
        token, 
        user: { 
          firstName: user.firstName, 
          lastName: user.lastName,
          email: user.email,
          phone: user.phone
        } 
      });
    } catch (err) {
      console.error('Signup error:', err);
      res.status(500).json({ errNo: -2, errMsg: 'Service is currently unstable, please give it another try later.' });
    }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ errNo: -1, errMsg: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ errNo: -1, errMsg: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id, firstName: user.firstName }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ 
      errNo: 0, 
      token, 
      user: { 
        firstName: user.firstName, 
        lastName: user.lastName,
        email: user.email,
        phone: user.phone
      } 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ errNo: -2, errMsg: 'Service is currently unstable, please give it another try later.' });
  }
});

module.exports = router;
