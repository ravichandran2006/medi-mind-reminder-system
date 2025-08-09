const cron = require('node-cron');
const SMSService = require('./smsService');

class NotificationScheduler {
  constructor() {
    this.scheduledJobs = new Map();
    this.users = [];
    this.medications = [];
  }

  // Set data references from server
  setData(users, medications) {
    this.users = users;
    this.medications = medications;
    console.log(`📊 Notification scheduler updated: ${users.length} users, ${medications.length} medications`);
  }

  // Initialize all scheduled notifications
  async initializeNotifications() {
    try {
      console.log('🔄 Initializing notification scheduler...');
      this.stopAllJobs();
      await this.scheduleMedicationReminders();
      this.scheduleHealthLogReminders();
      console.log('✅ Notification scheduler initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing notification scheduler:', error);
    }
  }

  // Schedule medication reminders for all users
  async scheduleMedicationReminders() {
    try {
      console.log('📅 Scheduling medication reminders...');
      this.users.forEach(user => {
        const userMedications = this.medications.filter(med => med.userId === user.id);
        userMedications.forEach(medication => {
          if (medication.reminders && medication.times && medication.times.length > 0) {
            medication.times.forEach(time => {
              this.scheduleMedicationReminder(user, medication, time);
            });
          }
        });
      });
    } catch (error) {
      console.error('❌ Error scheduling medication reminders:', error);
    }
  }

  // Schedule a single medication reminder
  scheduleMedicationReminder(user, medication, time) {
    try {
      const [hours, minutes] = time.split(':');
      // Use Asia/Kolkata timezone for India
      const cronExpression = `${minutes} ${hours} * * *`;
      const jobId = `medication_${user.id}_${medication.id}_${time}`;

      // Cancel existing job if it exists
      if (this.scheduledJobs.has(jobId)) {
        this.scheduledJobs.get(jobId).stop();
      }

      const job = cron.schedule(cronExpression, async () => {
        try {
          // Use IST timezone for scheduling
          const currentDate = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
          const startDate = new Date(medication.startDate);
          const endDate = medication.endDate ? new Date(medication.endDate) : null;

          // Skip if medication is not active
          if (currentDate < startDate || (endDate && currentDate > endDate)) {
            console.log(`⏭️ Skipping reminder for ${medication.name} - not active`);
            return;
          }

          // Check if it's the right day of the week
          if (medication.days && medication.days.length > 0) {
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const currentDay = dayNames[currentDate.getDay()];
            if (!medication.days.includes(currentDay)) {
              console.log(`⏭️ Skipping reminder for ${medication.name} - not scheduled for ${currentDay}`);
              return;
            }
          }

          // Format phone number for Twilio
          let formattedPhone = SMSService.formatPhoneNumber(user.phone);
          if (!formattedPhone) {
            // fallback: ensure +91 prefix
            formattedPhone = user.phone.startsWith('+91') ? user.phone : `+91${user.phone}`;
          }

          const userName = `${user.firstName} ${user.lastName}`;
          const result = await SMSService.sendMedicationReminder(
            formattedPhone,
            userName,
            medication.name,
            time
          );

          if (result.success) {
            console.log(`✅ Scheduled reminder sent for ${medication.name} to ${userName}`);
          } else {
            console.error(`❌ Failed to send scheduled reminder for ${medication.name}: ${result.error}`);
          }
        } catch (error) {
          console.error(`❌ Error in scheduled reminder for ${medication.name}:`, error);
        }
      }, {
        scheduled: true,
        timezone: "Asia/Kolkata"
      });

      this.scheduledJobs.set(jobId, job);
      console.log(`   ✅ Scheduled reminder for ${medication.name} at ${time} (IST)`);

    } catch (error) {
      console.error(`❌ Error scheduling reminder for ${medication.name}:`, error);
    }
  }

