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

    await mongoose.connect(mongoUri, {
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
Be empathetic, concise, and easy to understand, but include all essential details. 
Always remind them that your advice does not replace professional medical care, and they should consult a qualified doctor for diagnosis, emergencies, or serious concerns.`,

  hi: `आप मेडीमेट हैं, ${user.firstName} के लिए एक विश्वसनीय एआई चिकित्सा सहायक। 
उनके चिकित्सा इतिहास के आधार पर स्पष्ट, विश्वसनीय और व्यक्तिगत स्वास्थ्य मार्गदर्शन प्रदान करें। 
संवेदनशील, संक्षिप्त और आसानी से समझने योग्य रहें, लेकिन आवश्यक विवरण शामिल करें। 
हमेशा याद दिलाएँ कि आपकी सलाह पेशेवर चिकित्सा देखभाल का विकल्प नहीं है और गंभीर समस्या या आपात स्थिति में उन्हें योग्य डॉक्टर से परामर्श करना चाहिए।`,

  ta: `நீங்கள் மெடிமேட், ${user.firstName}க்கு உதவும் நம்பகமான AI மருத்துவ உதவியாளர். 
அவர்களின் மருத்துவ வரலாற்றின் அடிப்படையில் தெளிவான, நம்பகமான மற்றும் தனிப்பட்ட உடல்நல வழிகாட்டுதலை வழங்கவும். 
இரக்கமுள்ள, சுருக்கமான மற்றும் எளிதில் புரியக்கூடியதாக இருங்கள், ஆனால் முக்கியமான விவரங்களை தவறவிடாதீர்கள். 
உங்கள் ஆலோசனை தொழில்முறை மருத்துவ பராமரிப்பிற்கு மாற்றாகாது என்பதை எப்போதும் நினைவூட்டவும், மேலும் தீவிர பிரச்சினைகள் அல்லது அவசர நிலைகளில் தகுதி பெற்ற மருத்துவரை அணுகுமாறு அறிவுரையிடவும்.`
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

// Chat API Routes
app.post('/api/chat', auth, async (req, res) => {
  try {
    const { message, language = 'en' } = req.body;
    const userId = req.user.id;

    // Validate language
    const validLanguages = ['en', 'hi', 'ta', 'te', 'kn', 'ml', 'bn', 'mr', 'gu', 'pa'];
    if (!validLanguages.includes(language)) {
      return res.status(400).json({ 
        errNo: -3,
        errMsg: 'Unsupported language',
        message: 'Selected language is not supported'
      });
    }

    // Save user message to history
    const userMessage = new ChatHistory({
      userId,
      text: message,
      sender: 'user',
      language,
      timestamp: new Date()
    });
    await userMessage.save();

    // Get AI response with user context
    const chatHistory = await ChatHistory.find({ userId }).sort({ timestamp: 1 }).limit(10);
    const aiResponseText = await getGroqResponse(
      [...chatHistory.map(msg => ({ sender: msg.sender, text: msg.text }))], 
      language,
      req.user // Pass user details
    );

    // Save AI response to history
    const aiMessage = new ChatHistory({
      userId,
      text: aiResponseText,
      sender: 'ai',
      language,
      timestamp: new Date()
    });
    await aiMessage.save();
    res.json({ 
      response: aiResponseText,
      language,
      timestamp: new Date(),
      user: {
        firstName: req.user.firstName,
        languagePreference: language
      }
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      errNo: -2,
      errMsg: error.message || 'Service is currently unstable, please try again later',
      message: 'Failed to process chat message'
    });
  }
});

app.post('/api/whisper/transcribe', 
  auth,
  upload.single('audio'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          errNo: -13,
          errMsg: 'No audio file provided',
          message: 'Please provide an audio file for transcription'
        });
      }

      const language = req.body.language || 'en';
      
      // Convert audio buffer to base64 for Whisper API
      const audioBase64 = req.file.buffer.toString('base64');
      
      // Call Whisper API through Groq
      const response = await axios.post('https://api.groq.com/openai/v1/audio/transcriptions', {
        file: `data:audio/wav;base64,${audioBase64}`,
        model: 'whisper-large',
        language: language
      }, {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      res.json({
        text: response.data.text,
        language: response.data.language || language
      });
    } catch (error) {
      console.error('Whisper transcription error:', error.response?.data || error.message);
      res.status(500).json({
        errNo: -14,
        errMsg: 'Failed to transcribe audio',
        message: 'Audio processing failed. Please try again.'
      });
    }
  }
);

// Text-to-speech endpoint
app.post('/api/speak', 
  auth,
  body('text').notEmpty().trim().escape(),
  body('language').isIn(['en', 'hi', 'ta', 'te', 'kn', 'ml', 'bn', 'mr', 'gu', 'pa']),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        errNo: -5,
        errMsg: 'Validation failed',
        message: 'Validation errors',
        errors: errors.array() 
      });
    }

    try {
      const { text, language } = req.body;
      
      // Call Groq's TTS API (if available) or use local TTS
      // This is a placeholder - adjust based on Groq's actual TTS API
      const response = await axios.post('https://api.groq.com/openai/v1/audio/speech', {
        input: text,
        voice: language === 'hi' ? 'hi-IN-Standard-A' : 
               language === 'ta' ? 'ta-IN-Standard-A' : 'en-US-Standard-A',
        language_code: language === 'en' ? 'en-US' : `${language}-IN`
      }, {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      });

      res.set('Content-Type', 'audio/mpeg');
      res.send(response.data);
    } catch (error) {
      console.error('TTS error:', error.response?.data || error.message);
      res.status(500).json({
        errNo: -15,
        errMsg: 'Failed to generate speech',
        message: 'Speech generation failed. Please try again.'
      });
    }
  }
);

app.get('/api/chat/history', auth, async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ 
        errNo: -1, 
        errMsg: 'Authentication required',
        message: 'Please login to view chat history'
      });
    }

    const history = await ChatHistory.find({ userId: req.user.userId })
      .sort({ timestamp: -1 })
      .limit(20);
    res.json(history);
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ 
      errNo: -2,
      errMsg: 'Failed to get chat history',
      message: 'Internal server error'
    });
  }
});

// Language detection endpoint
app.post('/api/detect-language', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ 
      errNo: -4,
      errMsg: 'Text is required',
      message: 'Please provide text for language detection'
    });

    // Simple language detection (for demo - in production use a proper library)
    const detectLanguage = (text) => {
      const hindiRegex = /[\u0900-\u097F]/;
      const tamilRegex = /[\u0B80-\u0BFF]/;
      
      if (hindiRegex.test(text)) return 'hi';
      if (tamilRegex.test(text)) return 'ta';
      return 'en';
    };

    const language = detectLanguage(text);
    res.json({ language });
  } catch (error) {
    console.error('Language detection error:', error);
    res.status(500).json({ 
      errNo: -2,
      errMsg: 'Failed to detect language',
      message: 'Internal server error'
    });
  }
});

// Existing routes from your original server.js
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

app.use('/api/otp', otpRoutes);

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

// Signup route
app.post('/api/auth/signup', validateSignup, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Signup validation errors:', errors.array());
      return res.status(400).json({ 
        errNo: -5,
        errMsg: 'Validation failed',
        message: 'Validation errors',
        errors: errors.array() 
      });
    }

    let { firstName, lastName, email, phone, password } = req.body;
    const formattedPhone = formatIndianPhone(phone);
    if (!formattedPhone) {
      return res.status(400).json({ 
        errNo: -6,
        errMsg: 'Invalid phone format',
        message: 'Phone must be a valid Indian number (10 digits or +91XXXXXXXXXX)' 
      });
    }

    firstName = firstName.trim();
    lastName = lastName.trim();
    email = email.trim().toLowerCase();

    const existingByEmail = await User.findOne({ email });
    if (existingByEmail) {
      return res.status(400).json({ 
        errNo: -7,
        errMsg: 'Email already exists',
        message: 'User with this email already exists' 
      });
    }

    const existingByPhone = await User.findOne({ phone: formattedPhone });
    if (existingByPhone) {
      return res.status(400).json({ 
        errNo: -8,
        errMsg: 'Phone already exists',
        message: 'User with this phone number already exists' 
      });
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
    if (error && error.code === 11000) {
      const dupField = Object.keys(error.keyPattern || {}).join(', ') || 'field';
      console.error('Duplicate key error on signup:', error.keyValue || error.message);
      return res.status(400).json({ 
        errNo: -9,
        errMsg: `Duplicate value for ${dupField}`,
        message: 'Duplicate field value'
      });
    }
    console.error('Signup error:', error);
    res.status(500).json({ 
      errNo: -2,
      errMsg: 'Internal server error',
      message: 'Failed to create user'
    });
  }
});

// Login route
app.post('/api/auth/login', validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Login validation errors:', errors.array());
      return res.status(400).json({ 
        errNo: -5,
        errMsg: 'Validation failed',
        message: 'Validation errors',
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ 
      errNo: -10,
      errMsg: 'Invalid credentials',
      message: 'Invalid email or password'
    });

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) return res.status(401).json({ 
      errNo: -10,
      errMsg: 'Invalid credentials',
      message: 'Invalid email or password'
    });

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPassword } = user.toObject();
    res.json({ 
      message: 'Login successful', 
      user: userWithoutPassword, 
      token 
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      errNo: -2,
      errMsg: 'Internal server error',
      message: 'Failed to login'
    });
  }
});

// User profile route
app.get('/api/user/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ 
      errNo: -11,
      errMsg: 'User not found',
      message: 'User account not found' 
    });

    const { password: _, ...userWithoutPassword } = user.toObject();
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      errNo: -2,
      errMsg: 'Internal server error',
      message: 'Failed to get user profile'
    });
  }
});

// SMS routes
app.use('/api/sms', smsRoutes);

// Medication Form routes with authentication
app.use('/api/medication-form', auth, medicationFormRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error middleware:', err);
  res.status(500).json({ 
    errNo: -2,
    errMsg: 'Internal server error',
    message: 'Something went wrong!' 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    errNo: -12,
    errMsg: 'Route not found',
    message: 'The requested endpoint does not exist' 
  });
});

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