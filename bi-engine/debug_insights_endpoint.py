import requests
import json

BASE_URL = "http://localhost:8000/api/equipe/ia-insights"

def test_insights(vendedor_id, ano, mes):
    print(f"\n--- Testing for Vendedor {vendedor_id} ({mes}/{ano}) ---")
    try:
        url = f"{BASE_URL}?vendedor={vendedor_id}&ano={ano}&mes={mes}"
        response = requests.get(url)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(json.dumps(data, indent=2, ensure_ascii=False))
        else:
            print("Error:", response.text)
    except Exception as e:
        print(f"Request failed: {e}")

# Test with a likely existing vendedor ID (e.g., from previous logs or standard IDs)
# I'll try a few common ones.
test_insights(1, 2025, 12)
test_insights(14, 2025, 12) # Fabio
