import os
import cv2
import numpy as np
from paddleocr import PaddleOCR
import re

class OCRService:
    def __init__(self):
        # Initialize PaddleOCR with English language
        self.ocr = PaddleOCR(use_angle_cls=True, lang='en')
    
    def process_image(self, image_path):
        """Process the prescription image and extract health data"""
        try:
            # Read the image
            img = cv2.imread(image_path)
            if img is None:
                return {"error": "Failed to read image"}
            
            # Run OCR on the image
            result = self.ocr.ocr(img, cls=True)
            
            if not result or len(result) == 0:
                return {"error": "No text detected in image"}
            
            # Extract text from OCR result
            extracted_text = ""
            for line in result[0]:
                extracted_text += line[1][0] + "\n"
            
            # Extract health metrics using regex patterns
            health_data = self._extract_health_metrics(extracted_text)
            
            return health_data
            
        except Exception as e:
            return {"error": str(e)}
    
    def _extract_health_metrics(self, text):
        """Extract health metrics from the OCR text using regex patterns"""
        health_data = {
            "weight": "",
            "heartRate": "",
            "systolic": "",
            "diastolic": "",
            "temperature": ""
        }
        
        # Weight pattern (e.g., "Weight: 70.5 kg" or "70.5 kg")
        weight_pattern = r"(?:weight|wt)[:\s]*(\d+\.?\d*)\s*(?:kg|pounds|lbs)"
        weight_match = re.search(weight_pattern, text.lower())
        if weight_match:
            health_data["weight"] = weight_match.group(1)
        
        # Heart rate pattern (e.g., "Heart Rate: 72 bpm" or "Pulse: 72")
        hr_pattern = r"(?:heart rate|pulse|hr)[:\s]*(\d+)\s*(?:bpm)?"
        hr_match = re.search(hr_pattern, text.lower())
        if hr_match:
            health_data["heartRate"] = hr_match.group(1)
        
        # Blood pressure pattern (e.g., "BP: 120/80" or "Blood Pressure: 120/80 mmHg")
        bp_pattern = r"(?:blood pressure|bp)[:\s]*(\d+)\s*[/]\s*(\d+)"
        bp_match = re.search(bp_pattern, text.lower())
        if bp_match:
            health_data["systolic"] = bp_match.group(1)
            health_data["diastolic"] = bp_match.group(2)
        
        # Temperature pattern (e.g., "Temp: 98.6 F" or "Temperature: 37.0 C")
        temp_pattern = r"(?:temperature|temp)[:\s]*(\d+\.?\d*)\s*(?:°?[fc]|degrees)"
        temp_match = re.search(temp_pattern, text.lower())
        if temp_match:
            temp = float(temp_match.group(1))
            # Convert Celsius to Fahrenheit if needed
            if "c" in text.lower()[-10:] and temp < 50:  # Assuming it's Celsius if < 50
                temp = (temp * 9/5) + 32
            health_data["temperature"] = str(round(temp, 1))
        
        return health_data

# For command line execution
if __name__ == "__main__":
    import sys
    import json
    
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No image path provided"}))
        sys.exit(1)
        
    image_path = sys.argv[1]
    ocr_service = OCRService()
    result = ocr_service.process_image(image_path)
    
    # Output as JSON for the Node.js server to parse
    print(json.dumps(result))