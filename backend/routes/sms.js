const express = require('express');
const router = express.Router();
const SMSService = require('../smsService');
const notificationScheduler = require('../notificationScheduler');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Medication = require('../models/Medication');

// Test SMS endpoint
router.post('/test', auth, async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;
    
    if (!phoneNumber || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number and message are required' 
      });
    }

    const user = User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const formattedPhone = SMSService.formatPhoneNumber(phoneNumber);
    const userName = `${user.firstName} ${user.lastName}`;

    const result = await SMSService.sendMedicationReminder(
      formattedPhone,
      userName,
      'Test Medication',
      'Now'
    );

    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Test SMS sent successfully',
        messageId: result.messageId 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send SMS',
        error: result.error 
      });
    }
  } catch (error) {
    console.error('Test SMS error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Send immediate medication reminder
router.post('/medication-reminder', auth, async (req, res) => {
  try {
    const { medicationId, time } = req.body;
    
    if (!medicationId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Medication ID is required' 
      });
    }

    const user = User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const medication = Medication.findById(medicationId);
    if (!medication) {
      return res.status(404).json({ 
        success: false, 
        message: 'Medication not found' 
      });
    }

    // Check if medication belongs to user
    if (medication.userId !== req.user.userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    const formattedPhone = SMSService.formatPhoneNumber(user.phone);
    const userName = `${user.firstName} ${user.lastName}`;
    const reminderTime = time || 'now';

    const result = await SMSService.sendMedicationReminder(
      formattedPhone,
      userName,
      medication.name,
      reminderTime
    );

    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Medication reminder sent successfully',
        messageId: result.messageId 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send medication reminder',
        error: result.error 
      });
    }
  } catch (error) {
    console.error('Medication reminder error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Send health log reminder
router.post('/health-log-reminder', auth, async (req, res) => {
  try {
    const user = User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const formattedPhone = SMSService.formatPhoneNumber(user.phone);
    const userName = `${user.firstName} ${user.lastName}`;

    const result = await SMSService.sendHealthLogReminder(formattedPhone, userName);

    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Health log reminder sent successfully',
        messageId: result.messageId 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send health log reminder',
        error: result.error 
      });
    }
  } catch (error) {
    console.error('Health log reminder error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Schedule medication reminder
router.post('/schedule-medication', auth, async (req, res) => {
  try {
    const { medicationId } = req.body;
    
    if (!medicationId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Medication ID is required' 
      });
    }

    const medication = Medication.findById(medicationId);
    
    if (!medication) {
      return res.status(404).json({ 
        success: false, 
        message: 'Medication not found' 
      });
    }

    // Check if medication belongs to user
    if (medication.userId !== req.user.userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    // Get user information
    const user = User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Schedule automatic reminders for all times
    if (medication.reminders && medication.times && medication.times.length > 0) {
      medication.times.forEach(time => {
        notificationScheduler.scheduleMedicationReminder(user, medication, time);
      });
    }

    res.json({ 
      success: true, 
      message: 'Medication reminder scheduled successfully' 
    });
  } catch (error) {
    console.error('Schedule medication error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Update medication reminder
router.put('/update-medication', auth, async (req, res) => {
  try {
    const { medicationId } = req.body;
    
    if (!medicationId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Medication ID is required' 
      });
    }

    const medication = Medication.findById(medicationId);
    
    if (!medication) {
      return res.status(404).json({ 
        success: false, 
        message: 'Medication not found' 
      });
    }

    // Check if medication belongs to user
    if (medication.userId !== req.user.userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    // Remove existing reminders and schedule new ones
    notificationScheduler.removeMedicationReminder(req.user.userId, medicationId);
    
    // Get user information
    const user = User.findById(req.user.userId);
    if (user && medication.reminders && medication.times && medication.times.length > 0) {
      medication.times.forEach(time => {
        notificationScheduler.scheduleMedicationReminder(user, medication, time);
      });
    }

    res.json({ 
      success: true, 
      message: 'Medication reminder updated successfully' 
    });
  } catch (error) {
    console.error('Update medication error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Remove medication reminder
router.delete('/remove-medication/:medicationId', auth, async (req, res) => {
  try {
    const { medicationId } = req.params;
    
    notificationScheduler.removeMedicationReminder(req.user.userId, medicationId);

    res.json({ 
      success: true, 
      message: 'Medication reminder removed successfully' 
    });
  } catch (error) {
    console.error('Remove medication error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Get scheduled jobs
router.get('/scheduled-jobs', auth, async (req, res) => {
  try {
    const jobs = notificationScheduler.getScheduledJobs();
    const status = notificationScheduler.getStatus();
    res.json({ 
      success: true, 
      jobs,
      status
    });
  } catch (error) {
    console.error('Get scheduled jobs error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Get SMS service status
router.get('/status', auth, async (req, res) => {
  try {
    const status = SMSService.getStatus();
    res.json({ 
      success: true, 
      status 
    });
  } catch (error) {
    console.error('Get SMS status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Validate phone number
router.post('/validate-phone', auth, async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number is required' 
      });
    }

    const isValid = SMSService.validatePhoneNumber(phoneNumber);
    const formatted = SMSService.formatPhoneNumber(phoneNumber);

    res.json({ 
      success: true, 
      isValid,
      formatted,
      original: phoneNumber
    });
  } catch (error) {
    console.error('Validate phone error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Update user phone number
router.put('/update-phone', auth, async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number is required' 
      });
    }

    const isValid = SMSService.validatePhoneNumber(phoneNumber);
    
    if (!isValid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid phone number format' 
      });
    }

    const formattedPhone = SMSService.formatPhoneNumber(phoneNumber);
    
    const updatedUser = User.update(req.user.userId, { phone: formattedPhone });
    
    if (!updatedUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Phone number updated successfully',
      phoneNumber: formattedPhone
    });
  } catch (error) {
    console.error('Update phone error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

module.exports = router; 