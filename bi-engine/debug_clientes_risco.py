import requests
import json

def test_clientes_risco(vendedor_id=None):
    url = "http://localhost:8000/api/equipe/clientes-risco"
    params = {}
    if vendedor_id:
        params['vendedor'] = vendedor_id
    
    try:
        response = requests.get(url, params=params)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            if data['success'] and data['data']:
                print("First record keys:", data['data'][0].keys())
                print(json.dumps(data['data'][0], indent=2, ensure_ascii=False))
            else:
                print("No data or success=false")
        else:
            print("Error:", response.text)
    except Exception as e:
        print(e)

test_clientes_risco()
# Test with specific seller if needed
# test_clientes_risco(1)
