import requests
import json

BASE_URL = "http://localhost:8000/api/equipe"

def test_endpoint(name, url):
    print(f"\n=== {name} ===")
    try:
        response = requests.get(url)
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Success: {data.get('success')}")
        if data.get('success') and data.get('data'):
            if isinstance(data['data'], list):
                print(f"Records: {len(data['data'])}")
                if len(data['data']) > 0:
                    print(f"First: {json.dumps(data['data'][0], default=str, ensure_ascii=False)[:200]}")
            else:
                print(f"Data: {json.dumps(data['data'], default=str, ensure_ascii=False)[:300]}")
        else:
            print(f"Error: {data.get('error', 'No data')}")
    except Exception as e:
        print(f"Error: {e}")

test_endpoint("Carteira Resumo", f"{BASE_URL}/carteira-resumo?ano=2025&mes=12")
test_endpoint("Carteira Por Vendedor", f"{BASE_URL}/carteira-por-vendedor?ano=2025&mes=12")
test_endpoint("Novos Clientes", f"{BASE_URL}/novos-clientes?ano=2025&mes=12")
# Skip AI narratives for now to save API calls
# test_endpoint("Narrativas IA", f"{BASE_URL}/narrativas-ia?ano=2025&mes=12")
