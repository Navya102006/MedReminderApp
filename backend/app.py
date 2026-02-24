"""
Backend Flask application for Medicine Reminder App.
Handles file uploads, OCR processing, and caretaker email alerts.
"""

import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import pytesseract
from PIL import Image, ImageOps, ImageFilter
from dotenv import load_dotenv

# Load .env file if present
load_dotenv()

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%H:%M:%S'
)
log = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configuration
# Ensure uploads folder is created relative to this script file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')

# Tesseract Configuration
# Windows specific: Try to find tesseract executable automatically
# Common default installation paths for Tesseract
possible_tesseract_paths = [
    r'C:\Program Files\Tesseract-OCR\tesseract.exe',
    r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
    r'D:\Program Files\Tesseract-OCR\tesseract.exe'
]

# Check strict path or fallback to PATH
tesseract_found = False
for path in possible_tesseract_paths:
    if os.path.exists(path):
        pytesseract.pytesseract.tesseract_cmd = path
        tesseract_found = True
        log.info(f"Tesseract found at: {path}")
        break

if not tesseract_found:
    log.info("Tesseract not in common dirs — assuming it is in system PATH.")

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
    log.info(f"Created uploads folder: {UPLOAD_FOLDER}")

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ... (existing imports)

# Stop Words Configuration (added below existing imports in file, but for this replacement, we place it here)
import difflib
import re

STOP_WORDS = {
    'tablet', 'tab', 'capsule', 'cap', 'mg', 'ml', 'g', 'mcg', 'oz', 'qty',
    'take', 'daily', 'every', 'day', 'night', 'morning', 'evening', 'noon',
    'hours', 'hrs', 'bid', 'tid', 'qid', 'po', 'prn', 'prescription', 'rx',
    'disp', 'sig', 'refills', 'dr', 'doctor', 'patient', 'date', 'pharmacy',
    'route', 'oral', 'mouth', 'injection', 'solution', 'suspension', 'drops',
    'cream', 'gel', 'ointment', 'spray', 'inhaler', 'patch', 'suppository',
    'food', 'meals', 'before', 'after', 'with', 'water', 'for', 'use', 'as',
    'directed', 'needed', 'pain', 'fever', 'infection', 'inflammation',
    'blood', 'pressure', 'sugar', 'heart', 'cholesterol', 'vitamin', 'supplement',
    'substitution', 'permissible', 'brand', 'generic', 'interchangeable',
    'no', 'yes', 'not', 'do', 'dont', 'does', 'did', 'was', 'were', 'is', 'are',
    'the', 'and', 'or', 'of', 'in', 'on', 'at', 'to', 'from', 'by', 'with'
}

# Medicine Extraction Logic
MEDICINE_FILE = os.path.join(BASE_DIR, 'medicines.csv')
medicine_list = set()
medicine_list_names = [] # List version for fuzzy matching

def load_medicines():
    """
    Load medicine names from CSV file into a set for efficient lookup
    and a list for fuzzy matching.
    """
    global medicine_list, medicine_list_names
    if os.path.exists(MEDICINE_FILE):
        try:
            with open(MEDICINE_FILE, 'r', encoding='utf-8') as f:
                # Assuming simple list of names, one per line or simple CSV
                # Strip whitespace and convert to lowercase for normalization
                medicine_list = {line.strip().lower() for line in f if line.strip()}
                medicine_list_names = list(medicine_list)
            print(f"Loaded {len(medicine_list)} medicines.")
        except Exception as e:
            print(f"Error loading medicine file: {e}")
    else:
        print("Medicine file not found. Medicine extraction will not work.")

# Load medicines on startup
load_medicines()

# (keep preprocess_image as is - it is between load_medicines and perform_ocr)

def extract_medicines(text):
    """
    Extract medicine names from the provided text using:
    1. Exact matching (ignoring stop words)
    2. Fuzzy matching (handling typos)
    """
    detected_medicines = set()
    
    # Normalize text to lowercase
    text_lower = text.lower()
    
    # Tokenize: Split into words, handling punctuation
    words = re.findall(r'\b\w+\b', text_lower)
    
    for word in words:
        # 1. Base Filter: Length and Stop Words
        if len(word) < 3:
            continue
        if word in STOP_WORDS:
            continue
            
        # 2. Exact Match
        if word in medicine_list:
            detected_medicines.add(word.capitalize())
            continue
            
        # 3. Fuzzy Match
        matches = difflib.get_close_matches(word, medicine_list_names, n=1, cutoff=0.85)
        if matches:
            detected_medicines.add(matches[0].title()) # Use title case for display
            
    # 4. Multi-word phrase matching (Exact scan)
    # Optimization: Only check multi-word medicines from our list
    multi_word_meds = [m for m in medicine_list_names if ' ' in m]
    
    if multi_word_meds:
        for med in multi_word_meds:
            if re.search(r'\b' + re.escape(med) + r'\b', text_lower):
                detected_medicines.add(med.title())

    return sorted(list(detected_medicines))

