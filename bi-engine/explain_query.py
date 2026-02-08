from services.database_native import db

query = """
    EXPLAIN ANALYZE
    WITH current_items AS (
        SELECT 
            COALESCE(SUM(i.ite_quant), 0) as total_qtd,
            COUNT(DISTINCT i.ite_produto) as total_skus_vendidos
        FROM pedidos p
        JOIN itens_ped i ON p.ped_pedido = i.ite_pedido AND p.ped_industria = i.ite_industria
        WHERE p.ped_industria = 6 
          AND p.ped_situacao IN ('P', 'F')
          AND EXTRACT(YEAR FROM p.ped_data) = 2025
    )
    SELECT * FROM current_items
"""

def profile():
    res = db.execute_query(query)
    for row in res:
        print(row['QUERY PLAN'])

if __name__ == "__main__":
    profile()
