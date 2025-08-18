const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  medicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MedicationForm',
    required: true
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  medicationName: {
    type: String,
    required: true
  },
  dosage: {
    type: String,
    required: true
  },
  instructions: {
    type: String,
    default: ''
  },
  sent: {
    type: Boolean,
    default: false
  },
  sentAt: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('Reminder', reminderSchema);