# SMS Notification System with Voice Alerts

## Overview

The Medi-Mind Reminder System includes an enhanced SMS notification system that sends personalized medication reminders to users. The system includes:

1. **Enhanced SMS Content** - Detailed medication information including name, dosage, and instructions
2. **Interactive SMS Responses** - Users can reply with TAKEN, MISSED, or SNOOZE
3. **Voice Alert System** - Browser-based voice notifications that read out medication details
4. **Snooze Functionality** - Ability to delay reminders for 15 minutes via SMS or 5 minutes via browser

## SMS Notification Features

### Enhanced Content

SMS notifications now include:
- Medication name
- Dosage information
- Time to take medication
- Special instructions (if provided)
- Health advice
- Response options (TAKEN, MISSED, SNOOZE)

### Interactive Responses

Users can reply to SMS notifications with:

- **TAKEN** - Confirms medication was taken, records adherence
- **MISSED** - Records that medication was missed
- **SNOOZE** - Delays the reminder for 15 minutes

## Voice Alert System

The browser-based voice alert system uses the Web Speech API to provide audible medication reminders with:

- Medication name announcement
- Dosage information
- Special instructions
- Response guidance

Voice alerts are triggered:
- When a scheduled medication reminder appears
- When a snoozed reminder reappears

## Implementation Details

### Backend Components

1. **SMS Service** (`smsService.js`)
   - Enhanced `sendMedicationReminder` function with additional parameters
   - Formats SMS messages with medication details and response options

2. **SMS Webhook** (`routes/sms.js`)
   - Processes incoming SMS responses (TAKEN, MISSED, SNOOZE)
   - Handles snooze functionality by scheduling follow-up reminders
   - Provides confirmation responses to users

3. **Notification Scheduler** (`notificationScheduler.js`)
   - Schedules medication reminders based on user preferences
   - Passes medication details to SMS service

### Frontend Components

1. **Reminder System** (`ReminderSystem.jsx`)
   - Implements browser notifications
   - Provides voice alerts using Web Speech API
   - Handles snooze functionality in the browser

## Testing the System

### Testing SMS Notifications

1. Create a medication with reminders enabled
2. Ensure your phone number is correctly set in your profile
3. Use the Test SMS feature in Notification Settings
4. Reply to the SMS with TAKEN, MISSED, or SNOOZE to test response handling

### Testing Voice Alerts

1. Create a medication with a reminder time set to the current time
2. When the reminder appears, the voice alert should automatically play
3. Test the snooze functionality to verify the voice alert plays again

## Troubleshooting

### SMS Issues

- Ensure your phone number is correctly formatted in your profile
- Check that Twilio credentials are properly configured
- Verify that SMS notifications are enabled in your settings

### Voice Alert Issues

- Ensure your browser supports the Web Speech API (most modern browsers do)
- Check that your device's volume is turned up
- Allow browser notifications when prompted

## Future Enhancements

- Medication adherence tracking and reporting
- Customizable voice and SMS reminder messages
- Multiple reminder times before marking as missed
- Integration with healthcare provider systems