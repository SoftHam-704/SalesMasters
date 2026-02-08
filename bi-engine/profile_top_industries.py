import time
from services.top_industries import fetch_top_industries

def profile_top_industries():
    start = time.time()
    print("Iniciando fetch_top_industries...")
    res = fetch_top_industries(2025, 'Todos', 'valor', 6)
    print(f"fetch_top_industries took: {time.time() - start:.2f}s")
    print(f"Results count: {len(res)}")

if __name__ == "__main__":
    profile_top_industries()
