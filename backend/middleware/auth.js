const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ 
        success: false,
        error: 'Authentication token missing',
        message: 'Please login to access this resource'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch user details
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      throw new Error('User not found');
    }

    // Attach user to request
    req.user = {
      userId: user._id,
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone
    };

    console.log(`✅ Authenticated user: ${user.firstName} ${user.lastName}`);
    next();
  } catch (error) {
    console.error('❌ Authentication error:', error.message);
    res.status(403).json({ 
      success: false,
      error: 'Invalid or expired token',
      message: 'Please login again'
    });
  }
};

module.exports = auth;