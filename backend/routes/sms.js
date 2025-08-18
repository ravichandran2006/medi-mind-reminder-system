const express = require('express');
const router = express.Router();
const SMSService = require('../smsService');
const notificationScheduler = require('../notificationScheduler');
const auth = require('../middleware/auth');
const User = require('../models/User');
const MedicationForm = require('../models/MedicationForm');
const Reminder = require('../models/Reminder');
const twilio = require('twilio');



// Webhook for incoming SMS responses
router.post('/webhook', async (req, res) => {
  try {
    // Parse the incoming SMS message
    const twiml = new twilio.twiml.MessagingResponse();
    const incomingMessage = req.body.Body.trim().toUpperCase();
    const fromNumber = req.body.From;
    
    console.log(`📱 Received SMS from ${fromNumber}: ${incomingMessage}`);
    
    // Find the user by phone number
    const user = await User.findOne({ phone: fromNumber });
    if (!user) {
      console.log(`❌ User not found for phone number: ${fromNumber}`);
      twiml.message('Sorry, we could not identify your account. Please contact support.');
      return res.type('text/xml').send(twiml.toString());
    }
    
    // Handle different response types
    if (incomingMessage === 'TAKEN') {
      // User has taken their medication
      twiml.message('Thank you for confirming! We have recorded that you have taken your medication.');
      
      // Update medication adherence record (could be implemented in a separate model)
      console.log(`✅ User ${user._id} has taken their medication`);
      
    } else if (incomingMessage === 'MISSED') {
      // User has missed their medication
      twiml.message('We have recorded that you missed your medication. Remember that consistent medication adherence is important for your health.');
      
      // Update medication adherence record
      console.log(`❌ User ${user._id} has missed their medication`);
      
    } else if (incomingMessage === 'SNOOZE') {
      // User wants to snooze the reminder
      twiml.message('Your reminder has been snoozed. We will remind you again in 15 minutes.');
      
      // Schedule a new reminder in 15 minutes
      const fifteenMinutesLater = new Date(Date.now() + 15 * 60 * 1000);
      const hours = fifteenMinutesLater.getHours().toString().padStart(2, '0');
      const minutes = fifteenMinutesLater.getMinutes().toString().padStart(2, '0');
      const snoozeTime = `${hours}:${minutes}`;
      
      // Get the most recent medication reminder for this user
      const latestReminder = await Reminder.findOne(
        { userId: user._id, sent: true },
        {},
        { sort: { 'sentAt': -1 } }
      );
      
      if (latestReminder) {
        // Send a snoozed reminder
        setTimeout(async () => {
          try {
            const result = await SMSService.sendMedicationReminder(
              fromNumber,
              `${user.firstName} ${user.lastName}`,
              latestReminder.medicationName,
              snoozeTime,
              latestReminder.dosage,
              latestReminder.instructions,
              latestReminder.medicationId
            );
            console.log(`🔄 Snoozed reminder sent: ${result.success ? 'Success' : 'Failed'}`);
          } catch (error) {
            console.error('Error sending snoozed reminder:', error);
          }
        }, 15 * 60 * 1000); // 15 minutes
        
        console.log(`⏰ Reminder snoozed for user ${user._id} until ${snoozeTime}`);
      } else {
        console.log(`❌ No recent reminder found for user ${user._id}`);
      }
    } else {
      // Unknown command
      twiml.message('Sorry, I didn\'t understand that. Please reply with TAKEN, MISSED, or SNOOZE.');
    }
    
    return res.type('text/xml').send(twiml.toString());
  } catch (error) {
    console.error('SMS webhook error:', error);
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message('Sorry, an error occurred. Please try again later.');
    return res.type('text/xml').send(twiml.toString());
  }
});

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

    const user = await User.findById(req.user.userId);
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
      'Now',
      '1 tablet',
      'Take with water after meals',
      'test-medication-id'
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

    const medication = await MedicationForm.findById(medicationId);
    if (!medication) {
      return res.status(404).json({ 
        success: false, 
        message: 'Medication not found' 
      });
    }

    // Check if medication belongs to user
    if (medication.userId.toString() !== req.user.userId) {
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
      reminderTime,
      medication.dosage,
      medication.instructions,
      medication._id
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
    const user = await User.findById(req.user.userId);
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

    const medication = await MedicationForm.findById(medicationId);
    
    if (!medication) {
      return res.status(404).json({ 
        success: false, 
        message: 'Medication not found' 
      });
    }

    // Check if medication belongs to user
    if (medication.userId.toString() !== req.user.userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    // Get user information
    const user = await User.findById(req.user.userId);
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

    const medication = await MedicationForm.findById(medicationId);
    
    if (!medication) {
      return res.status(404).json({ 
        success: false, 
        message: 'Medication not found' 
      });
    }

    // Check if medication belongs to user
    if (medication.userId.toString() !== req.user.userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    // Remove existing reminders and schedule new ones
    notificationScheduler.removeMedicationReminder(req.user.userId, medicationId);
    
    // Get user information
    const user = await User.findById(req.user.userId);
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