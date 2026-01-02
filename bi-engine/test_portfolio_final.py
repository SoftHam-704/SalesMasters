"""
TESTE FINAL - Portfolio ABC (Principal)
"""
from services.portfolio_analyzer import analyzer

print("=" * 70)
print("✅ TESTANDO INTEGRAÇÃO PORTFOLIO ABC - ANÁLISE PRINCIPAL")
print("=" * 70)

# 1. Listar Indústrias
print("\n📋 1. INDÚSTRIAS ATIVAS DISPONÍVEIS")
print("-" * 70)
try:
    industrias = analyzer.get_industrias_disponiveis()
    print(f"✅ {len(industrias)} indústrias ativas encontradas:\n")
    for i, ind in enumerate(industrias[:5], 1):
        print(f"   {i}. [{ind['codigo']}] {ind['nome']}")
    if len(industrias) > 5:
        print(f"   ... e mais {len(industrias) - 5} indústrias")
    print("\n✅ SUCESSO: Função fn_lista_industrias() funcionando!")
except Exception as e:
    print(f"❌ ERRO: {e}")

# 2. Análise ABC Completa
print("\n" + "=" * 70)
print("📊 2. ANÁLISE ABC COMPLETA - AJUSA (Código 31) - ANO 2025")
print("-" * 70)
try:
    result = analyzer.analyze_portfolio(ano=2025, mes=None, industria_codigo=31)
    
    if result['success']:
        data = result['data']
        
        print(f"\n✅ ANÁLISE BEM-SUCEDIDA!")
        print(f"\n📅 Período: {data['periodo']}")
        print(f"🏭 Indústria: {data['industria']['nome']} (Código: {data['industria']['codigo']})")
        
        resumo = data['resumo_periodo']
        print(f"\n📈 RESUMO DO PERÍODO:")
        print(f"   • Total de Pedidos: {resumo['total_pedidos']}")
        print(f"   • Total de Itens Vendidos: {resumo['total_itens_vendidos']}")
        print(f"   • Valor Total: R$ {resumo['valor_total_periodo']:,.2f}")
        print(f"   • Primeira Venda: {resumo['primeira_venda']}")
        print(f"   • Última Venda: {resumo['ultima_venda']}")
        
        print(f"\n📦 PORTFÓLIO:")
        print(f"   • Total de Produtos no Catálogo: {data['total_produtos_catalogo']}")
        print(f"   • Valor Total Vendido: R$ {data['total_valor_vendido']:,.2f}")
        
        print(f"\n🎯 CURVAS ABC:")
        for curva in data['curvas']:
            print(f"\n   {curva['icon']} {curva['label']}")
            print(f"      Status: {curva['status']}")
            print(f"      % Itens: {curva['percentual_itens']}%")
            print(f"      % Faturamento: {curva['percentual_faturamento']}%")
            print(f"      Valor: R$ {curva['valor_total']:,.2f}")
            print(f"      Detalhes:")
            for detalhe in curva['detalhes']:
                print(f"         • {detalhe}")
        
        if 'recomendacao_estrategica' in data:
            rec = data['recomendacao_estrategica']
            print(f"\n{rec['title']}")
            for item in rec['items']:
                print(f"   {item['icon']} [{item['priority'].upper()}] {item['text']}")
        
        print("\n" + "=" * 70)
        print("✅ TODAS AS FUNÇÕES INTEGRADAS COM SUCESSO!")
        print("=" * 70)
        print("\nFunções testadas e funcionando:")
        print("  ✓ fn_lista_industrias()")
        print("  ✓ fn_analise_curva_abc(2025, 31, NULL)")
        print("  ✓ fn_formatar_periodo(2025, NULL)")
        print("  ✓ fn_validar_periodo(2025, 31, NULL)")
        print("\nBackend pronto para receber requisições do frontend!")
        print("Endpoints disponíveis em: http://localhost:8001/api/portfolio/")
        
    else:
        print(f"⚠️  {result['message']}")
        
except Exception as e:
    print(f"❌ ERRO: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 70)
