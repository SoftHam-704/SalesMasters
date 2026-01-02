from services.database import execute_query

print("Testando CTE vendas_produto isolado...")

query = """
WITH vendas_produto AS (
    SELECT 
        p.pro_id,
        p.pro_nome,
        SUM(i.ite_totliquido) as valor_total_produto
    FROM cad_prod p
    INNER JOIN itens_ped i ON p.pro_id = i.ite_idproduto
    INNER JOIN pedidos ped ON i.ite_pedido = ped.ped_pedido
    WHERE ped.ped_situacao IN ('P', 'F')
        AND ped.ped_industria = 31
        AND EXTRACT(YEAR FROM ped.ped_data) = 2025
    GROUP BY p.pro_id, p.pro_nome
)
SELECT COUNT(*) as total_produtos, SUM(valor_total_produto) as total_vendas
FROM vendas_produto
"""

result = execute_query(query)
print(f"\nResultado CTE vendas_produto:")
print(result)

print("\n\nTestando CTE todos_produtos...")

query2 = """
WITH vendas_produto AS (
    SELECT 
        p.pro_id,
        SUM(i.ite_totliquido) as valor_total_produto
    FROM cad_prod p
    INNER JOIN itens_ped i ON p.pro_id = i.ite_idproduto
    INNER JOIN pedidos ped ON i.ite_pedido = ped.ped_pedido
    WHERE ped.ped_situacao IN ('P', 'F')
        AND ped.ped_industria = 31
        AND EXTRACT(YEAR FROM ped.ped_data) = 2025
    GROUP BY p.pro_id
),
todos_produtos AS (
    SELECT 
        p.pro_id,
        COALESCE(vp.valor_total_produto, 0) as valor_total_produto
    FROM cad_prod p
    LEFT JOIN vendas_produto vp ON p.pro_id = vp.pro_id
    WHERE p.pro_industria = 31
)
SELECT COUNT(*) as total, SUM(valor_total_produto) as total_vendas
FROM todos_produtos
"""

result2 = execute_query(query2)
print(f"\nResultado CTE todos_produtos:")
print(result2)
