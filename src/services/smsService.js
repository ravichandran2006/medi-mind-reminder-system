const API_BASE_URL = 'http://localhost:5000/api';

class SMSService {
  // Get auth token from localStorage
  static getAuthToken() {
    return localStorage.getItem('token');
  }

  // Get auth headers
  static getAuthHeaders() {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Test SMS functionality
  static async testSMS(phoneNumber, message) {
    try {
      const response = await fetch(`${API_BASE_URL}/sms/test`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ phoneNumber, message })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send test SMS');
      }

      return data;
    } catch (error) {
      console.error('Test SMS error:', error);
      throw error;
    }
  }

  // Send immediate medication reminder
  static async sendMedicationReminder(medicationId, time = 'now') {
    try {
      const response = await fetch(`${API_BASE_URL}/sms/medication-reminder`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ medicationId, time })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send medication reminder');
      }

      return data;
    } catch (error) {
      console.error('Medication reminder error:', error);
      throw error;
    }
  }

  // Send health log reminder
  static async sendHealthLogReminder() {
    try {
      const response = await fetch(`${API_BASE_URL}/sms/health-log-reminder`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send health log reminder');
      }

      return data;
    } catch (error) {
      console.error('Health log reminder error:', error);
      throw error;
    }
  }

  // Schedule medication reminder
  static async scheduleMedicationReminder(medicationId) {
    try {
      const response = await fetch(`${API_BASE_URL}/sms/schedule-medication`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ medicationId })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to schedule medication reminder');
      }

      return data;
    } catch (error) {
      console.error('Schedule medication error:', error);
      throw error;
    }
  }

  // Update medication reminder
  static async updateMedicationReminder(medicationId) {
    try {
      const response = await fetch(`${API_BASE_URL}/sms/update-medication`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ medicationId })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update medication reminder');
      }

      return data;
    } catch (error) {
      console.error('Update medication error:', error);
      throw error;
    }
  }

  // Remove medication reminder
  static async removeMedicationReminder(medicationId) {
    try {
      const response = await fetch(`${API_BASE_URL}/sms/remove-medication/${medicationId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to remove medication reminder');
      }

      return data;
    } catch (error) {
      console.error('Remove medication error:', error);
      throw error;
    }
  }

  // Get scheduled jobs
  static async getScheduledJobs() {
    try {
      const response = await fetch(`${API_BASE_URL}/sms/scheduled-jobs`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get scheduled jobs');
      }

      return data;
    } catch (error) {
      console.error('Get scheduled jobs error:', error);
      throw error;
    }
  }

  // Validate phone number
  static async validatePhoneNumber(phoneNumber) {
    try {
      const response = await fetch(`${API_BASE_URL}/sms/validate-phone`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ phoneNumber })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to validate phone number');
      }

      return data;
    } catch (error) {
      console.error('Validate phone error:', error);
      throw error;
    }
  }

  // Update user phone number
  static async updatePhoneNumber(phoneNumber) {
    try {
      const response = await fetch(`${API_BASE_URL}/sms/update-phone`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ phoneNumber })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update phone number');
      }

      return data;
    } catch (error) {
      console.error('Update phone error:', error);
      throw error;
    }
  }

  // Format phone number for display
  static formatPhoneNumberForDisplay(phoneNumber) {
    if (!phoneNumber) return '';
    
    // Remove all non-digits
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX for US numbers
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    
    return phoneNumber;
  }

  // Check if phone number is valid format
  static isValidPhoneNumber(phoneNumber) {
    if (!phoneNumber) return false;
    
    // Remove all non-digits
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Check if it's a valid US phone number (10 or 11 digits)
    return cleaned.length === 10 || (cleaned.length === 11 && cleaned.startsWith('1'));
  }
}

export default SMSService; 