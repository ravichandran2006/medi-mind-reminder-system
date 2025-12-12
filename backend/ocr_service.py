import sys
import cv2
from paddleocr import PaddleOCR
import re


class OCRService:
    def __init__(self):
        # Initialize PaddleOCR with better orientation handling
        self.ocr = PaddleOCR(
            lang='en',
            use_textline_orientation=True,
        )
    
    def process_image(self, image_path):
        """Process the prescription image and extract health data"""
        try:
            # Read the image
            img = cv2.imread(image_path)
            if img is None:
                return {"error": "Failed to read image"}
            
            # Preprocess the image to improve OCR accuracy
            processed_img = self._preprocess_image(img)

            # Run OCR on the preprocessed image; fall back to raw image if needed
            result = self.ocr.ocr(processed_img)
            if not self._has_text(result):
                result = self.ocr.ocr(img)
            
            if not result or len(result) == 0:
                return {"error": "No text detected in image"}
            
            # Extract text from OCR result
            extracted_lines = self._parse_text_lines(result)
            extracted_text = "\n".join(
                text for text, score in extracted_lines if score >= 0.45
            )
            
            print("OCR full text:\n" + extracted_text, file=sys.stderr, flush=True)
            
            # Extract health metrics using regex patterns
            health_data = self._extract_health_metrics(extracted_text)
            
            if not any(value for key, value in health_data.items()):
                return {
                    "error": "Unable to extract health metrics from the image. Please upload a clearer prescription.",
                    "rawText": extracted_text.strip()
                }

            health_data["rawText"] = extracted_text.strip()
            return health_data
            
        except Exception as e:
            return {"error": str(e)}
    
    def _preprocess_image(self, img):
        """Apply filters that generally improve OCR results on prescriptions."""
        if len(img.shape) == 3:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        else:
            gray = img.copy()

        # Reduce noise and enhance contrast
        denoised = cv2.bilateralFilter(gray, 9, 75, 75)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(denoised)

        # Adaptive thresholding for better text separation
        thresh = cv2.adaptiveThreshold(
            enhanced,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            31,
            5
        )

        # Convert back to 3-channel image for PaddleOCR
        processed = cv2.cvtColor(thresh, cv2.COLOR_GRAY2BGR)
        return processed

    def _has_text(self, result):
        if not result:
            return False
        for page in result:
            if page:
                return True
        return False

    def _extract_health_metrics(self, text):
        """Extract health metrics from the OCR text using regex patterns"""
        health_data = {
            "weight": "",
            "heartRate": "",
            "systolic": "",
            "diastolic": "",
            "temperature": ""
        }
        
        # Normalize text for easier matching
        lower_text = text.lower()
        lines = [line.strip() for line in lower_text.splitlines() if line.strip()]

        def extract_number(line):
            match = re.search(r'(\d+\.?\d*)', line)
            return match.group(1) if match else ''

        def assign_value(label, value, source_line=''):
            if not value:
                return
            if label == 'weight':
                health_data["weight"] = value
            elif label == 'heartRate':
                health_data["heartRate"] = value
            elif label == 'temperature':
                temp_value = float(value)
                if temp_value < 60 and ('c' in source_line):
                    temp_value = (temp_value * 9/5) + 32
                health_data["temperature"] = str(round(temp_value, 1))
            elif label == 'bp':
                if isinstance(value, tuple):
                    health_data["systolic"], health_data["diastolic"] = value
                else:
                    bp_match = re.search(r'(\d+)\s*[/]\s*(\d+)', value)
                    if bp_match:
                        health_data["systolic"] = bp_match.group(1)
                        health_data["diastolic"] = bp_match.group(2)

        pending_label = None

        for line in lines:
            bp_match = re.search(r'(?:blood\s*pressure|bp)\s*[-:]*\s*(\d+)\s*/\s*(\d+)', line)
            if bp_match:
                assign_value('bp', (bp_match.group(1), bp_match.group(2)), line)
                pending_label = None
                continue
            if re.search(r'\b(blood\s*pressure|bp)\b', line):
                pending_label = 'bp'
                continue

            if re.search(r'\b(weight|wt)\b', line):
                value = extract_number(line)
                if value:
                    assign_value('weight', value, line)
                    pending_label = None
                else:
                    pending_label = 'weight'
                continue

            if re.search(r'\b(heart rate|pulse rate|pulse|hr|bpm)\b', line):
                value = extract_number(line)
                if value:
                    assign_value('heartRate', value, line)
                    pending_label = None
                else:
                    pending_label = 'heartRate'
                continue

            if re.search(r'\b(temperature|temp)\b', line):
                value = extract_number(line)
                if value:
                    assign_value('temperature', value, line)
                    pending_label = None
                else:
                    pending_label = 'temperature'
                continue

            if pending_label:
                value = extract_number(line)
                if value or pending_label == 'bp':
                    if pending_label == 'bp':
                        assign_value('bp', line, line)
                    else:
                        assign_value(pending_label, value, line)
                    pending_label = None
        
        return health_data

    def _parse_text_lines(self, ocr_result):
        """Normalize PaddleOCR output format into (text, confidence) tuples."""
        lines = []
        if not ocr_result:
            return lines

        for page in ocr_result:
            if not page:
                continue
            if isinstance(page, dict):
                texts = page.get("rec_texts", [])
                scores = page.get("rec_scores", [1.0] * len(texts))
                for text, score in zip(texts, scores):
                    if text:
                        lines.append((text.strip(), float(score)))
                continue
            for line in page:
                text = ""
                confidence = 1.0

                if isinstance(line, dict):
                    text = line.get("transcription", "")
                    confidence = line.get("confidence", 1.0)
                elif isinstance(line, (list, tuple)):
                    if len(line) >= 2:
                        meta = line[1]
                        if isinstance(meta, (list, tuple)):
                            text = meta[0] if len(meta) > 0 else ""
                            confidence = meta[1] if len(meta) > 1 else 1.0
                        elif isinstance(meta, str):
                            text = meta
                    elif len(line) == 1 and isinstance(line[0], str):
                        text = line[0]

                if text:
                    if confidence < 0 or confidence > 1:
                        confidence = 1.0
                    lines.append((text.strip(), confidence))

        return lines

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