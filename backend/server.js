const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage (replace with database in production)
let users = [];
let medications = [];
let healthData = [];

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Validation middleware
const validateSignup = [
  body('firstName').trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  body('lastName').trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').trim().isLength({ min: 10 }).withMessage('Valid phone number is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'MediMate API is running' });
});

// Signup
app.post('/api/auth/signup', validateSignup, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { firstName, lastName, email, phone, password } = req.body;

    // Check if user already exists
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = {
      id: Date.now().toString(),
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);

    // Create token
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data (without password) and token
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({
      message: 'User created successfully',
      user: userWithoutPassword,
      token
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login
app.post('/api/auth/login', validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = users.find(user => user.email === email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data (without password) and token
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user profile
app.get('/api/user/profile', authenticateToken, (req, res) => {
  try {
    const user = users.find(user => user.id === req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Medications API
app.get('/api/medications', authenticateToken, (req, res) => {
  try {
    const userMedications = medications.filter(med => med.userId === req.user.userId);
    res.json({ medications: userMedications });
  } catch (error) {
    console.error('Get medications error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/medications', authenticateToken, (req, res) => {
  try {
    const newMedication = {
      id: Date.now().toString(),
      userId: req.user.userId,
      ...req.body,
      createdAt: new Date().toISOString()
    };
    
    medications.push(newMedication);
    res.status(201).json({ 
      message: 'Medication added successfully',
      medication: newMedication 
    });
  } catch (error) {
    console.error('Add medication error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/api/medications/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const medicationIndex = medications.findIndex(
      med => med.id === id && med.userId === req.user.userId
    );

    if (medicationIndex === -1) {
      return res.status(404).json({ message: 'Medication not found' });
    }

    medications[medicationIndex] = {
      ...medications[medicationIndex],
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    res.json({ 
      message: 'Medication updated successfully',
      medication: medications[medicationIndex] 
    });
  } catch (error) {
    console.error('Update medication error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/api/medications/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const medicationIndex = medications.findIndex(
      med => med.id === id && med.userId === req.user.userId
    );

    if (medicationIndex === -1) {
      return res.status(404).json({ message: 'Medication not found' });
    }

    medications.splice(medicationIndex, 1);
    res.json({ message: 'Medication deleted successfully' });
  } catch (error) {
    console.error('Delete medication error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Health Data API
app.get('/api/health-data', authenticateToken, (req, res) => {
  try {
    const userHealthData = healthData.filter(data => data.userId === req.user.userId);
    res.json({ healthData: userHealthData });
  } catch (error) {
    console.error('Get health data error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/health-data', authenticateToken, (req, res) => {
  try {
    const newHealthData = {
      id: Date.now().toString(),
      userId: req.user.userId,
      ...req.body,
      createdAt: new Date().toISOString()
    };
    
    healthData.push(newHealthData);
    res.status(201).json({ 
      message: 'Health data added successfully',
      healthData: newHealthData 
    });
  } catch (error) {
    console.error('Add health data error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 MediMate Backend Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
}); 