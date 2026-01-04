"""Test metas API"""
import urllib.request
import json

url = "http://localhost:3005/api/sellers/5/metas"
req = urllib.request.Request(url)
with urllib.request.urlopen(req) as response:
    data = json.loads(response.read().decode())
    if data['data']:
        meta = data['data'][0]
        print("Primeiro registro de meta:")
        for key, value in meta.items():
            print(f"  {key}: {value} (tipo: {type(value).__name__})")
    else:
        print("Nenhuma meta encontrada")
