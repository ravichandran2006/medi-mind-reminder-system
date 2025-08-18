const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const MedicationForm = require('../models/MedicationForm');
const Reminder = require('../models/Reminder');

// Validation rules for create/update medication
const validateMedication = [
  body('name').trim().notEmpty().withMessage('Medication name is required'),
  body('dosage').trim().notEmpty().withMessage('Dosage is required'),
  body('frequency').isIn(['once', 'twice', 'three', 'four']).withMessage('Invalid frequency'),
  body('times').isArray({ min: 1 }).withMessage('At least one time is required'),
  body('times.*').isString().withMessage('Each time must be a string'),
  body('startDate').notEmpty().withMessage('Valid start date is required'),
  body('tabletColor').trim().notEmpty().withMessage('Tablet color is required'),
  body('tabletSize').trim().notEmpty().withMessage('Tablet size is required'),
  body('tabletAppearance').trim().notEmpty().withMessage('Tablet appearance is required'),
];

// Auth is applied at mount level in server.js via authenticateToken

// Get all medications for a user
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    const medications = await MedicationForm.find({ userId }).sort({ createdAt: -1 });
    res.json({ medications });
  } catch (error) {
    console.error('Error fetching medications:', error);
    res.status(500).json({ message: 'Failed to fetch medications' });
  }
});

// Create new medication
router.post('/', validateMedication, async (req, res) => {
  try {
    console.log('📝 Creating new medication...');
    console.log('👤 User ID:', req.user.userId);
    console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const userId = req.user.userId;
    const {
      name,
      dosage,
      frequency,
      times,
      startDate,
      endDate,
      days,
      instructions,
      reminders,
      tabletColor,
      tabletSize,
      tabletAppearance,
    } = req.body;

    console.log('✅ Validation passed, creating medication...');

    const medication = new MedicationForm({
      userId,
      name,
      dosage,
      frequency,
      times,
      startDate,
      endDate: endDate || null,
      days: days || [],
      instructions: instructions || '',
      reminders: reminders !== undefined ? reminders : true,
      tabletColor,
      tabletSize,
      tabletAppearance,
    });

    console.log('💾 Saving medication to database...');
    const savedMedication = await medication.save();

    // Generate reminders for next 30 days (fire-and-forget)
    (async () => {
      try {
        if (savedMedication.reminders) {
          const userId = req.user.userId;
          const created = [];
          const today = new Date();
          const end = new Date(today);
          end.setDate(end.getDate() + 30);
          const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
          for (let d = new Date(today); d <= end; d.setDate(d.getDate() + 1)) {
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            const dateStr = `${yyyy}-${mm}-${dd}`;
            const startOk = !savedMedication.startDate || new Date(dateStr) >= new Date(savedMedication.startDate);
            const endOk = !savedMedication.endDate || new Date(dateStr) <= new Date(savedMedication.endDate);
            const dayOk = !savedMedication.days || savedMedication.days.length === 0 || savedMedication.days.includes(dayNames[new Date(dateStr).getDay()]);
            if (!(startOk && endOk && dayOk)) continue;
            for (const time of savedMedication.times || []) {
              await Reminder.updateOne(
                { userId, medicationId: savedMedication._id, date: dateStr, time },
                {
                  $setOnInsert: {
                    medicationName: savedMedication.name,
                    dosage: savedMedication.dosage,
                    instructions: savedMedication.instructions || ''
                  }
                },
                { upsert: true }
              );
              created.push({ date: dateStr, time });
            }
          }
          console.log(`🗓️ Generated ${created.length} reminders for medication ${savedMedication._id}`);
          
          // Schedule SMS reminders using the notification scheduler
          try {
            // Get the notificationScheduler instance instead of the class
            const notificationSchedulerInstance = require('../server').notificationScheduler;
            const User = require('../models/User');
            
            // Get user information for SMS
            const user = await User.findById(userId);
            if (user) {
              // Add medication reminder to the scheduler
              if (notificationSchedulerInstance && typeof notificationSchedulerInstance.addMedicationReminder === 'function') {
                await notificationSchedulerInstance.addMedicationReminder(userId, savedMedication);
                console.log(`📱 SMS reminders scheduled for medication ${savedMedication._id}`);
              } else {
                console.error('❌ notificationScheduler.addMedicationReminder is not available');
              }
            } else {
              console.error(`❌ User not found for SMS scheduling: ${userId}`);
            }
          } catch (smsError) {
            console.error('❌ Failed to schedule SMS reminders:', smsError.message);
          }
        }
      } catch (e) {
        console.error('Failed to generate reminders:', e.message);
      }
    })();
    
    console.log('✅ Medication saved successfully:', savedMedication._id);
    
    res.status(201).json({
      message: 'Medication created successfully',
      medication: savedMedication,
    });
  } catch (error) {
    console.error('❌ Error creating medication:', error);
    console.error('🔍 Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      message: 'Failed to create medication',
      error: error.message 
    });
  }
});

