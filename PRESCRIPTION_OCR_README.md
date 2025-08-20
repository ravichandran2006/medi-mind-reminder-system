# Prescription OCR Feature

## Overview
The Prescription OCR feature allows users to upload a doctor's prescription image, which is then processed using PaddleOCR to extract health metrics data. The extracted data is automatically filled into the health log form for user review and confirmation.

## Features
- Upload prescription images from the Health Log page
- Extract key health metrics using OCR:
  - Weight
  - Heart Rate
  - Blood Pressure (Systolic/Diastolic)
  - Body Temperature
- Review and confirm extracted data before saving
- Secure authentication for image uploads

## Technical Implementation

### Frontend
- Image upload component in HealthLog.jsx
- Form data auto-population with extracted values
- User review and confirmation workflow

### Backend
- Express.js API endpoint for image upload
- Multer middleware for file handling
- PaddleOCR integration for text extraction
- Regex pattern matching for health data extraction

## Dependencies

### Backend
- multer: File upload handling
- PaddleOCR (Python): OCR processing library

### Python Dependencies
```
pip install paddlepaddle paddleocr opencv-python numpy
```

## Setup Instructions

1. Install backend dependencies:
```
cd backend
npm install
```

2. Install Python dependencies:
```
pip install paddlepaddle paddleocr opencv-python numpy
```

3. Create uploads directory:
```
mkdir -p backend/uploads
```

## Usage

1. Navigate to the Health Log page
2. Click on "Upload Prescription" button
3. Select a prescription image file
4. Wait for OCR processing to complete
5. Review the extracted data in the form
6. Make any necessary corrections
7. Click "Log Health Data" to save

## Troubleshooting

- If OCR fails to extract data, ensure the prescription image is clear and well-lit
- Check that all required Python dependencies are installed
- Verify that the backend server is running and accessible
- Ensure you are logged in (authentication token is required)