"""
Teste do endpoint /api/portfolio/analyze com indústria 23
"""
from services.database import execute_query
from services.analytics_dashboard import get_portfolio_abc
import traceback

print("="*60)
print("TESTE: /api/portfolio/analyze (Indústria 23)")
print("="*60)

try:
    print("\n1. Testando get_portfolio_abc(2025, 23)...")
    result = get_portfolio_abc(ano=2025, industry_id=23)
    
    print(f"\nResultado: {len(result)} curvas")
    for curva in result:
        print(f"  - Curva {curva['curva']}: {curva['qtd_itens']} itens, {curva['percent_valor']:.1f}%")
    
    if len(result) == 0:
        print("\n❌ Nenhuma curva retornada!")
        print("\nTestando query direta...")
        query = "SELECT * FROM fn_analise_curva_abc(2025, NULL, 23)"
        df = execute_query(query)
        print(f"\nQuery direta retornou: {len(df)} linhas")
        print(df)
        
except Exception as e:
    print(f"\n❌ ERRO: {e}")
    traceback.print_exc()
