// Simple Medication model for in-memory storage
// In production, this would be replaced with a proper database model

class Medication {
  constructor(data) {
    this.id = data.id || Date.now().toString();
    this.userId = data.userId;
    this.name = data.name;
    this.dosage = data.dosage;
    this.frequency = data.frequency;
    this.times = data.times || [];
    this.days = data.days || [];
    this.startDate = data.startDate;
    this.endDate = data.endDate;
    this.reminders = data.reminders !== undefined ? data.reminders : true;
    this.notes = data.notes;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  static findById(id) {
    // This would be replaced with database query in production
    return global.medications ? global.medications.find(med => med.id === id) : null;
  }

  static findByUserId(userId) {
    // This would be replaced with database query in production
    return global.medications ? global.medications.filter(med => med.userId === userId) : [];
  }

  static create(medicationData) {
    const medication = new Medication(medicationData);
    if (!global.medications) global.medications = [];
    global.medications.push(medication);
    return medication;
  }

  static update(id, updateData) {
    if (!global.medications) return null;
    const index = global.medications.findIndex(med => med.id === id);
    if (index !== -1) {
      global.medications[index] = { 
        ...global.medications[index], 
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      return global.medications[index];
    }
    return null;
  }

  static delete(id) {
    if (!global.medications) return false;
    const index = global.medications.findIndex(med => med.id === id);
    if (index !== -1) {
      global.medications.splice(index, 1);
      return true;
    }
    return false;
  }

  static deleteByUserId(userId) {
    if (!global.medications) return false;
    const initialLength = global.medications.length;
    global.medications = global.medications.filter(med => med.userId !== userId);
    return global.medications.length < initialLength;
  }
}

module.exports = Medication; 