const express = require('express');
const router = express.Router();
const SMSService = require('../smsService');
const notificationScheduler = require('../notificationScheduler');
const auth = require('../middleware/auth');
const User = require('../models/User');
const MedicationForm = require('../models/MedicationForm');
const Reminder = require('../models/Reminder');
const twilio = require('twilio');

// ✅ Create new medication and attach to logged-in user
router.post('/add-medication', auth, async (req, res) => {
  try {
    const medication = new MedicationForm({
      ...req.body,
      userId: req.user.userId // ensure medication is linked to the logged-in user
    });
    await medication.save();

    // Schedule reminders if enabled
    if (medication.reminders && medication.times && medication.times.length > 0) {
      const user = await User.findById(req.user.userId);
      if (user) {
        medication.times.forEach(time => {
          notificationScheduler.scheduleMedicationReminder(user, medication, time);
        });
      }
    }

    res.json({ success: true, message: 'Medication created successfully', medication });
  } catch (error) {
    console.error('Add medication error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ✅ Webhook for incoming SMS responses
router.post('/webhook', async (req, res) => {
  try {
    const twiml = new twilio.twiml.MessagingResponse();
    const incomingMessage = req.body.Body.trim().toUpperCase();
    const fromNumber = req.body.From;

    console.log(`📱 Received SMS from ${fromNumber}: ${incomingMessage}`);

    const user = await User.findOne({ phone: fromNumber });
    if (!user) {
      console.log(`❌ User not found for phone number: ${fromNumber}`);
      twiml.message('Sorry, we could not identify your account. Please contact support.');
      return res.type('text/xml').send(twiml.toString());
    }

    if (incomingMessage === 'TAKEN') {
      twiml.message('Thank you for confirming! We have recorded that you have taken your medication.');
      console.log(`✅ User ${user._id} has taken their medication`);
    } else if (incomingMessage === 'MISSED') {
      twiml.message('We have recorded that you missed your medication. Stay consistent for your health.');
      console.log(`❌ User ${user._id} has missed their medication`);
    } else if (incomingMessage === 'SNOOZE') {
      twiml.message('Your reminder has been snoozed. We will remind you again in 15 minutes.');
      const fifteenMinutesLater = new Date(Date.now() + 15 * 60 * 1000);
      const hours = fifteenMinutesLater.getHours().toString().padStart(2, '0');
      const minutes = fifteenMinutesLater.getMinutes().toString().padStart(2, '0');
      const snoozeTime = `${hours}:${minutes}`;

      const latestReminder = await Reminder.findOne(
        { userId: user._id, sent: true },
        {},
        { sort: { sentAt: -1 } }
      );

      if (latestReminder) {
        setTimeout(async () => {
          try {
            await SMSService.sendMedicationReminder(
              fromNumber,
              `${user.firstName} ${user.lastName}`,
              latestReminder.medicationName,
              snoozeTime,
              latestReminder.dosage,
              latestReminder.instructions,
              latestReminder.medicationId
            );
            console.log(`🔄 Snoozed reminder sent`);
          } catch (error) {
            console.error('Error sending snoozed reminder:', error);
          }
        }, 15 * 60 * 1000);

        console.log(`⏰ Reminder snoozed for user ${user._id} until ${snoozeTime}`);
      }
    } else {
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

// ✅ Update user phone number (fixed)
router.put('/update-phone', auth, async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return res.status(400).json({ success: false, message: 'Phone number is required' });

    const isValid = SMSService.validatePhoneNumber(phoneNumber);
    if (!isValid) return res.status(400).json({ success: false, message: 'Invalid phone number format' });

    const formattedPhone = SMSService.formatPhoneNumber(phoneNumber);

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { phone: formattedPhone },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, message: 'Phone number updated successfully', phoneNumber: formattedPhone });
  } catch (error) {
    console.error('Update phone error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ✅ Schedule medication reminders
router.post('/schedule-medication', auth, async (req, res) => {
  try {
    const { medicationId } = req.body;
    if (!medicationId) return res.status(400).json({ success: false, message: 'Medication ID is required' });

    const medication = await MedicationForm.findById(medicationId);
    if (!medication) return res.status(404).json({ success: false, message: 'Medication not found' });
    if (medication.userId.toString() !== req.user.userId) return res.status(403).json({ success: false, message: 'Access denied' });

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (medication.reminders && medication.times && medication.times.length > 0) {
      medication.times.forEach(time => {
        notificationScheduler.scheduleMedicationReminder(user, medication, time);
      });
    }

    res.json({ success: true, message: 'Medication reminder scheduled successfully' });
  } catch (error) {
    console.error('Schedule medication error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ✅ Test SMS endpoint (for debugging)
router.post('/test-medication-sms', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    console.log(`🧪 Testing medication SMS for user: ${user.firstName} ${user.lastName}`);
    console.log(`📱 Phone number: ${user.phone}`);

    const result = await SMSService.sendMedicationReminder(
      user.phone,
      `${user.firstName} ${user.lastName}`,
      'Test Medication (Aspirin)',
      '14:30',
      '1 tablet',
      'Take with water'
    );

    console.log('🧪 Test SMS result:', result);
    res.json({
      success: true,
      message: 'Test SMS sent',
      result: result
    });
  } catch (error) {
    console.error('❌ Test SMS error:', error);
    res.status(500).json({
      success: false,
      message: 'Test SMS failed',
      error: error.message
    });
  }
});

module.exports = router;