def preprocess_image(image):
    """
    Preprocess image for better OCR accuracy.
    Includes: Grayscale, Resizing, Thresholding, Noise Removal.
    """
    # 1. Convert to Grayscale
    gray = image.convert('L')
    
    # 2. Resize image if resolution is low (heuristically < 1000px width)
    # Tesseract works best with characters around 30 pixels tall.
    width, height = gray.size
    if width < 1000:
        scale_factor = 2
        gray = gray.resize((width * scale_factor, height * scale_factor), Image.Resampling.LANCZOS)
    
    # 3. Apply Thresholding (Binarization)
    # Using a fixed threshold or a simple adaptive approach can help.
    # Here we use a standard threshold to separate text from background.
    threshold_value = 140
    # point() maps each pixel value. If < threshold, set to 0 (black), else 255 (white).
    binary = gray.point(lambda p: 0 if p < threshold_value else 255, '1')
    
    # 4. Remove Noise (optional but requested)
    # MedianFilter is good for "salt and pepper" noise.
    # Be careful not to blur text too much.
    # checking filtered vs binary. Often binary is enough purely for text.
    # Let's apply a light median filter to the binary image to remove speckles.
    filtered = binary.filter(ImageFilter.MedianFilter(size=3))
    
    return filtered

def perform_ocr(image_path):
    """
    Helper function to perform OCR on an image file.
    """
    try:
        # Open the image using Pillow
        image = Image.open(image_path)
        
        # Preprocess the image
        processed_image = preprocess_image(image)
        
        # Perform OCR using pytesseract
        text = pytesseract.image_to_string(processed_image)
        return text
    except pytesseract.TesseractNotFoundError:
        # Rethrow with a more descriptive message or handle appropriately
        raise Exception("Tesseract-OCR not found. Please install it and add to PATH.")
    except Exception as e:
        raise Exception(f"OCR processing failed: {str(e)}")



@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({'status': 'ok', 'service': 'MedReminder Backend'})


@app.route('/upload-prescription', methods=['POST'])
def upload_prescription():
    """
    Endpoint to handle prescription image uploads and perform OCR.
    """
    if 'file' not in request.files:
        return jsonify({"status": "error", "message": "No file part"}), 400

    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"status": "error", "message": "No selected file"}), 400

    if not allowed_file(file.filename):
        return jsonify({'status': 'error', 'message': 'Invalid file type. Upload an image (PNG, JPG, etc.)'}), 415

    try:
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        log.info(f"Processing upload: {filename}")

        extracted_text = perform_ocr(file_path)
        text_normalized = extracted_text.lower()
        detected_medicines = extract_medicines(text_normalized)
        detected_dosages = sorted(set(re.findall(r'\d+\s?(?:mg|ml|g|mcg)', text_normalized)))

        log.info(f"OCR complete — {len(detected_medicines)} medicines found in {filename}")
        return jsonify({
            'status': 'success',
            'extracted_text': extracted_text.strip(),
            'detected_medicines': detected_medicines,
            'detected_dosages': detected_dosages,
            'filename': filename
        })
    except Exception as e:
        log.error(f"OCR error on {file.filename}: {e}")
        return jsonify({'status': 'error', 'message': f'OCR processing failed: {str(e)}'}), 500

    return jsonify({'status': 'error', 'message': 'Unknown error'}), 400

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

@app.route('/send-alert', methods=['POST'])
def send_alert():
    """
    Endpoint to send an email alert to the caretaker when a patient skips medication multiple times.
    """
    data = request.json
    if not data:
        return jsonify({"status": "error", "message": "No data provided"}), 400

    user_email = data.get('userEmail')
    caretaker_email = data.get('caretakerEmail')
    medicine_name = data.get('medicineName')

    if not all([user_email, caretaker_email, medicine_name]):
        return jsonify({"status": "error", "message": "Missing required fields"}), 400

    # Get credentials from environment variables
    smtp_server = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
    smtp_port = int(os.environ.get('SMTP_PORT', 587))
    smtp_user = os.environ.get('SMTP_USER')
    smtp_password = os.environ.get('SMTP_PASSWORD')

    if not smtp_user or not smtp_password:
        log.warning("SMTP credentials not set — simulating email alert.")
        return jsonify({'status': 'sent', 'simulated': True, 'message': 'Alert simulated (no SMTP config)'})

    try:
        msg = MIMEMultipart('alternative')
        msg['From'] = str(smtp_user)
        msg['To'] = str(caretaker_email)
        msg['Subject'] = f"⚠️ Medication Alert: {medicine_name} Missed"

        html = f"""
        <h3>Medication Missed Alert</h3>
        <p>The patient (<b>{user_email}</b>) has skipped or postponed <b>{medicine_name}</b> 3 consecutive times.</p>
        <p>Please check in with them as soon as possible.</p>
        <hr><p style="color:#888;font-size:12px">Sent by MedReminder</p>
        """
        msg.attach(MIMEText(html, 'html'))

        server = smtplib.SMTP(str(smtp_server), smtp_port)
        server.starttls()
        server.login(str(smtp_user), str(smtp_password))
        server.sendmail(str(smtp_user), str(caretaker_email), msg.as_string())
        server.quit()
        log.info(f"Alert email sent to {caretaker_email} for medicine {medicine_name}")
        return jsonify({'status': 'sent', 'simulated': False})
    except Exception as e:
        log.error(f"Failed to send alert email: {e}")
        return jsonify({'status': 'error', 'message': f'Email send failed: {str(e)}'}), 500

if __name__ == '__main__':
    log.info("Starting MedReminder Backend on 0.0.0.0:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
