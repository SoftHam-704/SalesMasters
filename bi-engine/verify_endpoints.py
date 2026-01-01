import requests
import json

def check_endpoints():
    base_url = "http://localhost:8000/api/dashboard"
    
    endpoints = [
        {"url": f"{base_url}/evolution?ano=2025&metrica=valor", "name": "Evolution (Valor)"},
        {"url": f"{base_url}/goals-scroller?ano=2025", "name": "Goals Scroller"}
    ]
    
    print("--- DIAGNOSTIC START ---")
    for ep in endpoints:
        try:
            print(f"Testing {ep['name']}...")
            resp = requests.get(ep['url'], timeout=2)
            if resp.status_code == 200:
                data = resp.json()
                print(f"✅ {ep['name']}: OK (Items: {len(data)})")
                # print(json.dumps(data[:1], indent=2))
            else:
                print(f"❌ {ep['name']}: Error {resp.status_code}")
                print(resp.text)
        except Exception as e:
            print(f"❌ {ep['name']}: Connection Failed - {e}")
    print("--- DIAGNOSTIC END ---")

if __name__ == "__main__":
    check_endpoints()
