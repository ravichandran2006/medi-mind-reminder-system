const mongoose = require('mongoose');

const medicationFormSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  dosage: { 
    type: String, 
    required: true 
  },
  frequency: { 
    type: String, 
    required: true,
    enum: ['once', 'twice', 'three', 'four']
  },
  times: [{ 
    type: String, 
    required: true 
  }],
  startDate: { 
    type: Date, 
    required: true 
  },
  endDate: { 
    type: Date 
  },
  days: [{ 
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  }],
  instructions: { 
    type: String 
  },
  reminders: { 
    type: Boolean, 
    default: true 
  },
  // Physical appearance fields
  tabletColor: { 
    type: String, 
    required: true 
  },
  tabletSize: { 
    type: String, 
    required: true 
  },
  tabletAppearance: { 
    type: String, 
    required: true 
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('MedicationForm', medicationFormSchema);

