#!/usr/bin/env python3
"""
Simple PaddleOCR test to understand the API
"""
import paddleocr

def test_paddleocr():
    print("Initializing PaddleOCR...")
    ocr = paddleocr.PaddleOCR(lang='en')
    
    print("Running OCR on test image...")
    image_path = "uploads/1758300557129_275625944_prescription_png.png"
    
    # Test the predict method
    result = ocr.predict(image_path)
    print(f"Result type: {type(result)}")
    print(f"Result: {result}")
    
    # Try to extract text
    if isinstance(result, dict):
        print(f"Dict keys: {list(result.keys())}")
        for key, value in result.items():
            print(f"Key '{key}': {type(value)}")
            if isinstance(value, list) and len(value) > 0:
                print(f"  First item: {value[0]}")
    
    return result

if __name__ == "__main__":
    result = test_paddleocr()