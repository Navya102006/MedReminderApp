"""
Script to test the OCR backend endpoint.
"""
import os
import requests

URL = 'http://127.0.0.1:5000/upload-prescription'
FILE_PATH = 'test_upload.txt'

# Create a dummy file if it doesn't exist (though I created it already)
if not os.path.exists(FILE_PATH):
    with open(FILE_PATH, 'w', encoding='utf-8') as f:
        f.write('test content')

with open(FILE_PATH, 'rb') as f:
    files = {'file': f}
    try:
        response = requests.post(URL, files=files, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e: # pylint: disable=broad-exception-caught
        print(f"Error: {e}")
