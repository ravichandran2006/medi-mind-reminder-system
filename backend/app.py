# backend/app.py
from flask import Flask, request, jsonify
from paddleocr import PaddleOCR
from flask_cors import CORS
import os
import re

app = Flask(__name__)
CORS(app)

ocr = PaddleOCR(use_angle_cls=True, lang='en')

os.makedirs('./uploads', exist_ok=True)

@app.route('/test-ocr', methods=['POST'])
def test_ocr():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    file_path = f"./uploads/{file.filename}"
    file.save(file_path)

    result = ocr.ocr(file_path, cls=True)

    # Extract relevant fields
    data = {
        'Weight': None,
        'HeartRate': None,
        'BloodPressure': None,
        'BodyTemperature': None
    }

    for line in result[0]:
        text = line[1][0].strip()

        # Match weight (e.g. 65 kg or 70kg)
        weight_match = re.search(r'(\d+)\s?kg', text.lower())
        if weight_match:
            data['Weight'] = weight_match.group(0)

        # Match heart rate (e.g. 74 bpm)
        hr_match = re.search(r'(\d+)\s?bpm', text.lower())
        if hr_match:
            data['HeartRate'] = hr_match.group(0)

        # Match blood pressure (e.g. 120/80)
        bp_match = re.search(r'(\d{2,3}/\d{2,3})', text)
        if bp_match:
            data['BloodPressure'] = bp_match.group(0)

        # Match temperature (e.g. 98.6°F or 37 C)
        temp_match = re.search(r'(\d+(\.\d+)?)\s?(°f|f|°c|c)', text.lower())
        if temp_match:
            data['BodyTemperature'] = temp_match.group(0)

    return jsonify(data)


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
