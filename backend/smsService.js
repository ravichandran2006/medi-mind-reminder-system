const twilio = require('twilio');

// Twilio configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Check if Twilio credentials are available
const isTwilioConfigured = accountSid && authToken && twilioPhoneNumber;

let client = null;
if (isTwilioConfigured) {
  try {
    client = twilio(accountSid, authToken);
    console.log('✅ Twilio client initialized successfully');
    console.log(`📱 Twilio phone number: ${twilioPhoneNumber}`);
  } catch (error) {
    console.error('❌ Failed to initialize Twilio client:', error.message);
  }
} else {
  console.log('⚠️ Twilio credentials not fully configured:');
  console.log(`   Account SID: ${accountSid ? 'Set' : 'Missing'}`);
  console.log(`   Auth Token: ${authToken ? 'Set' : 'Missing'}`);
  console.log(`   Phone Number: ${twilioPhoneNumber ? 'Set' : 'Missing'}`);
}

class SMSService {
  // Check if SMS service is available
  static isAvailable() {
    return isTwilioConfigured && client !== null;
  }

  // Send medication reminder SMS
  static async sendMedicationReminder(userPhone, userName, medicationName, time) {
    try {
      console.log(`📱 Attempting to send SMS reminder:`);
      console.log(`   To: ${userPhone}`);
      console.log(`   User: ${userName}`);
      console.log(`   Medication: ${medicationName}`);
      console.log(`   Time: ${time}`);
      
      // Check if Twilio is configured
      if (!this.isAvailable()) {
        console.log(`📱 [DEV MODE] SMS would be sent to ${userPhone}: Take ${medicationName} at ${time}`);
        return { 
          success: true, 
          messageId: 'dev-mode-' + Date.now(),
          devMode: true 
        };
      }

      const message = `Hi ${userName}, this is your Medi-Mind reminder: Take your ${medicationName} at ${time}. Stay healthy!`;
      
      console.log(`📱 Sending SMS via Twilio:`);
      console.log(`   From: ${twilioPhoneNumber}`);
      console.log(`   To: ${userPhone}`);
      console.log(`   Message: ${message}`);
      
      const result = await client.messages.create({
        body: message,
        from: twilioPhoneNumber,
        to: userPhone
      });

      console.log(`✅ SMS sent successfully to ${userPhone}: ${result.sid}`);
      return { success: true, messageId: result.sid };
    } catch (error) {
      console.error('❌ Error sending SMS:', error.message);
      console.error('❌ Error details:', error);
      return { 
        success: false, 
        error: error.message,
        code: error.code || 'UNKNOWN_ERROR'
      };
    }
  }

  // Send health log reminder SMS
  static async sendHealthLogReminder(userPhone, userName) {
    try {
      // Check if Twilio is configured
      if (!this.isAvailable()) {
        console.log(`📱 [DEV MODE] Health log reminder would be sent to ${userPhone}`);
        return { 
          success: true, 
          messageId: 'dev-mode-' + Date.now(),
          devMode: true 
        };
      }

      const message = `Hi ${userName}, this is your Medi-Mind reminder: Don't forget to log your health data today! Track your progress for better health.`;
      
      const result = await client.messages.create({
        body: message,
        from: twilioPhoneNumber,
        to: userPhone
      });

      console.log(`📱 Health log reminder SMS sent successfully to ${userPhone}: ${result.sid}`);
      return { success: true, messageId: result.sid };
    } catch (error) {
      console.error('❌ Error sending health log reminder SMS:', error.message);
      return { 
        success: false, 
        error: error.message,
        code: error.code || 'UNKNOWN_ERROR'
      };
    }
  }

  // Send appointment reminder SMS
  static async sendAppointmentReminder(userPhone, userName, appointmentDate, appointmentTime) {
    try {
      // Check if Twilio is configured
      if (!this.isAvailable()) {
        console.log(`📱 [DEV MODE] Appointment reminder would be sent to ${userPhone} for ${appointmentDate} at ${appointmentTime}`);
        return { 
          success: true, 
          messageId: 'dev-mode-' + Date.now(),
          devMode: true 
        };
      }

      const message = `Hi ${userName}, this is your Medi-Mind reminder: You have an appointment scheduled for ${appointmentDate} at ${appointmentTime}. Don't forget to prepare!`;
      
      const result = await client.messages.create({
        body: message,
        from: twilioPhoneNumber,
        to: userPhone
      });

      console.log(`📱 Appointment reminder SMS sent successfully to ${userPhone}: ${result.sid}`);
      return { success: true, messageId: result.sid };
    } catch (error) {
      console.error('❌ Error sending appointment reminder SMS:', error.message);
      return { 
        success: false, 
        error: error.message,
        code: error.code || 'UNKNOWN_ERROR'
      };
    }
  }

  // Send emergency health alert SMS
  static async sendHealthAlert(userPhone, userName, alertType, message) {
    try {
      // Check if Twilio is configured
      if (!this.isAvailable()) {
        console.log(`📱 [DEV MODE] Health alert would be sent to ${userPhone}: ${message}`);
        return { 
          success: true, 
          messageId: 'dev-mode-' + Date.now(),
          devMode: true 
        };
      }

      const alertMessage = `Hi ${userName}, this is your Medi-Mind health alert: ${message}. Please take necessary action.`;
      
      const result = await client.messages.create({
        body: alertMessage,
        from: twilioPhoneNumber,
        to: userPhone
      });

      console.log(`📱 Health alert SMS sent successfully to ${userPhone}: ${result.sid}`);
      return { success: true, messageId: result.sid };
    } catch (error) {
      console.error('❌ Error sending health alert SMS:', error.message);
      return { 
        success: false, 
        error: error.message,
        code: error.code || 'UNKNOWN_ERROR'
      };
    }
  }

  // Verify phone number format (Indian numbers)
  static validatePhoneNumber(phoneNumber) {
    if (!phoneNumber) return false;
    // Accepts +91XXXXXXXXXX or XXXXXXXXXX
    const phoneRegex = /^(\+91)?[6-9]\d{9}$/;
    return phoneRegex.test(phoneNumber.replace(/\s/g, ''));
  }

  // Format phone number for Twilio (Indian numbers)
  static formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) return null;
    let formatted = phoneNumber.replace(/\s/g, '');
    // If already starts with +91, return as is
    if (formatted.startsWith('+91')) {
      return formatted;
    }
    // If 10 digits, add +91
    if (/^[6-9]\d{9}$/.test(formatted)) {
      return '+91' + formatted;
    }
    // Otherwise, return null (invalid)
    return null;
  }

  // Get service status
  static getStatus() {
    return {
      configured: isTwilioConfigured,
      available: this.isAvailable(),
      accountSid: accountSid ? '***' + accountSid.slice(-4) : null,
      phoneNumber: twilioPhoneNumber
    };
  }
}

module.exports = SMSService;