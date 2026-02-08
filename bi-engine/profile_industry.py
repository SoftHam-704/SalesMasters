import time
from services.industry_dashboard import (
    get_funnel_kpi, get_funnel_sparkline, get_client_analysis, 
    get_monthly_sales_chart, get_recent_orders, get_industry_metadata, get_industry_narrative
)
import pandas as pd

def profile_industry_details(ano, mes, industry_id):
    month_int = None
    if mes and mes != 'Todos':
        month_int = int(mes)
        
    times = {}
    
    start = time.time()
    get_funnel_kpi(ano, month_int, industry_id)
    times['funnel_kpi'] = time.time() - start
    
    start = time.time()
    get_funnel_sparkline(ano, month_int, industry_id)
    times['sparkline'] = time.time() - start
    
    start = time.time()
    get_client_analysis(ano, industry_id)
    times['client_analysis'] = time.time() - start
    
    start = time.time()
    get_monthly_sales_chart(ano, industry_id)
    times['monthly_sales'] = time.time() - start
    
    start = time.time()
    get_recent_orders(ano, month_int, industry_id)
    times['recent_orders'] = time.time() - start
    
    start = time.time()
    get_industry_metadata(ano, month_int, industry_id)
    times['metadata'] = time.time() - start
    
    start = time.time()
    get_industry_narrative(ano, industry_id)
    times['narrative'] = time.time() - start
    
    print("Execution times (seconds):")
    for k, v in times.items():
        print(f"{k:20}: {v:.4f}")
    print(f"{'TOTAL':20}: {sum(times.values()):.4f}")

if __name__ == "__main__":
    # Let's pick a random industry ID that has data.
    # From top_industries query result earlier... wait, I didn't see results because it was truncated or empty.
    # I'll find one industry first.
    from services.database_native import db
    res = db.execute_one("SELECT ped_industria FROM pedidos LIMIT 1")
    if res:
        ind_id = res['ped_industria']
        print(f"Profiling for industry {ind_id}...")
        profile_industry_details(2025, 'Todos', ind_id)
    else:
        print("No industry found in pedidos.")

