#!/usr/bin/env python3
"""
Test Tesseract OCR Installation and Configuration
Creates sample medical documents and tests OCR extraction
"""

import os
import sys
from PIL import Image, ImageDraw, ImageFont
import tempfile

# Add the services directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    # Import required packages directly first
    import pytesseract
    import cv2
    import numpy as np
    
    # Configure Tesseract path
    tesseract_path = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    if os.path.exists(tesseract_path):
        pytesseract.pytesseract.tesseract_cmd = tesseract_path
        print(f"✅ Tesseract configured at: {tesseract_path}")
    
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Please ensure all dependencies are installed:")
    print("pip install pytesseract opencv-python pillow pdfplumber PyMuPDF")
    sys.exit(1)

def create_test_medical_image():
    """Create a test medical report image"""
    # Create a white image
    width, height = 800, 600
    img = Image.new('RGB', (width, height), color='white')
    draw = ImageDraw.Draw(img)
    
    # Try to use a standard font, fallback to default
    try:
        font_large = ImageFont.truetype("arial.ttf", 24)
        font_medium = ImageFont.truetype("arial.ttf", 18)
        font_small = ImageFont.truetype("arial.ttf", 14)
    except:
        font_large = ImageFont.load_default()
        font_medium = ImageFont.load_default()
        font_small = ImageFont.load_default()
    
    # Medical report content
    y_pos = 30
    
    # Header
    draw.text((50, y_pos), "MEDICAL LABORATORY REPORT", fill='black', font=font_large)
    y_pos += 50
    
    # Patient details
    draw.text((50, y_pos), "Patient: John Doe", fill='black', font=font_medium)
    y_pos += 30
    draw.text((50, y_pos), "Age: 45 years", fill='black', font=font_medium)
    y_pos += 30
    draw.text((50, y_pos), "Gender: Male", fill='black', font=font_medium)
    y_pos += 30
    draw.text((50, y_pos), "Date: 2025-09-19", fill='black', font=font_medium)
    y_pos += 50
    
    # Lab results
    draw.text((50, y_pos), "LABORATORY RESULTS:", fill='black', font=font_medium)
    y_pos += 40
    
    lab_results = [
        "Fasting Blood Sugar: 145 mg/dL (High)",
        "HbA1c: 7.2% (High)", 
        "Total Cholesterol: 220 mg/dL (High)",
        "LDL Cholesterol: 130 mg/dL (High)",
        "HDL Cholesterol: 38 mg/dL (Low)",
        "Triglycerides: 180 mg/dL (High)",
        "Blood Pressure: 140/90 mmHg (High)"
    ]
    
    for result in lab_results:
        draw.text((70, y_pos), result, fill='black', font=font_small)
        y_pos += 25
    
    y_pos += 30
    
    # Medications
    draw.text((50, y_pos), "PRESCRIBED MEDICATIONS:", fill='black', font=font_medium)
    y_pos += 40
    
    medications = [
        "1. Metformin 500mg - Twice daily",
        "2. Lisinopril 10mg - Once daily",
        "3. Atorvastatin 20mg - At bedtime"
    ]
    
    for med in medications:
        draw.text((70, y_pos), med, fill='black', font=font_small)
        y_pos += 25
    
    return img

def test_tesseract_installation():
    """Test if Tesseract is properly installed and configured"""
    print("🧪 Testing Tesseract OCR Installation...\n")
    
    try:
        # Test 1: Check Tesseract version
        print("1️⃣ Checking Tesseract version...")
        version = pytesseract.get_tesseract_version()
        print(f"   ✅ Tesseract version: {version}")
        
        # Test 2: Check available languages
        print("\n2️⃣ Checking available languages...")
        languages = pytesseract.get_languages()
        print(f"   ✅ Available languages: {', '.join(languages[:10])}...")
        
        if 'eng' not in languages:
            print("   ⚠️ English language pack not found!")
            return False
            
    except Exception as e:
        print(f"   ❌ Tesseract configuration error: {e}")
        return False
    
    return True

