#!/usr/bin/env python3
"""
PaddleOCR Medical Document Analysis
Advanced OCR for prescription and medical document text extraction
"""

import os
import sys
import json
import argparse
from typing import Dict, List, Any, Optional
import cv2
import numpy as np
from PIL import Image
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def install_paddleocr():
    """Install PaddleOCR if not available"""
    try:
        import paddleocr
        return True
    except ImportError:
        logger.info("Installing PaddleOCR...")
        import subprocess
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "paddleocr"])
            import paddleocr
            return True
        except Exception as e:
            logger.error(f"Failed to install PaddleOCR: {e}")
            return False

class MedicalDocumentAnalyzer:
    """Enhanced medical document analyzer using PaddleOCR"""
    
    def __init__(self):
        self.ocr = None
        self._initialize_ocr()
    
    def _initialize_ocr(self):
        """Initialize PaddleOCR with optimal settings for medical documents"""
        try:
            if not install_paddleocr():
                raise ImportError("PaddleOCR installation failed")
                
            import paddleocr
            
            # Initialize PaddleOCR with English support
            self.ocr = paddleocr.PaddleOCR(
                use_textline_orientation=True,  # Enable text angle classification
                lang='en'                       # English language
            )
            logger.info("✅ PaddleOCR initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize PaddleOCR: {e}")
            self.ocr = None
    
    def preprocess_image(self, image_path: str) -> np.ndarray:
        """Preprocess image for better OCR accuracy"""
        try:
            # Read image
            image = cv2.imread(image_path)
            if image is None:
                # Try with PIL for different formats
                pil_image = Image.open(image_path).convert('RGB')
                image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
            
            # Convert to grayscale
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Apply adaptive thresholding to improve text clarity
            processed = cv2.adaptiveThreshold(
                gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
            )
            
            # Denoise
            denoised = cv2.medianBlur(processed, 3)
            
            return denoised
            
        except Exception as e:
            logger.error(f"Image preprocessing failed: {e}")
            # Return original image if preprocessing fails
            return cv2.imread(image_path)
    
    def extract_text_from_image(self, image_path: str) -> Dict[str, Any]:
        """Extract text from image using PaddleOCR"""
        try:
            if not self.ocr:
                return {"error": "PaddleOCR not initialized", "text": "", "confidence": 0}
            
            logger.info(f"Processing image: {image_path}")
            
            # Preprocess image
            try:
                processed_image = self.preprocess_image(image_path)
                logger.info(f"Image preprocessing successful, shape: {processed_image.shape}")
            except Exception as preprocess_error:
                logger.error(f"Image preprocessing failed: {preprocess_error}")
                # Fallback to original image path
                processed_image = image_path
            
            # Run OCR - try with original image path first
            try:
                logger.info("Attempting OCR with original image path...")
                results = self.ocr.predict(image_path)
                logger.info(f"✅ OCR completed successfully!")
                logger.info(f"Raw OCR results type: {type(results)}")
                logger.info(f"Raw OCR results length: {len(results) if hasattr(results, '__len__') else 'No length'}")
                
                logger.info(f"OCR completed successfully! Found {len(results)} pages to process.")
            except Exception as ocr_error:
                logger.error(f"OCR prediction failed with original path: {ocr_error}")
                # Try with preprocessed image
                try:
                    logger.info("Attempting OCR with preprocessed image...")
                    results = self.ocr.predict(processed_image)
                    logger.info(f"Raw OCR results type: {type(results)}")
                except Exception as ocr_error2:
                    logger.error(f"OCR prediction failed with preprocessed image: {ocr_error2}")
                    return {"error": f"OCR prediction failed: {str(ocr_error2)}", "text": "", "confidence": 0}
            
            # Extract text and confidence scores
            extracted_text = []
            total_confidence = 0
            text_blocks = []
            
            # Debug: Print result structure
            logger.info(f"PaddleOCR result structure: {type(results)}")
            
            # Handle PaddleOCR 3.x result structure
            if results and len(results) > 0:
                logger.info(f"Processing {len(results)} OCR result pages")
                
                # PaddleOCR 3.x returns a list of dictionaries (one per page)
                for page_idx, page_result in enumerate(results):
                    if isinstance(page_result, dict):
                        # Extract text and confidence from rec_texts and rec_scores
                        texts = page_result.get('rec_texts', [])
                        scores = page_result.get('rec_scores', [])
                        polys = page_result.get('rec_polys', [])
                        
                        logger.info(f"Page {page_idx}: Found {len(texts)} text blocks")
                        
                        # Process each detected text block
                        for i, text in enumerate(texts):
                            confidence = scores[i] if i < len(scores) else 0.0
                            bbox = polys[i] if i < len(polys) else []
                            
                            if text and text.strip():  # Only add non-empty text
                                extracted_text.append(text.strip())
                                text_blocks.append({
                                    "text": text.strip(),
                                    "confidence": confidence,
                                    "bbox": bbox.tolist() if hasattr(bbox, 'tolist') else bbox
                                })
                                total_confidence += confidence
            else:
                logger.warning("No OCR results found or empty results")
            
            # Calculate average confidence
            avg_confidence = total_confidence / len(text_blocks) if text_blocks else 0
            
            # Join all text
            full_text = " ".join(extracted_text)
            
            logger.info(f"✅ Text extraction completed. Confidence: {avg_confidence:.2f}")
            
            return {
                "text": full_text,
                "confidence": avg_confidence,
                "text_blocks": text_blocks,
                "total_blocks": len(text_blocks)
            }
            
        except Exception as e:
            logger.error(f"❌ Text extraction failed: {e}")
            return {"error": str(e), "text": "", "confidence": 0}
    
    def analyze_medical_content(self, text: str) -> Dict[str, Any]:
        """Analyze extracted text for medical information"""
        try:
            # Initialize analysis result
            analysis = {
                "medications": [],
                "dosages": [],
                "instructions": [],
                "patient_info": {},
                "doctor_info": {},
                "dates": [],
                "vitals": {},
                "diagnosis": [],
                "tests": []
            }
            
            import re
            
            # Known medication names (common ones that appear in prescriptions)
            known_medications = [
                'expectorant', 'paracetamol', 'acetaminophen', 'ibuprofen', 'aspirin',
                'antibiotic', 'anti-biotic', 'amoxicillin', 'penicillin', 'azithromycin',
                'vitamin c', 'vitamin d', 'vitamin b12', 'calcium', 'iron',
                'metformin', 'insulin', 'losartan', 'amlodipine', 'atorvastatin',
                'omeprazole', 'pantoprazole', 'cetirizine', 'loratadine'
            ]
            
            text_lower = text.lower()
            
            # Extract known medications from the text
            for med_name in known_medications:
                if med_name in text_lower:
                    # Find the context around the medication name
                    pattern = rf'\b{re.escape(med_name)}\b'
                    matches = list(re.finditer(pattern, text_lower, re.IGNORECASE))
                    
                    for match in matches:
                        start = max(0, match.start() - 50)
                        end = min(len(text), match.end() + 100)
                        context = text[start:end].strip()
                        
                        # Extract dosage from context
                        dosage_match = re.search(r'\b(\d+\s*(?:mg|ml|g|tablet|capsule))\b', context, re.IGNORECASE)
                        dosage = dosage_match.group(1) if dosage_match else None
                        
                        # Extract frequency from context
                        freq_patterns = [
                            r'every\s+\d+\s+hours?', r'once\s+(?:a\s+)?day', r'twice\s+(?:a\s+)?day',
                            r'thrice\s+(?:a\s+)?day', r'\d+\s+times?\s+(?:a\s+)?day',
                            r'every\s+\d+\s+hours?', r'morning', r'evening', r'night'
                        ]
                        frequency = None
                        for freq_pattern in freq_patterns:
                            freq_match = re.search(freq_pattern, context, re.IGNORECASE)
                            if freq_match:
                                frequency = freq_match.group(0)
                                break
                        
                        analysis["medications"].append({
                            "name": med_name.title(),
                            "dosage": dosage,
                            "frequency": frequency,
                            "context": context[:100] + "..." if len(context) > 100 else context
                        })
            
            # Extract all dosages
            dosage_patterns = [
                r'\d+\s*mg\b', r'\d+\s*ml\b', r'\d+\s*g\b', r'\d+\s*mcg\b',
                r'\d+\s*tablet', r'\d+\s*capsule'
            ]
            
            for pattern in dosage_patterns:
                matches = re.findall(pattern, text, re.IGNORECASE)
                analysis["dosages"].extend(matches)
            
            # Extract dosages
            for pattern in dosage_patterns:
                matches = re.findall(pattern, text_lower)
                analysis["dosages"].extend(matches)
            
            # Extract patient information
            # Look for "Anne Burton" specifically after "Name"
            name_match = re.search(r'name\s+age\s+([a-zA-Z\s]+?)\s+\d+', text_lower)
            if name_match:
                analysis["patient_info"]["name"] = name_match.group(1).strip().title()
            
            age_match = re.search(r'age\s+([a-zA-Z\s]+?)\s+(\d+)', text_lower)
            if age_match:
                analysis["patient_info"]["age"] = int(age_match.group(2))
                if not analysis["patient_info"].get("name"):
                    analysis["patient_info"]["name"] = age_match.group(1).strip().title()
            
            # Extract phone number
            phone_match = re.search(r'phone.*?(\(\d{3}\)\s*\d{3}-\d{4}|\d{3}[-.\s]?\d{3}[-.\s]?\d{4})', text, re.IGNORECASE)
            if phone_match:
                analysis["patient_info"]["phone"] = phone_match.group(1)
            
            # Extract doctor information - look for "Leslie Holden"
            physician_match = re.search(r'physician\s+name\s+physician\s+phone\s+number\s+([a-zA-Z\s]+?)\s+\(\d{3}\)', text_lower)
            if physician_match:
                analysis["doctor_info"]["name"] = physician_match.group(1).strip().title()
            
            # Extract dates
            date_patterns = [
                r'\w+\s+\d{1,2},?\s+\d{4}',  # November 8, 2021
                r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}',  # 11/8/2021
                r'\d{1,2}\s+\w+\s+\d{4}'  # 8 November 2021
            ]
            
            for pattern in date_patterns:
                matches = re.findall(pattern, text)
                analysis["dates"].extend(matches)
            
            # Extract vitals (blood pressure, heart rate, etc.)
            vitals_patterns = {
                'blood_pressure': r'\d{2,3}[/\\]\d{2,3}',
                'heart_rate': r'\d{2,3}\s*bpm',
                'temperature': r'\d{2,3}\.?\d*\s*[°f|°c|f|c]\b',
                'weight': r'\d{1,3}\.?\d*\s*kg',
                'height': r'\d{1,3}\.?\d*\s*cm'
            }
            
            for vital_type, pattern in vitals_patterns.items():
                matches = re.findall(pattern, text_lower)
                if matches:
                    analysis["vitals"][vital_type] = matches
            
            # Extract common instructions
            instruction_keywords = [
                'before meals', 'after meals', 'with food', 'empty stomach',
                'morning', 'evening', 'night', 'bedtime', 'as needed'
            ]
            
            for keyword in instruction_keywords:
                if keyword in text_lower:
                    analysis["instructions"].append(keyword)
            
            return analysis
            
        except Exception as e:
            logger.error(f"Medical content analysis failed: {e}")
            return {"error": str(e)}
    
    def process_medical_document(self, file_path: str) -> Dict[str, Any]:
        """Complete medical document processing pipeline"""
        try:
            logger.info(f"🔍 Processing medical document: {file_path}")
            
            # Check if file exists
            if not os.path.exists(file_path):
                return {"error": f"File not found: {file_path}"}
            
            # Extract text using PaddleOCR
            ocr_result = self.extract_text_from_image(file_path)
            
            if "error" in ocr_result:
                return ocr_result
            
            # Analyze medical content
            medical_analysis = self.analyze_medical_content(ocr_result["text"])
            
            # Combine results
            result = {
                "success": True,
                "file_path": file_path,
                "ocr_confidence": ocr_result["confidence"],
                "extracted_text": ocr_result["text"],
                "text_blocks_count": ocr_result["total_blocks"],
                "medical_analysis": medical_analysis,
                "processing_info": {
                    "ocr_engine": "PaddleOCR",
                    "language": "English",
                    "preprocessing": "Applied"
                }
            }
            
            logger.info("✅ Medical document processing completed successfully")
            return result
            
        except Exception as e:
            logger.error(f"❌ Document processing failed: {e}")
            return {"error": str(e), "success": False}

def main():
    """Command line interface for medical document analysis"""
    parser = argparse.ArgumentParser(description='Medical Document OCR Analysis with PaddleOCR')
    parser.add_argument('image_path', help='Path to medical document image')
    parser.add_argument('--output', '-o', help='Output JSON file path')
    
    args = parser.parse_args()
    
    # Initialize analyzer
    analyzer = MedicalDocumentAnalyzer()
    
    # Process document
    result = analyzer.process_medical_document(args.image_path)
    
    # Output results
    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        print(f"Results saved to: {args.output}")
    else:
        print(json.dumps(result, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()