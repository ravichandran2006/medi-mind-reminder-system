# MediMate Backend API

A comprehensive backend API for the MediMate medication reminder system with SMS notifications powered by Twilio.

## Features

- 🔐 **Authentication**: JWT-based user authentication
- 💊 **Medication Management**: CRUD operations for medications
- 📱 **SMS Notifications**: Automated medication reminders via Twilio
- ⏰ **Scheduled Reminders**: Cron-based notification scheduling
- 📊 **Health Data Tracking**: Store and retrieve health information
- 🔒 **Security**: Input validation, password hashing, and token-based access

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Twilio account (for SMS functionality)

## Installation

1. **Clone the repository and navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables (Interactive Setup):**
   ```bash
   npm run setup
   ```
   
   This will guide you through setting up your environment variables interactively.
   
   **Alternative (Manual Setup):**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   PORT=5000
   JWT_SECRET=your-super-secret-jwt-key
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=+1234567890
   ```

4. **Start the server:**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

5. **Test the API:**
   ```bash
   npm test
   ```

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/login` - User login
- `GET /api/user/profile` - Get user profile

### Medications

- `GET /api/medications` - Get user's medications
- `POST /api/medications` - Add new medication
- `PUT /api/medications/:id` - Update medication
- `DELETE /api/medications/:id` - Delete medication

### Health Data

- `GET /api/health-data` - Get user's health data
- `POST /api/health-data` - Add health data entry

### SMS Notifications

- `POST /api/sms/test` - Send test SMS
- `POST /api/sms/medication-reminder` - Send immediate medication reminder
- `POST /api/sms/health-log-reminder` - Send health log reminder
- `POST /api/sms/schedule-medication` - Schedule medication reminder
- `PUT /api/sms/update-medication` - Update scheduled reminder
- `DELETE /api/sms/remove-medication/:medicationId` - Remove scheduled reminder
- `GET /api/sms/scheduled-jobs` - Get all scheduled jobs
- `POST /api/sms/validate-phone` - Validate phone number format
- `PUT /api/sms/update-phone` - Update user's phone number

### Health Check

- `GET /api/health` - API health status

## Request Examples

### User Registration
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "password": "password123"
  }'
```

### Add Medication
```bash
curl -X POST http://localhost:5000/api/medications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Aspirin",
    "dosage": "100mg",
    "frequency": "daily",
    "times": ["09:00", "21:00"],
    "days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
    "startDate": "2024-01-01",
    "reminders": true
  }'
```

### Send Test SMS
```bash
curl -X POST http://localhost:5000/api/sms/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "phoneNumber": "+1234567890",
    "message": "Test message"
  }'
```

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port | No | 5000 |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `TWILIO_ACCOUNT_SID` | Twilio account SID | Yes | - |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | Yes | - |
| `TWILIO_PHONE_NUMBER` | Twilio phone number | Yes | - |
| `NODE_ENV` | Environment mode | No | development |

## Data Storage

Currently, the application uses in-memory storage for development purposes. In production, you should:

1. Replace the simple models with proper database models
2. Use a database like MongoDB, PostgreSQL, or MySQL
3. Implement proper data persistence
4. Add database connection pooling and optimization

## Security Considerations

- Change the default JWT secret in production
- Use HTTPS in production
- Implement rate limiting
- Add input sanitization
- Use environment variables for sensitive data
- Implement proper error handling

## Development

### Project Structure
```
backend/
├── middleware/
│   └── auth.js              # JWT authentication middleware
├── models/
│   ├── User.js              # User model
│   └── Medication.js        # Medication model
├── routes/
│   └── sms.js               # SMS notification routes
├── notificationScheduler.js # Cron job scheduler
├── smsService.js            # Twilio SMS service
├── server.js                # Main server file
├── package.json             # Dependencies
└── README.md               # This file
```

### Adding New Features

1. Create new route files in `routes/` directory
2. Add new models in `models/` directory if needed
3. Update the main server file to include new routes
4. Add proper validation and error handling
5. Update this README with new endpoints

## Troubleshooting

### Common Issues

1. **SMS not sending**: Check Twilio credentials and phone number format
2. **Authentication errors**: Verify JWT token and secret
3. **Port already in use**: Change PORT in .env file
4. **Missing dependencies**: Run `npm install`

### Logs

The application logs important events to the console:
- Server startup
- SMS sending attempts
- Authentication events
- Error messages

## License

MIT License - see LICENSE file for details. 