#!/usr/bin/env python3
"""
Medical Analysis Requirements and Setup Script
Installs all required packages for medical report analysis
"""

import subprocess
import sys
import os

# Required packages for medical analysis
REQUIREMENTS = [
    "pytesseract==0.3.10",
    "opencv-python==4.8.1.78", 
    "Pillow==10.1.0",
    "pdfplumber==0.9.0",
    "PyMuPDF==1.23.8",
    "requests==2.31.0",
    "numpy==1.24.3"
]

def install_packages():
    """Install required Python packages"""
    print("🔧 Installing medical analysis dependencies...")
    
    for package in REQUIREMENTS:
        try:
            print(f"   Installing {package}...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", package])
            print(f"   ✅ {package} installed successfully")
        except subprocess.CalledProcessError as e:
            print(f"   ❌ Failed to install {package}: {e}")
            return False
    
    return True

def check_tesseract():
    """Check if Tesseract OCR is installed"""
    try:
        subprocess.run(["tesseract", "--version"], capture_output=True, check=True)
        print("✅ Tesseract OCR is installed")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ Tesseract OCR not found")
        print("📥 Please install Tesseract OCR:")
        print("   Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki")
        print("   macOS: brew install tesseract")
        print("   Ubuntu: sudo apt-get install tesseract-ocr")
        return False

def setup_environment():
    """Set up the medical analysis environment"""
    print("🚀 Setting up medical analysis environment...")
    
    # Install Python packages
    if not install_packages():
        print("❌ Failed to install some packages")
        return False
    
    # Check Tesseract
    tesseract_ok = check_tesseract()
    
    # Create uploads directory
    uploads_dir = os.path.join(os.path.dirname(__file__), "..", "uploads")
    os.makedirs(uploads_dir, exist_ok=True)
    print(f"✅ Created uploads directory: {uploads_dir}")
    
    print("\n🎉 Medical analysis environment setup complete!")
    
    if not tesseract_ok:
        print("⚠️  Note: Tesseract OCR installation required for image analysis")
    
    return True

if __name__ == "__main__":
    setup_environment()