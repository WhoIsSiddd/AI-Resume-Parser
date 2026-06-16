import requests
import os

url = "http://127.0.0.1:8000/api/parse"
file_path = r"e:\project_6th_semester\project\test_resume.pdf"

if not os.path.exists(file_path):
    print(f"File not found: {file_path}")
    exit(1)

files = {'file': open(file_path, 'rb')}
data = {'jd_data': ''}

try:
    print(f"Sending request to {url}...")
    response = requests.post(url, files=files, data=data)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print("Success!")
        print(response.json())
    else:
        print("Error:")
        print(response.text)
except Exception as e:
    print(f"Request failed: {e}")
