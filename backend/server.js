// server.js
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
require('dotenv').config(); // ✅ ensure .env is loaded first

// Import services and routes
const smsRoutes = require('./routes/sms');
const otpRoutes = require('./routes/otp');
const medicationFormRoutes = require('./routes/medicationForm');
const ocrRoutes = require('./routes/ocr');
const NotificationScheduler = require('./notificationScheduler');

// Initialize notification scheduler
const notificationScheduler = new NotificationScheduler();

const app = express();
const PORT = process.env.PORT || 5001;

// ✅ Enforce JWT secret
if (!process.env.JWT_SECRET) {
  throw new Error("❌ JWT_SECRET not defined in .env file");
}
const JWT_SECRET = process.env.JWT_SECRET;
console.log("JWT_SECRET in use:", process.env.JWT_SECRET);

// Connect to MongoDB
async function connectDB() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/medimate';
    console.log('📡 MONGODB_URI:', mongoUri);

    await mongoose.connect(mongoUri, {
      // ⚠️ These options are deprecated in Mongoose v7+, can be removed
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');
    console.log('Connected to DB name:', mongoose.connection.name);
    return true;
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('💡 Make sure MongoDB is running: mongod');
    return false;
  }
}
connectDB();

// ✅ Fixed CORS
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:8080'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // ✅ preflight support

// Middleware
app.use(express.json());

// Import models
const User = require('./models/User');

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error("❌ JWT verification failed:", err.message);
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Helper: normalize Indian phone to +91XXXXXXXXXX
function formatIndianPhone(raw) {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  return null;
}

// Validation middleware
const validateSignup = [
  body('firstName').trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  body('lastName').trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

// ✅ Root route for quick testing
app.get('/', (req, res) => {
  res.json({ message: '🚀 MediMate Backend is alive', time: new Date() });
});

// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'MediMate API is running',
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend server is running!', timestamp: new Date() });
});

// ✅ OTP routes
app.use('/api/otp', otpRoutes);

// Signup
app.post('/api/auth/signup', validateSignup, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    let { firstName, lastName, email, phone, password } = req.body;
    const formattedPhone = formatIndianPhone(phone);
    if (!formattedPhone) {
      return res.status(400).json({ message: 'Phone must be a valid Indian number (10 digits or +91XXXXXXXXXX)' });
    }

    firstName = firstName.trim();
    lastName = lastName.trim();
    email = email.trim().toLowerCase();

    const existingByEmail = await User.findOne({ email });
    if (existingByEmail) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const existingByPhone = await User.findOne({ phone: formattedPhone });
    if (existingByPhone) {
      return res.status(400).json({ message: 'User with this phone number already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await User.create({
      firstName,
      lastName,
      email,
      phone: formattedPhone,
      password: hashedPassword
    });

    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPassword } = newUser.toObject();
    res.status(201).json({
      message: 'User created successfully',
      user: userWithoutPassword,
      token
    });

  } catch (error) {
    console.error("❌ Signup error:", error.message);
    if (error && error.code === 11000) {
      const dupField = Object.keys(error.keyPattern || {}).join(', ') || 'field';
      return res.status(400).json({ message: `Duplicate value for ${dupField}` });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login
app.post('/api/auth/login', validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPassword } = user.toObject();
    res.json({ message: 'Login successful', user: userWithoutPassword, token });

  } catch (error) {
    console.error("❌ Login error:", error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Profile
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { password: _, ...userWithoutPassword } = user.toObject();
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error("❌ Profile fetch error:", error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// SMS
app.use('/api/sms', smsRoutes);

// OCR
app.use('/api/ocr', ocrRoutes);

// Medication Form (protected)
app.use('/api/medication-form', authenticateToken, medicationFormRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error middleware:', err);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
try {
  app.listen(PORT, async () => {
    console.log(`🚀 MediMate Backend running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);

    try {
      const users = await User.find({}, 'firstName lastName phone');
      notificationScheduler.setData(users || [], []);
      await notificationScheduler.initializeNotifications();
    } catch (e) {
      console.error('❌ Failed to initialize scheduler:', e.message);
    }
  });
} catch (error) {
  console.error('❌ Error starting server:', error);
}

module.exports = { notificationScheduler };
