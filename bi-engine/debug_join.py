from services.database import execute_query

def debug_manual_join():
    print("--- Debugging Manual Join ---")
    try:
        # Try to execute the EXACT CTE query
        query = """
        SELECT 
            p.pro_id,
            p.pro_nome,
            SUM(i.ite_totliquido) as valor_total_produto,
            MAX(ped.ped_data) as ultima_venda
        FROM cad_prod p
        INNER JOIN itens_ped i ON p.pro_id = i.ite_idproduto
        INNER JOIN pedidos ped ON i.ite_pedido = ped.ped_pedido
        WHERE ped.ped_situacao IN ('P', 'F')
            AND ped.ped_industria = 31
            AND EXTRACT(YEAR FROM ped.ped_data) = 2025
        GROUP BY p.pro_id, p.pro_nome
        LIMIT 5
        """
        df = execute_query(query)
        print("Join success! Count:", df)
    except Exception as e:
        print(f"Join Failed: {e}")

if __name__ == "__main__":
    debug_manual_join()
