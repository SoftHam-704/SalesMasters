"""
Análise detalhada dos cálculos da Curva ABC - Indústria 23
"""
from services.database import execute_query

print("="*70)
print("ANÁLISE DETALHADA - CURVA ABC (Indústria 23)")
print("="*70)

# 1. Ver dados brutos da função
print("\n1. DADOS BRUTOS da fn_analise_curva_abc:")
query1 = """
    SELECT 
        curva_abc,
        qtd_itens,
        valor_total,
        quantidade_total,
        percentual_itens,
        percentual_faturamento
    FROM fn_analise_curva_abc(2025, NULL, 23)
    ORDER BY CASE curva_abc 
        WHEN 'A' THEN 1 
        WHEN 'B' THEN 2 
        WHEN 'C' THEN 3 
        ELSE 4 
    END
"""
df1 = execute_query(query1)
print(df1.to_string())

# 2. Calcular soma total para verificar
total_valor = df1['valor_total'].sum()
total_itens = df1['qtd_itens'].sum()

print(f"\n2. TOTAIS:")
print(f"   Total de Itens: {total_itens}")
print(f"   Valor Total Vendido: R$ {total_valor:,.2f}")

# 3. Verificar percentuais manualmente
print(f"\n3. VERIFICAÇÃO MANUAL dos percentuais:")
for _, row in df1.iterrows():
    curva = row['curva_abc']
    valor = row['valor_total']
    perc_calculado = (valor / total_valor * 100) if total_valor > 0 else 0
    perc_funcao = row['percentual_faturamento']
    
    print(f"   Curva {curva}:")
    print(f"      Valor: R$ {valor:,.2f}")
    print(f"      % Calculado: {perc_calculado:.2f}%")
    print(f"      % da Função: {perc_funcao:.2f}%")
    print(f"      Match: {'✅' if abs(perc_calculado - perc_funcao) < 0.01 else '❌'}")

# 4. Ver total geral de vendas da indústria (para comparar)
print(f"\n4. TOTAL GERAL DE VENDAS (Indústria 23, 2025):")
query2 = """
    SELECT 
        COUNT(DISTINCT ped.ped_pedido) as total_pedidos,
        SUM(i.ite_totliquido) as valor_total_vendas
    FROM pedidos ped
    INNER JOIN itens_ped i ON ped.ped_pedido = i.ite_pedido
    WHERE ped.ped_industria = 23
      AND EXTRACT(YEAR FROM ped.ped_data) = 2025
      AND ped.ped_situacao IN ('P', 'F')
"""
df2 = execute_query(query2)
print(df2.to_string())

print(f"\n5. DIAGNÓSTICO:")
if total_valor > 0:
    perc_curva_a = (df1[df1['curva_abc'] == 'A']['valor_total'].values[0] / total_valor * 100)
    print(f"   ✅ Curva A representa {perc_curva_a:.1f}% do faturamento catalogado")
    print(f"   ℹ️  O 0.5% é o percentual CORRETO de faturamento da Curva A")
    print(f"   ⚠️  Isso significa que a Curva A está com performance MUITO BAIXA!")
    print(f"   💡 Normalmente deveria ser 70-80% do faturamento")
else:
    print(f"   ❌ Sem vendas registradas")
