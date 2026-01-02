import sys
import os

# Add global path
sys.path.append(os.getcwd())

try:
    from services.analytics_dashboard import get_kpis_metrics, get_critical_alerts
    
    print("Testing get_kpis_metrics(2025, 'Todos')...")
    kpis = get_kpis_metrics(2025, "Todos")
    print("KPIs:", kpis)

    print("\nTesting get_critical_alerts(2025, 'Todos')...")
    alerts = get_critical_alerts(2025, "Todos")
    print("Alerts Keys:", alerts.keys())
    if alerts['lost_clients']:
        print("Sample Lost Client:", alerts['lost_clients'][0])
    print("Dead Stock Value:", alerts['dead_stock_value'])

    print("\n--- DIAGNOSTICO DE DADOS 2025 ---")
    # Checar se existem pedidos em 2025
    total_2025 = execute_query("SELECT COUNT(*) as qtd, SUM(ped_totliq) as val FROM pedidos WHERE EXTRACT(YEAR FROM ped_data) = 2025")
    print(f"Total Global 2025: {total_2025}")
    
    # Checar se existem pedidos com situação P ou F
    valid_2025 = execute_query("SELECT COUNT(*) as qtd FROM pedidos WHERE EXTRACT(YEAR FROM ped_data) = 2025 AND ped_situacao IN ('P', 'F')")
    print(f"Pedidos Validos (P/F) 2025: {valid_2025}")

    # Checar KPI Function
    kpis = get_kpis_metrics(2025, None) # Mes None = Todos
    print(f"KPIs Return (Mes=None): {kpis}")

    from services.analytics_dashboard import get_portfolio_abc
    print("\nTesting get_portfolio_abc(2025)...")
    abc = get_portfolio_abc(2025)
    print("ABC:", abc[:2] if abc else "Empty")

except Exception as e:
    import traceback
    traceback.print_exc()
