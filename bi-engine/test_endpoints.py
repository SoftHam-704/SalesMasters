import requests
import sys

endpoints = [
    "http://localhost:8000/api/dashboard/analytics/alerts?ano=2025&mes=Todos",
    "http://localhost:8000/api/dashboard/analytics/kpis?ano=2025&mes=Todos",
    "http://localhost:8000/api/dashboard/analytics/portfolio-abc?ano=2025",
    "http://localhost:8000/health"
]

print("Testing Endpoints...")
for url in endpoints:
    try:
        print(f"\nGET {url}")
        r = requests.get(url, headers={"Origin": "http://localhost:5173"})
        print(f"Status: {r.status_code}")
        print(f"CORS Header: {r.headers.get('access-control-allow-origin')}")
        if r.status_code != 200:
            print(f"Response: {r.text[:500]}")
    except Exception as e:
        print(f"Error: {e}")
