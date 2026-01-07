import urllib.request
import json

try:
    with urllib.request.urlopen('http://localhost:3005/api/sellers/1/metas') as response:
        data = json.loads(response.read().decode())
        
    if data['success']:
        found = False
        for m in data['data']:
            if m['met_ano'] == 2026 and m['met_industria'] == 23:
                print("Found Metas 2026 Ind 23:")
                print(m)
                found = True
        if not found:
            print("Metas 2026 Ind 23 NOT FOUND in API response.")
    else:
        print("API Error:", data)
except Exception as e:
    print(e)
