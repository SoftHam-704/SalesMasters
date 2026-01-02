from services.database import execute_query

print("Verificando dados de produtos e vendas...")

# 1. Verificar produtos da indústria 31
q1 = "SELECT COUNT(*) as total FROM cad_prod WHERE pro_industria = 31"
r1 = execute_query(q1)
print(f"\n1. Produtos da indústria 31: {r1.iloc[0]['total']}")

# 2. Verificar pedidos da indústria 31 em 2025
q2 = """
SELECT COUNT(*) as total 
FROM pedidos 
WHERE ped_industria = 31 
  AND EXTRACT(YEAR FROM ped_data) = 2025
  AND ped_situacao IN ('P', 'F')
"""
r2 = execute_query(q2)
print(f"2. Pedidos da indústria 31 em 2025: {r2.iloc[0]['total']}")

# 3. Verificar JOIN
q3 = """
SELECT COUNT(*) as total
FROM cad_prod p
INNER JOIN itens_ped i ON p.pro_id = i.ite_idproduto
INNER JOIN pedidos ped ON i.ite_pedido = ped.ped_pedido
WHERE ped.ped_situacao IN ('P', 'F')
    AND ped.ped_industria = 31
    AND EXTRACT(YEAR FROM ped.ped_data) = 2025
"""
r3 = execute_query(q3)
print(f"3. Itens vendidos (JOIN completo): {r3.iloc[0]['total']}")

print("\nDIAGNÓSTICO:")
if r1.iloc[0]['total'] == 0:
    print("❌ Não há produtos cadastrados para indústria 31")
elif r2.iloc[0]['total'] == 0:
    print("❌ Não há pedidos para indústria 31 em 2025")
elif r3.iloc[0]['total'] == 0:
    print("❌ JOIN está falhando - problema de chave ou tipo")
else:
    print(f"✅ Há {r3.iloc[0]['total']} itens vendidos")
    print("   O problema deve estar na lógica da função fn_analise_curva_abc")
