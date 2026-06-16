import httpx
import sys

try:
    response = httpx.get("http://127.0.0.1:8000/api/health")
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.json()}")
    if response.status_code == 200:
        print("✅ Health check passed!")
    else:
        print("❌ Health check failed!")
except Exception as e:
    print(f"❌ Error connecting to server: {e}")
    sys.exit(1)
