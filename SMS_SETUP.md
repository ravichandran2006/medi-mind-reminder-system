# SMS Notification Setup Guide

This guide will help you set up SMS notifications for the MediMate health management system using Twilio.

## Prerequisites

1. A Twilio account (sign up at https://www.twilio.com/)
2. Node.js installed on your system
3. The MediMate application running

## Step 1: Get Twilio Credentials

1. Log in to your Twilio Console: https://console.twilio.com/
2. Find your Account SID and Auth Token on the dashboard
3. Get a Twilio phone number (or use your trial number)

## Step 2: Set Up Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Secret (change this in production)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890

# Database Configuration (if using MongoDB)
MONGODB_URI=mongodb://localhost:27017/medimate

# Optional: Timezone for notifications (default: America/New_York)
NOTIFICATION_TIMEZONE=America/New_York
```

## Step 3: Install Backend Dependencies

```bash
cd backend
npm install
```

## Step 4: Start the Backend Server

```bash
cd backend
npm run dev
```

The server will start on port 5000 and initialize the notification scheduler.

## Step 5: Test SMS Functionality

1. Start the frontend application
2. Sign up with a valid phone number
3. Go to the Notification Settings page
4. Use the "Test SMS" feature to verify everything is working

## Features

### Automatic Notifications

- **Medication Reminders**: Sent at scheduled times for each medication
- **Health Log Reminders**: Daily reminders at 9:00 AM to log health data
- **Appointment Reminders**: Sent before scheduled appointments

### Manual Notifications

- **Test SMS**: Send test messages to verify setup
- **Immediate Reminders**: Send medication reminders immediately
- **Health Log Reminders**: Send health log reminders on demand

### Message Examples

**Medication Reminder:**
```
Hi John, this is your Medi-Mind reminder: Take your blood pressure medication at 8:00 AM. Stay healthy!
```

**Health Log Reminder:**
```
Hi John, this is your Medi-Mind reminder: Don't forget to log your health data today! Track your progress for better health.
```

**Appointment Reminder:**
```
Hi John, this is your Medi-Mind reminder: You have an appointment scheduled for tomorrow at 2:00 PM. Don't forget to prepare!
```

## Configuration Options

### Timezone
Set the `NOTIFICATION_TIMEZONE` environment variable to your local timezone:
- `America/New_York`
- `America/Los_Angeles`
- `Europe/London`
- `Asia/Tokyo`

### Notification Times
- Health log reminders: Daily at 9:00 AM
- Medication reminders: Based on medication schedule
- Appointment reminders: 24 hours before appointment

## Troubleshooting

### Common Issues

1. **"Invalid phone number" error**
   - Ensure phone numbers include country code (+1 for US)
   - Verify the number is in E.164 format

2. **"Authentication failed" error**
   - Check your Twilio Account SID and Auth Token
   - Ensure your Twilio account is active

3. **"SMS not sending"**
   - Verify your Twilio phone number is correct
   - Check if you're in trial mode (limited to verified numbers)
   - Ensure your account has sufficient credits

4. **"Notifications not scheduled"**
   - Check server logs for initialization errors
   - Verify the notification scheduler started successfully
   - Ensure medications have reminders enabled

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
DEBUG=medimate:*
```

## Security Notes

1. **Never commit your `.env` file** to version control
2. **Use strong JWT secrets** in production
3. **Validate phone numbers** before sending SMS
4. **Rate limit SMS sending** to prevent abuse
5. **Monitor SMS usage** to control costs

## Production Deployment

1. Use a production Twilio account
2. Set up proper environment variables
3. Use a production database
4. Enable HTTPS
5. Set up monitoring and logging
6. Configure backup and recovery

## Support

For issues with:
- **Twilio**: Contact Twilio Support
- **Application**: Check the application logs
- **Setup**: Refer to this guide

## Cost Considerations

- Twilio charges per SMS sent
- Trial accounts have limitations
- Monitor usage to control costs
- Consider SMS bundling for high volume

## API Endpoints

### SMS Endpoints

- `POST /api/sms/test` - Send test SMS
- `POST /api/sms/medication-reminder` - Send medication reminder
- `POST /api/sms/health-log-reminder` - Send health log reminder
- `POST /api/sms/schedule-medication` - Schedule medication reminder
- `PUT /api/sms/update-medication` - Update medication reminder
- `DELETE /api/sms/remove-medication/:id` - Remove medication reminder
- `GET /api/sms/scheduled-jobs` - Get scheduled jobs
- `POST /api/sms/validate-phone` - Validate phone number
- `PUT /api/sms/update-phone` - Update user phone number

All endpoints require authentication via JWT token. 