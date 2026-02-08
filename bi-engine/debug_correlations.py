import time
from services.insights import AdvancedAnalyzer

def debug_correlations():
    analyzer = AdvancedAnalyzer()
    start = time.time()
    print("Iniciando find_product_correlations...")
    res = analyzer.find_product_correlations()
    print(f"find_product_correlations took: {time.time() - start:.2f}s")
    print(f"Results count: {len(res)}")

if __name__ == "__main__":
    debug_correlations()
