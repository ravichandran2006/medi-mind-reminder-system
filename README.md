# MediMate - Health Management System

A comprehensive health and medication management application built with React and Node.js.

## Features

- 🔐 **User Authentication** - Secure login and signup system
- 💊 **Medication Management** - Schedule and track medications
- 📊 **Health Logging** - Record vital signs and health metrics
- 🤖 **AI Health Assistant** - Chat with AI for health guidance
- 💡 **Health Tips** - Personalized wellness recommendations
- 🔔 **Smart Reminders** - Medication and health reminders
- 📱 **Responsive Design** - Works on desktop and mobile devices

## Tech Stack

### Frontend
- React 18 with JSX
- Vite for build tooling
- Tailwind CSS for styling
- Shadcn/ui components
- React Router for navigation
- React Query for data fetching

### Backend
- Node.js with Express
- JWT for authentication
- bcryptjs for password hashing
- CORS enabled
- Input validation with express-validator

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### 1. Clone the Repository
```bash
git clone <repository-url>
cd medi-mind-reminder-system
```

### 2. Setup Backend
```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:
```env
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-in-production
NODE_ENV=development
```

Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### 3. Setup Frontend
```bash
# From the root directory
npm install
npm run dev
```

The frontend will run on `http://localhost:8080`

## Project Structure

```
medi-mind-reminder-system/
├── src/
│   ├── components/          # Reusable UI components
│   ├── pages/              # Page components
│   ├── contexts/           # React contexts
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions
│   └── assets/             # Static assets
├── backend/
│   ├── server.js           # Main server file
│   ├── package.json        # Backend dependencies
│   └── README.md           # Backend documentation
├── public/                 # Public assets
└── package.json            # Frontend dependencies
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

## Usage

### 1. Sign Up
- Navigate to `/signup`
- Fill in your details (name, email, phone, password)
- Create your account

### 2. Sign In
- Navigate to `/login`
- Enter your email and password
- Access your dashboard

### 3. Manage Medications
- Go to the Medications page
- Add new medications with dosage, frequency, and timing
- Set up reminders for medication intake

### 4. Track Health
- Use the Health Log page to record vital signs
- Monitor your health metrics over time
- Export health data as CSV

### 5. Get Health Tips
- Browse personalized health recommendations
- Bookmark important tips
- Filter tips by category

### 6. AI Assistant
- Chat with the AI health assistant
- Get answers to health-related questions
- Use voice input for hands-free interaction

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Protected routes
- CORS configuration
- Secure token storage

## Development

### Frontend Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Backend Development
```bash
cd backend
npm run dev          # Start development server with nodemon
npm start           # Start production server
```

## Deployment

### Frontend
1. Build the project: `npm run build`
2. Deploy the `dist` folder to your hosting service

### Backend
1. Set up environment variables
2. Install dependencies: `npm install`
3. Start the server: `npm start`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.

---

**Note**: This is a demo application. For production use, consider:
- Adding a proper database (MongoDB, PostgreSQL)
- Implementing rate limiting
- Adding HTTPS
- Setting up proper environment variables
- Adding comprehensive error handling
- Implementing data backup strategies
