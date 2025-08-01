# MediMate Backend API

This is the backend server for the MediMate health management system.

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file in the backend directory with:
   ```
   PORT=5000
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   NODE_ENV=development
   ```

3. **Start the Server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - User login
- `GET /api/user/profile` - Get user profile (protected)

### Medications
- `GET /api/medications` - Get user medications (protected)
- `POST /api/medications` - Add new medication (protected)
- `PUT /api/medications/:id` - Update medication (protected)
- `DELETE /api/medications/:id` - Delete medication (protected)

### Health Data
- `GET /api/health-data` - Get user health data (protected)
- `POST /api/health-data` - Add new health data (protected)

### Health Check
- `GET /api/health` - Server health check

## Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation
- CORS enabled
- Error handling
- In-memory storage (can be replaced with database)

## Security Notes

- Change the JWT_SECRET in production
- Add rate limiting for production
- Use HTTPS in production
- Replace in-memory storage with a proper database 