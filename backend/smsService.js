const twilio = require('twilio');

// Helper to sanitize Twilio phone numbers (removes hidden RTL chars, spaces, etc.)
function normalizeTwilioNumber(number) {
  if (!number) return null;
  // Remove zero-width and direction formatting characters
  const withoutInvisible = number.replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, '');
  // Remove spaces, hyphens, parentheses and other non-digit/plus chars
  let normalized = withoutInvisible.replace(/[^\d+]/g, '');
  // Ensure the number starts with +
  if (!normalized.startsWith('+') && /^\d+$/.test(normalized)) {
    normalized = `+${normalized}`;
  }
  return /^\+\d+$/.test(normalized) ? normalized : null;
}

// Twilio configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumberRaw = process.env.TWILIO_PHONE_NUMBER;
const twilioPhoneNumber = normalizeTwilioNumber(twilioPhoneNumberRaw);
const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

// Check if Twilio credentials are available
const isTwilioConfigured = accountSid && authToken && (twilioPhoneNumber || messagingServiceSid);

let client = null;
if (isTwilioConfigured) {
  try {
    client = twilio(accountSid, authToken);
    if (twilioPhoneNumberRaw && twilioPhoneNumberRaw !== twilioPhoneNumber) {
      console.warn('⚠️ Twilio phone number contained extra characters. Using sanitized value:', twilioPhoneNumber);
    }
    console.log('✅ Twilio client initialized successfully');
    if (twilioPhoneNumber) {
      console.log(`📱 Twilio phone number: ${twilioPhoneNumber}`);
    }
    if (messagingServiceSid) {
      console.log(`🛠️ Using Messaging Service SID: ${messagingServiceSid}`);
    }
  } catch (error) {
    console.error('❌ Failed to initialize Twilio client:', error.message);
  }
} else {
  console.log('⚠️ Twilio credentials not fully configured:');
  console.log(`   Account SID: ${accountSid ? 'Set' : 'Missing'}`);
  console.log(`   Auth Token: ${authToken ? 'Set' : 'Missing'}`);
  console.log(`   Phone Number: ${twilioPhoneNumber ? 'Set' : 'Missing'}`);
  console.log(`   Messaging Service SID: ${messagingServiceSid ? 'Set' : 'Missing'}`);
}

class SMSService {
  // Check if SMS service is available
  static isAvailable() {
    return isTwilioConfigured && client !== null;
  }