  // Schedule daily health log reminders
  scheduleHealthLogReminders() {
    try {
      console.log('📅 Scheduling health log reminders...');
      const jobId = 'health_log_daily';
      if (this.scheduledJobs.has(jobId)) {
        this.scheduledJobs.get(jobId).stop();
      }
      const job = cron.schedule('0 9 * * *', async () => {
        try {
          console.log('📊 Sending daily health log reminders...');
          this.users.forEach(async (user) => {
            let formattedPhone = SMSService.formatPhoneNumber(user.phone);
            if (!formattedPhone) {
              formattedPhone = user.phone.startsWith('+91') ? user.phone : `+91${user.phone}`;
            }
            const userName = `${user.firstName} ${user.lastName}`;
            const result = await SMSService.sendHealthLogReminder(formattedPhone, userName);
            if (result.success) {
              console.log(`✅ Health log reminder sent to ${userName}`);
            } else {
              console.error(`❌ Failed to send health log reminder to ${userName}: ${result.error}`);
            }
          });
        } catch (error) {
          console.error('❌ Error sending health log reminders:', error);
        }
      }, {
        scheduled: true,
        timezone: "Asia/Kolkata"
      });
      this.scheduledJobs.set(jobId, job);
      console.log('   ✅ Daily health log reminders scheduled (IST)');
    } catch (error) {
      console.error('❌ Error scheduling health log reminders:', error);
    }
  }

  // Add medication reminder for a specific user
  async addMedicationReminder(userId, medication) {
    try {
      console.log(`📅 Adding medication reminder for user ${userId}, medication ${medication.id}`);
      const user = this.users.find(u => u.id === userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }
      if (medication.reminders && medication.times && medication.times.length > 0) {
        medication.times.forEach(time => {
          this.scheduleMedicationReminder(user, medication, time);
        });
        console.log(`✅ Added ${medication.times.length} reminders for ${medication.name}`);
      } else {
        console.log(`⚠️ No reminders configured for ${medication.name}`);
      }
    } catch (error) {
      console.error('❌ Error adding medication reminder:', error);
      throw error;
    }
  }

  // Update medication reminder
  async updateMedicationReminder(userId, medication) {
    try {
      console.log(`📅 Updating medication reminder for user ${userId}, medication ${medication.id}`);
      this.removeMedicationReminder(userId, medication.id);
      await this.addMedicationReminder(userId, medication);
    } catch (error) {
      console.error('❌ Error updating medication reminder:', error);
      throw error;
    }
  }

  // Remove medication reminder
  removeMedicationReminder(userId, medicationId) {
    try {
      console.log(`📅 Removing medication reminder for user ${userId}, medication ${medicationId}`);
      const user = this.users.find(u => u.id === userId);
      if (!user) {
        console.warn(`⚠️ User not found: ${userId}`);
        return;
      }
      const medication = this.medications.find(m => m.id === medicationId && m.userId === userId);
      if (!medication) {
        console.warn(`⚠️ Medication not found: ${medicationId} for user ${userId}`);
        return;
      }
      if (medication.times) {
        medication.times.forEach(time => {
          const jobId = `medication_${userId}_${medicationId}_${time}`;
          if (this.scheduledJobs.has(jobId)) {
            this.scheduledJobs.get(jobId).stop();
            this.scheduledJobs.delete(jobId);
            console.log(`   ✅ Removed reminder for ${medication.name} at ${time}`);
          }
        });
      }
    } catch (error) {
      console.error('❌ Error removing medication reminder:', error);
      throw error;
    }
  }

  // Remove all reminders for a user
  removeUserReminders(userId) {
    try {
      console.log(`📅 Removing all reminders for user ${userId}`);
      for (const [jobId, job] of this.scheduledJobs.entries()) {
        if (jobId.includes(`_${userId}_`)) {
          job.stop();
          this.scheduledJobs.delete(jobId);
        }
      }
      console.log(`✅ Removed all reminders for user ${userId}`);
    } catch (error) {
      console.error('❌ Error removing user reminders:', error);
      throw error;
    }
  }

  // Get all scheduled jobs
  getScheduledJobs() {
    const jobs = [];
    for (const [jobId, job] of this.scheduledJobs.entries()) {
      jobs.push({
        id: jobId,
        running: job.running,
        nextDate: job.nextDate()
      });
    }
    return jobs;
  }

  // Stop all jobs
  stopAllJobs() {
    console.log('🛑 Stopping all scheduled jobs...');
    for (const [jobId, job] of this.scheduledJobs.entries()) {
      job.stop();
    }
    this.scheduledJobs.clear();
    console.log('✅ All scheduled jobs stopped');
  }

  // Get scheduler status
  getStatus() {
    return {
      users: this.users.length,
      medications: this.medications.length,
      scheduledJobs: this.scheduledJobs.size,
      smsService: SMSService.getStatus()
    };
  }
}

module.exports = NotificationScheduler;