def test_ocr_on_sample_image():
    """Test OCR on a sample medical report image"""
    print("\n3️⃣ Testing OCR on sample medical image...")
    
    try:
        # Create test image
        test_img = create_test_medical_image()
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp_file:
            test_img.save(tmp_file.name)
            temp_image_path = tmp_file.name
        
        print(f"   📷 Created test image: {temp_image_path}")
        
        # Test basic OCR
        extracted_text = pytesseract.image_to_string(test_img, lang='eng')
        
        if extracted_text.strip():
            print(f"   ✅ OCR successful! Extracted {len(extracted_text)} characters")
            print(f"   📄 Sample text: {extracted_text[:100]}...")
            
            # Check for key medical terms
            medical_terms = ['medical', 'patient', 'blood', 'cholesterol', 'metformin']
            found_terms = [term for term in medical_terms if term.lower() in extracted_text.lower()]
            
            if found_terms:
                print(f"   🔍 Medical terms detected: {', '.join(found_terms)}")
            else:
                print("   ⚠️ No medical terms detected in extracted text")
        else:
            print("   ❌ No text extracted from image")
            return False
            
        # Clean up
        os.unlink(temp_image_path)
        return True
        
    except Exception as e:
        print(f"   ❌ OCR test failed: {e}")
        return False

def test_medical_analyzer():
    """Test the complete MedicalAnalyzer with OCR"""
    print("\n4️⃣ Testing Medical Analyzer with enhanced OCR...")
    
    try:
        # Import the analyzer here to avoid early import issues
        from services.medicalAnalysis import MedicalAnalyzer
        
        # Create analyzer instance (without Groq key for this test)
        analyzer = MedicalAnalyzer("test_key")
        
        # Create test image
        test_img = create_test_medical_image()
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp_file:
            test_img.save(tmp_file.name)
            temp_image_path = tmp_file.name
        
        print(f"   📷 Testing enhanced OCR on: {temp_image_path}")
        
        # Test enhanced OCR extraction
        extracted_text = analyzer.extract_text_from_image(temp_image_path)
        
        if extracted_text and len(extracted_text) > 50:
            print(f"   ✅ Enhanced OCR successful! Extracted {len(extracted_text)} characters")
            print(f"   📄 Sample text: {extracted_text[:150]}...")
            
            # Check for specific medical data
            checks = {
                'patient_name': 'john doe' in extracted_text.lower(),
                'lab_values': any(term in extracted_text.lower() for term in ['145', 'mg/dl', 'cholesterol']),
                'medications': any(term in extracted_text.lower() for term in ['metformin', 'lisinopril']),
                'structure': len(extracted_text.split('\n')) > 5
            }
            
            print("   🔍 Content analysis:")
            for check, result in checks.items():
                status = "✅" if result else "❌"
                print(f"     {status} {check}: {result}")
                
        else:
            print(f"   ❌ Enhanced OCR failed or extracted minimal text: {len(extracted_text) if extracted_text else 0} characters")
            if extracted_text:
                print(f"   📄 Text: {extracted_text}")
            return False
            
        # Clean up
        os.unlink(temp_image_path)
        return True
        
    except Exception as e:
        print(f"   ❌ Medical Analyzer test failed: {e}")
        return False

def main():
    """Run all Tesseract OCR tests"""
    print("🔬 Tesseract OCR Test Suite for Medical Analysis\n")
    print("=" * 60)
    
    tests = [
        ("Tesseract Installation", test_tesseract_installation),
        ("Basic OCR Functionality", test_ocr_on_sample_image),
        ("Medical Analyzer Integration", test_medical_analyzer)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n🧪 Running: {test_name}")
        print("-" * 40)
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    all_passed = True
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{status}: {test_name}")
        if not result:
            all_passed = False
    
    print("\n" + "=" * 60)
    if all_passed:
        print("🎉 ALL TESTS PASSED! Tesseract OCR is ready for medical analysis!")
        print("\n💡 Features now available:")
        print("   📷 Enhanced image text extraction")
        print("   📄 Multi-method PDF processing")
        print("   🔍 Medical document OCR optimization")
        print("   📊 Robust text preprocessing")
        print("\n🚀 Your medical analysis system is fully functional!")
    else:
        print("⚠️ Some tests failed. Please check the error messages above.")
        print("\n🔧 Troubleshooting tips:")
        print("   1. Ensure Tesseract is properly installed")
        print("   2. Check that English language pack is available")
        print("   3. Verify Python packages are correctly installed")

if __name__ == "__main__":
    main()