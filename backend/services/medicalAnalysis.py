#!/usr/bin/env python3
"""
Medical Report and Prescription Analysis System
Extracts, analyzes, and verifies information from patient medical reports or prescriptions.
"""

import json
import re
import os
import sys
import requests
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    import pytesseract
    import cv2
    import numpy as np
    from PIL import Image
    import pdfplumber
    import fitz  # PyMuPDF
    
    # Configure Tesseract OCR path for Windows
    tesseract_path = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    if os.path.exists(tesseract_path):
        pytesseract.pytesseract.tesseract_cmd = tesseract_path
        logger.info(f"✅ Tesseract configured at: {tesseract_path}")
    else:
        logger.warning(f"⚠️ Tesseract not found at: {tesseract_path}")
        
except ImportError as e:
    logger.error(f"Missing required packages: {e}")
    logger.info("Please install: pip install pytesseract opencv-python pillow pdfplumber PyMuPDF")
    sys.exit(1)

class MedicalAnalyzer:
    def __init__(self, groq_api_key: str):
        self.groq_api_key = groq_api_key
        self.groq_url = "https://api.groq.com/openai/v1/chat/completions"
        
        # Medical reference ranges
        self.reference_ranges = {
            "blood_sugar_fasting": {"min": 70, "max": 100, "unit": "mg/dL"},
            "blood_sugar_random": {"min": 70, "max": 140, "unit": "mg/dL"},
            "hba1c": {"min": 4.0, "max": 5.6, "unit": "%"},
            "cholesterol_total": {"min": 125, "max": 200, "unit": "mg/dL"},
            "ldl": {"min": 0, "max": 100, "unit": "mg/dL"},
            "hdl_male": {"min": 40, "max": 999, "unit": "mg/dL"},
            "hdl_female": {"min": 50, "max": 999, "unit": "mg/dL"},
            "triglycerides": {"min": 0, "max": 150, "unit": "mg/dL"},
            "blood_pressure_systolic": {"min": 90, "max": 120, "unit": "mmHg"},
            "blood_pressure_diastolic": {"min": 60, "max": 80, "unit": "mmHg"},
            "creatinine_male": {"min": 0.74, "max": 1.35, "unit": "mg/dL"},
            "creatinine_female": {"min": 0.59, "max": 1.04, "unit": "mg/dL"}
        }
        
        # Common drug interactions (simplified)
        self.drug_interactions = {
            "warfarin": ["aspirin", "ibuprofen", "naproxen"],
            "metformin": ["alcohol", "contrast dye"],
            "lisinopril": ["potassium supplements", "spironolactone"],
            "simvastatin": ["erythromycin", "clarithromycin", "gemfibrozil"]
        }

    def extract_text_from_image(self, image_path: str) -> str:
        """Extract text from image using OCR with enhanced preprocessing"""
        try:
            logger.info(f"🖼️ Processing image: {image_path}")
            
            # Load image
            image = cv2.imread(image_path)
            if image is None:
                raise ValueError(f"Could not load image: {image_path}")
            
            # Convert to grayscale
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Apply multiple preprocessing techniques
            processed_images = []
            
            # 1. Original grayscale
            processed_images.append(("original", gray))
            
            # 2. Gaussian blur + threshold
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)
            _, thresh1 = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            processed_images.append(("gaussian_thresh", thresh1))
            
            # 3. Adaptive threshold
            adaptive_thresh = cv2.adaptiveThreshold(
                gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
            )
            processed_images.append(("adaptive_thresh", adaptive_thresh))
            
            # 4. Morphological operations
            kernel = np.ones((2, 2), np.uint8)
            morph = cv2.morphologyEx(gray, cv2.MORPH_CLOSE, kernel)
            _, thresh2 = cv2.threshold(morph, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            processed_images.append(("morphological", thresh2))
            
            # Try OCR on each processed version and combine results
            extracted_texts = []
            
            for name, processed_img in processed_images:
                try:
                    # Configure Tesseract for medical documents
                    custom_config = r'--oem 3 --psm 6 -c tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,():/- '
                    
                    text = pytesseract.image_to_string(
                        processed_img, 
                        config=custom_config,
                        lang='eng'
                    )
                    
                    if text.strip():
                        extracted_texts.append(text.strip())
                        logger.info(f"✅ OCR successful with {name} preprocessing: {len(text)} characters")
                    
                except Exception as ocr_error:
                    logger.warning(f"⚠️ OCR failed with {name}: {ocr_error}")
                    continue
            
            # Combine and deduplicate results
            if extracted_texts:
                # Use the longest text as primary result
                primary_text = max(extracted_texts, key=len)
                logger.info(f"✅ Best OCR result: {len(primary_text)} characters extracted")
                return primary_text
            else:
                logger.warning("⚠️ No text could be extracted from image")
                return "No readable text found in the image. The image may be too blurry, have poor contrast, or contain handwritten text."
                
        except Exception as e:
            logger.error(f"❌ Error extracting text from image: {e}")
            return f"Error processing image: {str(e)}"

    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """Extract text from PDF file using multiple methods"""
        try:
            logger.info(f"📄 Processing PDF: {pdf_path}")
            extracted_text = ""
            
            # Method 1: Try pdfplumber first (better for structured text)
            try:
                with pdfplumber.open(pdf_path) as pdf:
                    text_parts = []
                    for page_num, page in enumerate(pdf.pages, 1):
                        page_text = page.extract_text()
                        if page_text:
                            text_parts.append(f"Page {page_num}:\n{page_text}")
                    
                    if text_parts:
                        extracted_text = "\n\n".join(text_parts)
                        logger.info(f"✅ pdfplumber extracted {len(extracted_text)} characters")
                        
            except Exception as e:
                logger.warning(f"⚠️ pdfplumber failed: {e}")
            
            # Method 2: If pdfplumber didn't work well, try PyMuPDF
            if len(extracted_text) < 100:  # If very little text extracted
                try:
                    doc = fitz.open(pdf_path)
                    text_parts = []
                    
                    for page_num in range(len(doc)):
                        page = doc.load_page(page_num)
                        page_text = page.get_text()
                        
                        if page_text.strip():
                            text_parts.append(f"Page {page_num + 1}:\n{page_text}")
                    
                    doc.close()
                    
                    if text_parts:
                        pymupdf_text = "\n\n".join(text_parts)
                        if len(pymupdf_text) > len(extracted_text):
                            extracted_text = pymupdf_text
                            logger.info(f"✅ PyMuPDF extracted {len(extracted_text)} characters")
                            
                except Exception as e:
                    logger.warning(f"⚠️ PyMuPDF failed: {e}")
            
            # Method 3: If still no good text, try OCR on PDF pages
            if len(extracted_text) < 50:
                try:
                    doc = fitz.open(pdf_path)
                    ocr_text_parts = []
                    
                    for page_num in range(min(3, len(doc))):  # Limit to first 3 pages for OCR
                        page = doc.load_page(page_num)
                        
                        # Convert PDF page to image
                        mat = fitz.Matrix(2.0, 2.0)  # 2x zoom for better OCR
                        pix = page.get_pixmap(matrix=mat)
                        img_data = pix.tobytes("png")
                        
                        # Save temporarily and run OCR
                        temp_img_path = pdf_path.replace('.pdf', f'_temp_page_{page_num}.png')
                        with open(temp_img_path, 'wb') as f:
                            f.write(img_data)
                        
                        # Extract text using our enhanced OCR
                        page_ocr_text = self.extract_text_from_image(temp_img_path)
                        if page_ocr_text and len(page_ocr_text) > 20:
                            ocr_text_parts.append(f"Page {page_num + 1} (OCR):\n{page_ocr_text}")
                        
                        # Clean up temp file
                        try:
                            os.remove(temp_img_path)
                        except:
                            pass
                    
                    doc.close()
                    
                    if ocr_text_parts:
                        ocr_text = "\n\n".join(ocr_text_parts)
                        if len(ocr_text) > len(extracted_text):
                            extracted_text = ocr_text
                            logger.info(f"✅ PDF OCR extracted {len(extracted_text)} characters")
                            
                except Exception as e:
                    logger.warning(f"⚠️ PDF OCR failed: {e}")
            
            if extracted_text.strip():
                logger.info(f"✅ Successfully extracted {len(extracted_text)} characters from PDF")
                return extracted_text.strip()
            else:
                logger.warning("⚠️ No text could be extracted from PDF")
                return "No readable text found in the PDF. The document may be scanned images or contain non-text elements."
                
        except Exception as e:
            logger.error(f"❌ Error extracting text from PDF: {e}")
            return f"Error processing PDF: {str(e)}"

    def analyze_with_groq(self, medical_text: str) -> Dict[str, Any]:
        """Analyze medical text using Groq API"""
        system_prompt = """You are an expert medical AI assistant specialized in analyzing medical prescriptions and reports. You MUST extract ALL available information from the document.

IMPORTANT: Carefully read through the entire document text and extract EVERY piece of patient information, even if it's partially formatted or abbreviated.

### CRITICAL EXTRACTION RULES:
1. **Patient Information** - Look for ANY mention of:
   - Names (Patient, Mr., Mrs., Dr., any capitalized names)
   - Ages (numbers followed by "years", "yrs", "y.o.", or age context)
   - Gender (Male, Female, M, F, Man, Woman, Mr., Mrs.)
   - Dates (any date format: DD/MM/YYYY, MM-DD-YYYY, written dates)
   - Doctor names (Dr., Doctor, Physician, any medical titles)

2. **Dosage Recommendations** - ALWAYS provide specific recommendations:
   - Current dosage analysis (appropriate/needs adjustment)
   - Specific dosage suggestions with rationale
   - Timing recommendations (morning, evening, with food)

### MANDATORY REQUIREMENTS:
- NEVER return "Not available" unless you've thoroughly searched the entire text
- If you find partial information (like "John" or "45 years"), extract it
- ALWAYS provide dosage recommendations based on the medications found
- Extract information even if formatting is poor or abbreviated
- Respond with ONLY valid JSON, no other text

Analyze this document NOW and extract EVERYTHING available:"""
        try:
            headers = {
                'Authorization': f'Bearer {self.groq_api_key}',
                'Content-Type': 'application/json'
            }
            
            data = {
                'model': 'llama-3.3-70b-versatile',
                'messages': [
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user', 'content': f"Analyze this medical report/prescription:\n\n{medical_text}"}
                ],
                'temperature': 0.3,
                'max_tokens': 2000
            }
            
            response = requests.post(self.groq_url, headers=headers, json=data)
            response.raise_for_status()
            
            result = response.json()
            ai_response = result['choices'][0]['message']['content']
            
            # Try to parse JSON response
            try:
                analysis = json.loads(ai_response)
                # Convert new format to legacy format for compatibility
                converted_analysis = self.convert_to_legacy_format(analysis)
                return converted_analysis
            except json.JSONDecodeError:
                # If JSON parsing fails, return structured error
                return {
                    "error": "Failed to parse AI response",
                    "raw_response": ai_response,
                    "prescription_verification_summary": "needs_review"
                }
                
        except Exception as e:
            logger.error(f"Error calling Groq API: {e}")
            return {
                "error": f"API call failed: {str(e)}",
                "prescription_verification_summary": "needs_review"
            }
    
    def convert_to_legacy_format(self, new_format_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Convert the new comprehensive format to the existing database schema format"""
        converted = {
            # Patient details mapping
            "patient_details": {
                "name": new_format_analysis.get("patientInfo", {}).get("name"),
                "age": new_format_analysis.get("patientInfo", {}).get("age"),
                "gender": new_format_analysis.get("patientInfo", {}).get("gender"),
                "weight": None  # Not in new format, keeping null
            },
            
            # Conditions mapping
            "conditions_found": [c.get("name") for c in new_format_analysis.get("conditions", [])],
            
            # Medications mapping
            "medications": [
                {
                    "name": med.get("name"),
                    "dosage": med.get("dosage"),
                    "frequency": med.get("frequency"),
                    "duration": med.get("duration"),
                    "verification_status": "needs_review",  # Default value
                    "age_appropriate": True,
                    "weight_adjusted": False,
                    "safety_rating": "needs_review",
                    "notes": med.get("notes", "")
                }
                for med in new_format_analysis.get("medications", [])
            ],
            
            # Lab values mapping
            "lab_values": [
                {
                    "parameter": lab.get("test"),
                    "value": lab.get("value"),
                    "unit": lab.get("normalRange", "").split(' ')[-1] if lab.get("normalRange") else "",
                    "status": lab.get("status"),
                    "reference_range": lab.get("normalRange"),
                    "risk_level": "high" if lab.get("status") == "Abnormal" else "low",
                    "interpretation": lab.get("interpretation", "")
                }
                for lab in new_format_analysis.get("labValues", [])
            ],
            
            # Risk assessment mapping
            "risk_assessment": {
                "overall_risk_level": new_format_analysis.get("riskAssessment", {}).get("level", "moderate").lower(),
                "cardiovascular_risk": "moderate",  # Default
                "diabetic_risk": "moderate",  # Default
                "medication_adherence_risk": "moderate",  # Default
                "high_risk_factors": new_format_analysis.get("riskAssessment", {}).get("factors", []),
                "moderate_risk_factors": []
            },
            
            # Dosage recommendations (new structure)
            "dosage_recommendations": {
                "current_dosages_appropriate": True,
                "recommended_adjustments": [],
                "new_medications_suggested": [],
                "contraindications": [],
                "monitoring_required": ["Regular follow-up recommended"]
            },
            
            # Lifestyle recommendations mapping
            "lifestyle_recommendations": {
                "diet": [r for r in new_format_analysis.get("recommendations", []) if any(word in r.lower() for word in ['diet', 'food', 'sugar', 'eat'])],
                "exercise": [r for r in new_format_analysis.get("recommendations", []) if any(word in r.lower() for word in ['exercise', 'activity', 'walk'])],
                "sleep": ["Maintain 7-8 hours of sleep", "Regular sleep schedule"],
                "stress_management": ["Practice relaxation techniques"],
                "monitoring": ["Monitor vital signs regularly"]
            },
            
            # Drug interactions (new structure)
            "drug_interactions": {
                "major_interactions": [],
                "moderate_interactions": [],
                "food_interactions": [],
                "supplement_interactions": []
            },
            
            # Recommendations mapping
            "recommendations": {
                "immediate_actions": ["Schedule appointment with healthcare provider"],
                "follow_up_required": ["Regular medical follow-up recommended"],
                "lifestyle_changes": new_format_analysis.get("recommendations", []),
                "red_flags": [],
                "next_appointment": "Within 2-4 weeks"
            },
            
            # Summary fields
            "prescription_verification_summary": "needs_review",
            "overall_assessment": new_format_analysis.get("overallAssessment", "Medical document analyzed successfully."),
            "confidence_score": 85,
            
            # New visualization data
            "visualizations": new_format_analysis.get("visualizations", {
                "riskGauge": new_format_analysis.get("riskAssessment", {}).get("score", 50),
                "summary": {
                    "conditions": len(new_format_analysis.get("conditions", [])),
                    "medications": len(new_format_analysis.get("medications", [])),
                    "labValues": len(new_format_analysis.get("labValues", [])),
                    "recommendations": len(new_format_analysis.get("recommendations", []))
                }
            })
        }
        
        # Ensure diet and exercise have fallback values if empty
        if not converted["lifestyle_recommendations"]["diet"]:
            converted["lifestyle_recommendations"]["diet"] = ["Maintain balanced diet"]
        if not converted["lifestyle_recommendations"]["exercise"]:
            converted["lifestyle_recommendations"]["exercise"] = ["Regular physical activity"]
        
        return converted

    def verify_lab_values(self, lab_values: List[Dict], gender: str = None) -> List[Dict]:
        """Verify lab values against reference ranges"""
        verified_labs = []
        
        for lab in lab_values:
            parameter = lab.get('parameter', '').lower()
            value = lab.get('value')
            unit = lab.get('unit', '')
            
            if not value or not isinstance(value, (int, float, str)):
                continue
                
            try:
                numeric_value = float(str(value).replace(',', ''))
            except (ValueError, TypeError):
                continue
            
            # Find matching reference range
            ref_key = None
            for key in self.reference_ranges:
                if any(keyword in parameter for keyword in key.split('_')):
                    ref_key = key
                    break
            
            if ref_key:
                ref_range = self.reference_ranges[ref_key]
                
                # Handle gender-specific ranges
                if 'male' in ref_key and gender and gender.lower() == 'female':
                    ref_key = ref_key.replace('male', 'female')
                    if ref_key in self.reference_ranges:
                        ref_range = self.reference_ranges[ref_key]
                
                # Determine status
                if numeric_value < ref_range['min']:
                    status = 'low'
                elif numeric_value > ref_range['max']:
                    status = 'high'
                else:
                    status = 'normal'
                
                lab['status'] = status
                lab['reference_range'] = f"{ref_range['min']}-{ref_range['max']} {ref_range['unit']}"
            
            verified_labs.append(lab)
        
        return verified_labs

    def check_drug_interactions(self, medications: List[Dict]) -> List[str]:
        """Check for potential drug interactions"""
        interactions = []
        med_names = [med.get('name', '').lower() for med in medications]
        
        for med in med_names:
            if med in self.drug_interactions:
                for interaction_med in self.drug_interactions[med]:
                    if interaction_med in med_names:
                        interactions.append(f"Potential interaction: {med} and {interaction_med}")
        
        return interactions

    def analyze_medical_document(self, file_path: str) -> Dict[str, Any]:
        """Main function to analyze medical document"""
        try:
            # Extract text based on file type
            file_ext = os.path.splitext(file_path)[1].lower()
            
            if file_ext in ['.jpg', '.jpeg', '.png', '.bmp', '.tiff']:
                extracted_text = self.extract_text_from_image(file_path)
            elif file_ext == '.pdf':
                extracted_text = self.extract_text_from_pdf(file_path)
            else:
                return {"error": "Unsupported file format. Please upload PDF, JPG, PNG, or other image files."}
            
            if not extracted_text:
                return {"error": "Could not extract text from the document. Please ensure the image is clear and text is readable."}
            
            # Analyze with AI
            analysis = self.analyze_with_groq(extracted_text)
            
            # Post-process analysis
            if 'lab_values' in analysis and analysis['lab_values']:
                gender = analysis.get('patient_details', {}).get('gender')
                analysis['lab_values'] = self.verify_lab_values(analysis['lab_values'], gender)
            
            # Check drug interactions
            if 'medications' in analysis and analysis['medications']:
                interactions = self.check_drug_interactions(analysis['medications'])
                if interactions:
                    if 'recommendations' not in analysis:
                        analysis['recommendations'] = {}
                    if 'red_flags' not in analysis['recommendations']:
                        analysis['recommendations']['red_flags'] = []
                    analysis['recommendations']['red_flags'].extend(interactions)
            
            # Add metadata
            analysis['analysis_timestamp'] = datetime.now().isoformat()
            analysis['extracted_text'] = extracted_text[:500] + "..." if len(extracted_text) > 500 else extracted_text
            
            return analysis
            
        except Exception as e:
            logger.error(f"Error analyzing medical document: {e}")
            return {
                "error": f"Analysis failed: {str(e)}",
                "prescription_verification_summary": "needs_review"
            }

def main():
    """CLI interface for testing"""
    if len(sys.argv) != 3:
        print("Usage: python medicalAnalysis.py <file_path> <groq_api_key>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    groq_api_key = sys.argv[2]
    
    if not os.path.exists(file_path):
        print(f"Error: File {file_path} not found")
        sys.exit(1)
    
    analyzer = MedicalAnalyzer(groq_api_key)
    result = analyzer.analyze_medical_document(file_path)
    
    print(json.dumps(result, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()