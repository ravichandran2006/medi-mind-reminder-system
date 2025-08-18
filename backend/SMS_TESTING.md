# SMS Reminder Testing Guide

## Overview

This guide explains how to test the SMS reminder functionality in the Medi-Mind Reminder System. The system uses Twilio to send SMS reminders for medications and health logs.

## Testing in Development Mode

The SMS service is designed to work in both production and development modes:

- **Production Mode**: Actual SMS messages are sent via Twilio
- **Development Mode**: SMS messages are simulated (logged but not sent)

## How to Test

1. Ensure your `.env` file has the following Twilio configuration:

```
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+18149924585
```

2. Run the test script:

```bash
node testSms.js
```

3. The test script will:
   - Check the SMS service status
   - Force development mode
   - Simulate sending an SMS to the specified phone number
   - Display the result

## Phone Number Formatting

The SMS service supports both US and Indian phone number formats:

- US format: `+1XXXXXXXXXX` or `XXXXXXXXXX`
- Indian format: `+91XXXXXXXXXX` or `XXXXXXXXXX`

## Important Notes

1. **Twilio Trial Accounts**: If using a Twilio trial account, you can only send SMS to verified phone numbers. You'll need to verify your phone number in the Twilio console.

2. **Production Testing**: To test in production mode (actually sending SMS), you need:
   - A valid Twilio account with credits
   - The recipient's phone number must be verified (for trial accounts)
   - Remove the line that forces development mode in the test script

3. **Error Handling**: The SMS service includes comprehensive error handling for various Twilio error codes.

## Troubleshooting

- **Invalid Phone Number**: Ensure the phone number is in the correct format
- **Authentication Error**: Check your Twilio credentials in the `.env` file
- **Unverified Phone**: For trial accounts, verify the recipient's phone number in the Twilio console

## Integration with Medication Reminders

The SMS service is integrated with the medication reminder system. When a medication reminder is scheduled, the system will automatically send an SMS at the specified time if the user has provided a phone number.