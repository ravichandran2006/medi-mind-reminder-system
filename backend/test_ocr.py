from paddleocr import PaddleOCR
import tempfile
from pathlib import Path

ocr = PaddleOCR(use_textline_orientation=True, lang='en')

def extract_prescription(file):
    """
    file: Werkzeug FileStorage object (from Flask)
    returns: dictionary of detected text
    """
    # Save uploaded file temporarily
    temp_file = Path(tempfile.gettempdir()) / file.filename
    file.save(temp_file)

    # Perform OCR
    result = ocr.ocr(str(temp_file))
    text_lines = [line[1][0] for line in result[0]]  # extract text

    # Optionally, remove temp file
    temp_file.unlink(missing_ok=True)

    return {"text": text_lines}