// Update medication
router.put('/:id', validateMedication, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.userId;
    const medicationId = req.params.id;
    const updateData = req.body;

    const medication = await MedicationForm.findOneAndUpdate(
      { _id: medicationId, userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!medication) {
      return res.status(404).json({ message: 'Medication not found' });
    }

    // Regenerate reminders on update (simple approach: re-run generator)
    if (medication && medication.reminders) {
      try {
        await Reminder.deleteMany({ userId, medicationId });
        const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
        const today = new Date();
        const end = new Date(today);
        end.setDate(end.getDate() + 30);
        for (let d = new Date(today); d <= end; d.setDate(d.getDate() + 1)) {
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          const dateStr = `${yyyy}-${mm}-${dd}`;
          const startOk = !medication.startDate || new Date(dateStr) >= new Date(medication.startDate);
          const endOk = !medication.endDate || new Date(dateStr) <= new Date(medication.endDate);
          const dayOk = !medication.days || medication.days.length === 0 || medication.days.includes(dayNames[new Date(dateStr).getDay()]);
          if (!(startOk && endOk && dayOk)) continue;
          for (const time of medication.times || []) {
            await Reminder.updateOne(
              { userId, medicationId, date: dateStr, time },
              {
                $setOnInsert: {
                  medicationName: medication.name,
                  dosage: medication.dosage,
                  instructions: medication.instructions || ''
                }
              },
              { upsert: true }
            );
          }
        }
        
        // Update SMS reminders using the notification scheduler
        try {
          // Get the notificationScheduler instance instead of the class
          const notificationSchedulerInstance = require('../server').notificationScheduler;
          const User = require('../models/User');
          
          // Get user information for SMS
          const user = await User.findById(userId);
          if (user) {
            // Update medication reminder in the scheduler
            if (notificationSchedulerInstance && typeof notificationSchedulerInstance.updateMedicationReminder === 'function') {
              await notificationSchedulerInstance.updateMedicationReminder(userId, medication);
              console.log(`📱 SMS reminders updated for medication ${medicationId}`);
            } else {
              console.error('❌ notificationScheduler.updateMedicationReminder is not available');
            }
          } else {
            console.error(`❌ User not found for SMS scheduling: ${userId}`);
          }
        } catch (smsError) {
          console.error('❌ Failed to update SMS reminders:', smsError.message);
        }
      } catch (e) {
        console.error('Failed to regenerate reminders:', e.message);
      }
    }

    res.json({
      message: 'Medication updated successfully',
      medication,
    });
  } catch (error) {
    console.error('Error updating medication:', error);
    res.status(500).json({ message: 'Failed to update medication' });
  }
});

// Delete medication
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.userId;
    const medicationId = req.params.id;

    const medication = await MedicationForm.findOneAndDelete({ _id: medicationId, userId });

    if (!medication) {
      return res.status(404).json({ message: 'Medication not found' });
    }

    // Delete associated reminders
    await Reminder.deleteMany({ medicationId });
    
    // Remove SMS reminders from the scheduler
    try {
      // Get the notificationScheduler instance instead of the class
      const notificationSchedulerInstance = require('../server').notificationScheduler;
      if (notificationSchedulerInstance && typeof notificationSchedulerInstance.removeMedicationReminder === 'function') {
        await notificationSchedulerInstance.removeMedicationReminder(userId, medicationId);
        console.log(`📱 SMS reminders removed for medication ${medicationId}`);
      } else {
        console.error('❌ notificationScheduler.removeMedicationReminder is not available');
      }
    } catch (smsError) {
      console.error('❌ Failed to remove SMS reminders:', smsError.message);
      // Continue with deletion even if SMS removal fails
    }

    res.json({ message: 'Medication deleted successfully' });
  } catch (error) {
    console.error('Error deleting medication:', error);
    res.status(500).json({ message: 'Failed to delete medication' });
  }
});

// Get single medication
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user.userId;
    const medicationId = req.params.id;

    const medication = await MedicationForm.findOne({ _id: medicationId, userId });

    if (!medication) {
      return res.status(404).json({ message: 'Medication not found' });
    }

    res.json({ medication });
  } catch (error) {
    console.error('Error fetching medication:', error);
    res.status(500).json({ message: 'Failed to fetch medication' });
  }
});

module.exports = router;
