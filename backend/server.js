require("dotenv").config();

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const axios = require('axios');
const auth = require('./middleware/auth');
const NotificationScheduler = require('./notificationScheduler');

// ✅ Explicitly load .env from project root (one level up from backend)
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Connect to MongoDB
async function connectDB() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/medimate';
    console.log('📡 MONGODB_URI:', mongoUri);

    if (!process.env.MONGODB_URI) {
      console.log('⚠️  Using default MongoDB URI. Create .env file for production.');
    }

    await mongoose.connect(mongoUri);

    console.log('✅ Connected to MongoDB');
    console.log('   DB Name:', mongoose.connection.name);
    return true;
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('💡 Make sure MongoDB is running: mongod');
    return false;
  }
}

// Initialize database connection
connectDB();

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Middleware
app.use(express.json());

// Import models
const User = require('./models/User');
const ChatHistory = require('./models/ChatHistory');
const MedicationForm = require('./models/MedicationForm');

// Initialize notification scheduler
const notificationScheduler = new NotificationScheduler();
module.exports.notificationScheduler = notificationScheduler;

// ---------------- AI Chat (Groq) ----------------
async function getGroqResponse(messages, user) {
  try {
    if (!GROQ_API_KEY) {
      console.error('❌ GROQ_API_KEY is not configured');
      return "AI service not configured. Please contact support.";
    }

    const systemPrompt = `You are Dr. MediMate, a licensed medical doctor...`; // (your existing long prompt)

    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text
        }))
      ],
      temperature: 0.7,
      max_tokens: 800
    }, {
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const aiResponse = response.data.choices[0]?.message?.content;
    console.log('🔍 Groq API Status:', response.status);
    console.log('🤖 AI Response Preview:', aiResponse?.substring(0, 100) + '...');

    if (!aiResponse || aiResponse.trim() === '') {
      console.error('❌ Groq returned empty response');
      return "Sorry, I couldn’t generate a response. Try again.";
    }

    return aiResponse;
  } catch (error) {
    console.error('Groq API error:', error.response?.data || error.message);
    return "AI service error. Please try again.";
  }
}

// ---------------- Routes ----------------

// Chat API
app.post('/api/chat', auth, async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.userId;

    console.log(`💬 Chat request - User: ${req.user.firstName}, Message: ${message}`);

    if (!message || !message.trim()) {
      return res.status(400).json({ errNo: -3, message: 'Message is required' });
    }

    // Save user message
    const userMessage = new ChatHistory({
      userId,
      text: message,
      sender: 'user',
      language: 'en',
      timestamp: new Date()
    });
    await userMessage.save();

    // Get AI response
    const aiResponseText = await getGroqResponse([{ sender: 'user', text: message }], req.user);

    // Save AI response
    const aiMessage = new ChatHistory({
      userId,
      text: aiResponseText.trim(),
      sender: 'ai',
      language: 'en',
      timestamp: new Date()
    });
    await aiMessage.save();

    res.json({
      response: aiResponseText,
      language: 'en',
      timestamp: new Date(),
      user: {
        firstName: req.user.firstName,
        languagePreference: 'en'
      }
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ message: 'Failed to process chat message' });
  }
});

// Chat history
app.get('/api/chat/history', auth, async (req, res) => {
  try {
    const history = await ChatHistory.find({ userId: req.user.userId })
      .sort({ timestamp: -1 })
      .limit(20);
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get chat history' });
  }
});

// Signup/Login/Profile (unchanged) ...
// Medication routes
app.use('/api/medications', auth, require('./routes/medicationForm'));
app.use('/api/medication-form', auth, require('./routes/medicationForm')); // Frontend compatibility
app.use('/api/sms', require('./routes/sms'));
app.use('/api/otp', require('./routes/otp'));
// Medical analysis routes
app.use('/api/medical-analysis', auth, require('./routes/medicalAnalysis'));
// Auth routes
app.use('/api/auth', require('./routes/auth'));
  
// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    groqApi: GROQ_API_KEY ? 'Configured' : 'Missing',
    notificationScheduler: notificationScheduler.getStatus()
  });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend server is running!', timestamp: new Date() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Initialize notification scheduler
async function initializeScheduler() {
  try {
    console.log('🔄 Initializing notification scheduler...');
    const users = await User.find({});
    const medications = await MedicationForm.find({});
    notificationScheduler.setData(users, medications);
    await notificationScheduler.initializeNotifications();
    console.log('✅ Notification scheduler ready');
  } catch (error) {
    console.error('❌ Scheduler error:', error);
  }
}

// Start server
try {
  console.log('🚀 Starting server on port:', PORT);
  app.listen(PORT, async () => {
    console.log(`✅ MediMate Backend Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    await initializeScheduler();
  });
} catch (error) {
  console.error('❌ Error starting server:', error);
}
