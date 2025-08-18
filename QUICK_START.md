# 🚀 Quick Start Guide - MediMate with Tablet Features

Get your MediMate medication management system with tablet physical appearance features up and running in minutes!

## ⚡ Quick Setup (5 minutes)

### 1. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ..
npm install
```

### 2. Setup Environment

```bash
# Copy environment file
cd backend
cp env.example .env

# Edit .env file with your MongoDB connection
# For local MongoDB:
MONGODB_URI=mongodb://localhost:27017/medimate

# For MongoDB Atlas (cloud):
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/medimate
```

### 3. Setup Database

```bash
# Run the interactive database setup
node setup-database.js

# This will:
# ✅ Create database and collections
# ✅ Set up indexes for performance
# ✅ Create sample data (optional)
# ✅ Verify everything is working
```

### 4. Start the Application

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd ..
npm run dev
```

### 5. Test Tablet Features

1. Open your browser to the frontend URL
2. Navigate to "Medication Scheduler"
3. Click "Add Medication"
4. Fill in the "Tablet Physical Appearance" section
5. Save and verify in MongoDB Compass

## 🎯 What You Get

### Tablet Physical Appearance Features
- **Shape**: Round, oval, square, triangle, diamond, hexagon
- **Color**: Customizable color descriptions
- **Size**: Small, medium, large
- **Texture**: Smooth, coated, scored, imprinted
- **Markings**: Letters, numbers, symbols on tablets

### Database Features
- MongoDB with optimized indexes
- Physical characteristic search
- Sample data for testing
- Full CRUD operations

### Frontend Features
- Responsive medication form
- Visual tablet identification
- Search and filtering
- Mobile-friendly interface

## 🔧 Troubleshooting

### Common Issues

#### MongoDB Connection Failed
```bash
# Check if MongoDB is running
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod

# Check connection string in .env
```

#### Port Already in Use
```bash
# Change port in .env
PORT=5001

# Or kill existing process
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5000 | xargs kill -9
```

#### Dependencies Issues
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📱 Test the Features

### 1. Add Sample Medication

```javascript
// Example medication data
{
  name: "Vitamin D3",
  dosage: "1000 IU",
  frequency: "once",
  times: ["09:00"],
  startDate: "2024-01-01",
  
  // Tablet Physical Appearance
  tabletShape: "round",
  tabletColor: "White",
  tabletSize: "small",
  tabletTexture: "smooth",
  tabletMarkings: "D3",
  
  form: "tablet",
  manufacturer: "HealthVit",
  instructions: "Take with breakfast"
}
```

### 2. Test Search

```bash
# Search by physical characteristics
GET /api/medications/search/physical?shape=round&color=white

# Search by size
GET /api/medications/search/physical?size=small

# Search by form
GET /api/medications/search/physical?form=tablet
```

### 3. Verify in MongoDB Compass

1. Open MongoDB Compass
2. Connect to your database
3. Navigate to `medimate` database
4. Check `medications` collection
5. Verify tablet appearance fields

## 🎨 Customization

### Add New Tablet Shapes

```javascript
// In backend/models/Medication.js
tabletShape: {
  type: String,
  enum: ['round', 'oval', 'square', 'triangle', 'diamond', 'hexagon', 'other', 'custom'],
  required: true
}
```

### Add New Sizes

```javascript
// In backend/models/Medication.js
tabletSize: {
  type: String,
  enum: ['tiny', 'small', 'medium', 'large', 'extra-large'],
  required: true
}
```

## 📊 Database Structure

### Collections
- `users` - User accounts and authentication
- `medications` - Medication data with tablet features
- `otps` - One-time passwords for verification

### Key Indexes
```javascript
// Users
{ email: 1 } // unique
{ phone: 1 } // unique

// Medications
{ userId: 1, createdAt: -1 } // sorting
{ userId: 1, name: 1 } // searching
{ userId: 1, tabletShape: 1, tabletColor: 1, tabletSize: 1 } // physical search
```

## 🚀 Next Steps

After successful setup:

1. **Test All Features**: Add, edit, delete medications
2. **Customize**: Modify tablet appearance options
3. **Integrate**: Connect with your existing systems
4. **Deploy**: Move to production environment
5. **Monitor**: Track database performance

## 📚 Documentation

- [Full MongoDB Setup Guide](./backend/MONGODB_SETUP.md)
- [Tablet Features Documentation](./TABLET_FEATURES_README.md)
- [API Documentation](./backend/README.md)
- [Frontend Components](./src/components/)

## 🆘 Need Help?

1. Check the troubleshooting section above
2. Review the detailed documentation
3. Test with sample data
4. Check console logs for errors
5. Verify MongoDB connection

## 🎯 Success Indicators

✅ MongoDB connection established  
✅ Database and collections created  
✅ Indexes set up successfully  
✅ Sample data created (if selected)  
✅ Backend server running on port 5000  
✅ Frontend accessible in browser  
✅ Medication form loads with tablet fields  
✅ Can add/edit medications with tablet features  
✅ Data appears in MongoDB Compass  

---

**🎉 Congratulations!** You now have a fully functional medication management system with advanced tablet physical appearance tracking features.

