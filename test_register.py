import requests
import json

url = "http://localhost:3001/api/auth/register"
payload = {
    "username": "newuser",
    "email": "tester@example.com", # Testing duplicate
    "password": "password123"
}

print(f"Testing registration with existing email: {payload['email']}")
try:
    response = requests.post(url, json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Request failed: {e}")

payload["email"] = "unique_email_123@example.com"
print(f"\nTesting registration with unique email: {payload['email']}")
try:
    response = requests.post(url, json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Request failed: {e}")
