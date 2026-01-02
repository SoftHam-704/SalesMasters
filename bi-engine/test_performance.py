import httpx
import asyncio
import time

async def test_full_tab():
    base_url = "http://localhost:8000"
    ep = "/api/dashboard/analytics/full-tab?ano=2025&mes=Setembro"
    
    async with httpx.AsyncClient() as client:
        print(f"Testing {ep}...")
        
        # First call (cold - should trigger DB hits and OpenAI)
        start = time.time()
        resp = await client.get(f"{base_url}{ep}", timeout=30.0)
        end = time.time()
        print(f"First call status: {resp.status_code}, Duration: {end - start:.2f}s")
        
        # Second call (hot - should hit cache)
        start = time.time()
        resp = await client.get(f"{base_url}{ep}", timeout=30.0)
        end = time.time()
        print(f"Second call status: {resp.status_code}, Duration: {end - start:.2f}s")

if __name__ == "__main__":
    asyncio.run(test_full_tab())
