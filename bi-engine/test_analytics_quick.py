"""
Teste rápido para verificar funções - DEBUG
"""
from services.analytics_dashboard import get_critical_alerts, get_portfolio_abc

print("="*60)
print("TESTE DE DIAGNÓSTICO - ANALYTICS")
print("="*60)

# Testar alertas
print("\n1. TESTANDO ALERTAS (ano=2025, industria=31)...")
try:
    alerts = get_critical_alerts(ano=2025, mes='Todos', industry_id=31)
    print(f"   ✅ Lost Clients: {len(alerts.get('lost_clients', []))}")
    print(f"   ✅ Dead Stock Count: {alerts.get('dead_stock_count', 0)}")
    print(f"   ✅ Dead Stock Value: R$ {alerts.get('dead_stock_value', 0):,.2f}")
except Exception as e:
    print(f"   ❌ ERRO: {e}")
    import traceback
    traceback.print_exc()

# Testar ABC
print("\n2. TESTANDO PORTFOLIO ABC (ano=2025, industria=31)...")
try:
    abc = get_portfolio_abc(ano=2025, industry_id=31)
    print(f"   ✅ Total de curvas: {len(abc)}")
    for curva in abc:
        print(f"     - Curva {curva.get('curva')}: {curva.get('qtd_itens')} itens, {curva.get('percent_valor'):.1f}%")
except Exception as e:
    print(f"   ❌ ERRO: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*60)
