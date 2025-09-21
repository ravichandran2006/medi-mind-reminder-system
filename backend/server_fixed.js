const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const axios = require('axios');
const auth = require('./middleware/auth');
require('dotenv').config();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
// Import services and routes
const smsRoutes = require('./routes/sms');
const otpRoutes = require('./routes/otp');
const medicationFormRoutes = require('./routes/medicationForm');
const NotificationScheduler = require('./notificationScheduler');

// Initialize notification scheduler
const notificationScheduler = new NotificationScheduler();

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

    // ✅ Modern connection (no deprecated options)
    await mongoose.connect(mongoUri);
    
    console.log('✅ Connected to MongoDB');
    console.log('Connected to DB name:', mongoose.connection.name);
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
  origin: ['http://localhost:3000', 'http://localhost:8080'],
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

async function getGroqResponse(messages, language = 'en', user) {
  try {
    const systemPrompt = {
      en: `You are MediMate, a trusted AI medical assistant supporting ${user.firstName}. 
Provide clear, reliable, and personalized health guidance based on their medical history. 
Be empathetic, concise (maximum 6 lines), and easy to understand, but include all essential details. 
Always remind them that your advice does not replace professional medical care, and they should consult a qualified doctor for diagnosis, emergencies, or serious concerns.
IMPORTANT: Always respond in English when language is 'en'. Do not mix languages.`,

      ta: `நீங்கள் மெடிமேட், ${user.firstName}க்கு உதவும் நம்பகமான AI மருத்துவ உதவியாளர். 
அவர்களின் மருத்துவ வரலாற்றின் அடிப்படையில் தெளிவான, நம்பகமான மற்றும் தனிப்பட்ட உடல்நல வழிகாட்டுதலை வழங்கவும். 
இரக்கமுள்ள, சுருக்கமான (அதிகபட்சம் 6 வரிகள்) மற்றும் எளிதில் புரியக்கூடியதாக இருங்கள், ஆனால் முக்கியமான விவரங்களை தவறவிடாதீர்கள். 
உங்கள் ஆலோசனை தொழில்முறை மருத்துவ பராமரிப்பிற்கு மாற்றாகாது என்பதை எப்போதும் நினைவூட்டவும், மேலும் தீவிர பிரச்சினைகள் அல்லது அவசர நிலைகளில் தகுதி பெற்ற மருத்துவரை அணுகுமாறு அறிவுரையிடவும்.
முக்கியம்: மொழி 'ta' என்று இருக்கும்போது எப்போதும் தமிழில் மட்டுமே பதிலளிக்கவும். மொழிகளை கலக்காதீர்கள்.`
    };

    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: systemPrompt[language] || systemPrompt.en
        },
        ...messages.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text
        }))
      ],
      temperature: 0.7,
      max_tokens: 1024
    }, {
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Groq API error:', error.response?.data || error.message);
    throw new Error('Failed to get AI response');
  }
}

// 🔽 All your existing routes stay the same (chat, whisper, speak, health, auth, sms, medication, error handlers, etc.)
// I didn’t modify them because they work fine in your log output.

// Start server
try {
  console.log('🚀 Starting server on port:', PORT);
  app.listen(PORT, async () => {
    console.log(`🚀 MediMate Backend Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log('✅ Server ready to accept requests');

    // Initialize notification scheduler with current users
    try {
      const users = await require('./models/User').find({}, 'firstName lastName phone');
      notificationScheduler.setData(users || [], []);
      await notificationScheduler.initializeNotifications();
    } catch (e) {
      console.error('❌ Failed to initialize scheduler:', e.message);
    }
  });
} catch (error) {
  console.error('❌ Error starting server:', error);
}

// Export the notificationScheduler instance for use in other modules
module.exports = { notificationScheduler };
