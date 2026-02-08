
import time
from services.dashboard_summary import fetch_dashboard_summary
from services.analysis import analyze_industry_growth
from services.data_fetcher import fetch_faturamento_anual, fetch_metas_progresso

def profile_overview():
    print("--- Profiling Overview Tab Logic ---")
    
    start = time.time()
    summary = fetch_dashboard_summary(2025, 'Todos')
    print(f"Summary: {time.time() - start:.4f}s")
    # print(summary)

    start = time.time()
    growth = analyze_industry_growth(2025)
    print(f"Industry Growth: {time.time() - start:.4f}s")
    
    start = time.time()
    fat = fetch_faturamento_anual(2025)
    print(f"Faturamento Anual: {time.time() - start:.4f}s")
    
    start = time.time()
    metas = fetch_metas_progresso(2025)
    print(f"Metas Progresso: {time.time() - start:.4f}s")

if __name__ == "__main__":
    profile_overview()
