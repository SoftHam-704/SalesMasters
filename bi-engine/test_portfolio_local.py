"""
Script de teste simples para Portfolio ABC
Usa apenas bibliotecas padrão do Python
"""
from services.portfolio_analyzer import analyzer

print("=" * 60)
print("TESTANDO PORTFOLIO ANALYZER (LOCAL)")
print("=" * 60)

# 1. Testar lista de indústrias
print("\n1️⃣ Listando indústrias ativas...")
try:
    industrias = analyzer.get_industrias_disponiveis()
    print(f"   ✅ {len(industrias)} indústrias encontradas")
    for ind in industrias[:3]:
        print(f"     - {ind['codigo']}: {ind['nome']}")
except Exception as e:
    print(f"   ❌ Erro: {e}")
    import traceback
    traceback.print_exc()

# 2. Testar análise ABC
print("\n2️⃣ Análise ABC - Ajusa (31) - Ano 2025...")
try:
    result = analyzer.analyze_portfolio(ano=2025, mes=None, industria_codigo=31)
    
    if result['success']:
        print(f"   ✅ Análise bem-sucedida!")
        data = result['data']
        print(f"   Período: {data['periodo']}")
        print(f"   Indústria: {data['industria']['nome']}")
        print(f"   Total produtos: {data['total_produtos_catalogo']}")
        print(f"   Valor total: R$ {data['total_valor_vendido']:,.2f}")
        print(f"\n   Curvas:")
        for curva in data['curvas']:
            print(f"     {curva['icon']} {curva['label']}")
            print(f"        Faturamento: {curva['percentual_faturamento']}%")
            print(f"        Status: {curva['status']}")
    else:
        print(f"   ⚠️ {result['message']}")
        
except Exception as e:
    print(f"   ❌ Erro: {e}")
    import traceback
    traceback.print_exc()

# 3. Testar drill-down produtos OFF
print("\n3️⃣ Produtos da Curva OFF...")
try:
    produtos = analyzer.get_produtos_detalhados(
        ano=2025,
        mes=None,
        industria_codigo=31,
        curva='OFF',
        limit=5
    )
    print(f"   ✅ {len(produtos)} produtos OFF encontrados")
    for prod in produtos[:3]:
        print(f"     - {prod['nome']}: {prod['dias_sem_venda']} dias sem venda")
except Exception as e:
    print(f"   ❌ Erro: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
print("TESTE CONCLUÍDO")
print("=" * 60)
