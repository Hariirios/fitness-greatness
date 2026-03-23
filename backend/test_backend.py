import requests
import time

print("Testing backend connection...")
time.sleep(2)

try:
    response = requests.get('http://localhost:5000/health', timeout=5)
    if response.status_code == 200:
        print("✓ Backend is running successfully!")
        print(f"Response: {response.json()}")
    else:
        print(f"✗ Backend returned status code: {response.status_code}")
except requests.exceptions.ConnectionError:
    print("✗ Cannot connect to backend on port 5000")
    print("Backend may not be running or still starting up")
except Exception as e:
    print(f"✗ Error: {e}")