  // Send medication reminder SMS with personalized advice and confirmation options
  static async sendMedicationReminder(userPhone, userName, medicationName, time, dosage = '', instructions = '', medicationId = '') {
    try {
      if (!userPhone) {
        console.error('❌ Error sending medication reminder: Phone number is required');
        return { success: false, error: 'Phone number is required', code: 'MISSING_PHONE' };
      }

      if (!medicationName) {
        console.error('❌ Error sending medication reminder: Medication name is required');
        return { success: false, error: 'Medication name is required', code: 'MISSING_MEDICATION_NAME' };
      }

      console.log(`📱 Attempting to send SMS reminder:`);
      console.log(`   To: ${userPhone}`);
      console.log(`   User: ${userName}`);
      console.log(`   Medication: ${medicationName}`);
      console.log(`   Time: ${time}`);
      console.log(`   Dosage: ${dosage}`);
      console.log(`   Instructions: ${instructions}`);
      
      // Check if Twilio is configured
      if (!this.isAvailable()) {
        console.log(`📱 [DEV MODE] SMS would be sent to ${userPhone}: It's time to take ${medicationName} at ${time}`);
        return { 
          success: true, 
          messageId: 'dev-mode-' + Date.now(),
          devMode: true,
          code: 'DEV_MODE'
        };
      }

      // Validate phone number before sending
      const formattedPhone = this.formatPhoneNumber(userPhone);
      if (!formattedPhone) {
        return { success: false, error: 'Invalid phone number format', code: 'INVALID_PHONE' };
      }

      // Create personalized message with dosage and instructions if available
      let message = `Hi ${userName}, it's time to take your ${medicationName}`;
      if (dosage) {
        message += ` (${dosage})`;
      }
      message += ` at ${time}.`;
      
      // Add instructions if available
      if (instructions) {
        message += ` ${instructions}.`;
      }
      
      // Add health advice
      message += ` Take your medicine and be healthy!`;
      
      // Add confirmation options
      message += ` Once you've taken it, please reply with 'TAKEN' or 'MISSED' to track your medication adherence.`;
      
      // Add snooze option
      message += ` Reply 'SNOOZE' to be reminded again in 15 minutes.`;
      
    console.log(`📱 Sending SMS via Twilio:`);
    if (twilioPhoneNumber) {
      console.log(`   From: ${twilioPhoneNumber}`);
    } else if (messagingServiceSid) {
      console.log(`   Messaging Service SID: ${messagingServiceSid}`);
    }
      console.log(`   To: ${formattedPhone}`);
      console.log(`   Message: ${message}`);
      
    const payload = {
        body: message,
        to: formattedPhone
    };
    if (twilioPhoneNumber) {
      payload.from = twilioPhoneNumber;
    } else if (messagingServiceSid) {
      payload.messagingServiceSid = messagingServiceSid;
    }

    const result = await client.messages.create(payload);

      console.log(`✅ SMS sent successfully to ${formattedPhone}: ${result.sid}`);
      return { success: true, messageId: result.sid, code: 'SUCCESS' };
    } catch (error) {
      console.error('❌ Error sending SMS:', error.message);
      console.error('❌ Error details:', error);
      
      // Categorize Twilio errors for better handling
      let errorCode = 'UNKNOWN_ERROR';
      if (error.code === 21211) {
        errorCode = 'INVALID_PHONE';
  } else if (error.code === 21608) {
        errorCode = 'UNVERIFIED_PHONE';
      } else if (error.code === 21610) {
        errorCode = 'MESSAGE_QUEUE_FULL';
      } else if (error.code === 20003) {
        errorCode = 'AUTHENTICATION_ERROR';
  } else if (error.code === 20404) {
        errorCode = 'RESOURCE_NOT_FOUND';
  } else if (error.code === 21212) {
    errorCode = 'INVALID_FROM_NUMBER';
  } else if (error.code === 21659) {
    errorCode = 'COUNTRY_SHORTCODE_MISMATCH';
      }
      
      return { 
        success: false, 
        error: error.message,
        code: errorCode,
        twilioCode: error.code
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

  // Send health log reminder SMS
  static async sendHealthLogReminder(userPhone, userName) {
    try {
      if (!userPhone) {
        console.error('❌ Error sending health log reminder: Phone number is required');
        return { success: false, error: 'Phone number is required', code: 'MISSING_PHONE' };
      }

      console.log(`📱 Attempting to send health log reminder SMS:`);
      console.log(`   To: ${userPhone}`);
      console.log(`   User: ${userName}`);
      
      // Check if Twilio is configured
      if (!this.isAvailable()) {
        console.log(`📱 [DEV MODE] Health log reminder would be sent to ${userPhone}`);
        return { 
          success: true, 
          messageId: 'dev-mode-' + Date.now(),
          devMode: true,
          code: 'DEV_MODE' 
        };
      }

      // Validate phone number before sending
      const formattedPhone = this.formatPhoneNumber(userPhone);
      if (!formattedPhone) {
        return { success: false, error: 'Invalid phone number format', code: 'INVALID_PHONE' };
      }

      const message = `Hi ${userName}, this is your Medi-Mind reminder: Don't forget to log your health data today! Track your progress for better health.`;
      
      console.log(`📱 Sending health log reminder SMS via Twilio:`);
      console.log(`   From: ${twilioPhoneNumber}`);
      console.log(`   To: ${formattedPhone}`);
      console.log(`   Message: ${message}`);
      
      const result = await client.messages.create({
        body: message,
        from: twilioPhoneNumber,
        to: formattedPhone
      });

      console.log(`✅ Health log reminder SMS sent successfully to ${formattedPhone}: ${result.sid}`);
      return { success: true, messageId: result.sid, code: 'SUCCESS' };
    } catch (error) {
      console.error('❌ Error sending health log reminder SMS:', error.message);
      console.error('❌ Error details:', error);
      
      // Categorize Twilio errors for better handling
      let errorCode = 'UNKNOWN_ERROR';
      if (error.code === 21211) {
        errorCode = 'INVALID_PHONE';
      } else if (error.code === 21608) {
        errorCode = 'UNVERIFIED_PHONE';
      } else if (error.code === 21610) {
        errorCode = 'MESSAGE_QUEUE_FULL';
      } else if (error.code === 20003) {
        errorCode = 'AUTHENTICATION_ERROR';
      } else if (error.code === 20404) {
        errorCode = 'RESOURCE_NOT_FOUND';
      }
      
      return { 
        success: false, 
        error: error.message,
        code: errorCode,
        twilioCode: error.code
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

  // Verify phone number format (supports both US and Indian numbers)
  static validatePhoneNumber(phoneNumber) {
    if (!phoneNumber) return false;
    // Remove any spaces or special characters
    const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // Check for US format: +1XXXXXXXXXX or XXXXXXXXXX (10 digits)
    const usRegex = /^(\+?1)?[2-9]\d{9}$/;
    
    // Check for Indian format: +91XXXXXXXXXX or XXXXXXXXXX
    const indiaRegex = /^(\+91)?[6-9]\d{9}$/;
    
    return usRegex.test(cleaned) || indiaRegex.test(cleaned);
  }

  // Format phone number for Twilio (supports both US and Indian numbers)
  static formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) return null;
    let formatted = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // US number format
    if (formatted.startsWith('+1')) {
      return formatted; // Already in international format
    }
    
    // If 10 digits US number
    if (/^[2-9]\d{9}$/.test(formatted)) {
      return '+1' + formatted;
    }
    
    // Indian number format
    if (formatted.startsWith('+91')) {
      return formatted; // Already in international format
    }
    
    // If 10 digits Indian number
    if (/^[6-9]\d{9}$/.test(formatted)) {
      return '+91' + formatted;
    }
    
    // Otherwise, return as is (let Twilio handle the validation)
    return formatted.startsWith('+') ? formatted : '+' + formatted;
  }

  // Get service status
  static getStatus() {
    return {
      configured: isTwilioConfigured,
      available: this.isAvailable(),
      accountSid: accountSid ? '***' + accountSid.slice(-4) : null,
      phoneNumber: twilioPhoneNumber,
      messagingServiceSid
    };
  }
}

module.exports = SMSService;