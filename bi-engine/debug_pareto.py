from services.database import execute_query
import pandas as pd

def debug_pareto(ano=2025):
    print(f"--- DEBUG PARETO {ano} ---")
    
    # 1. Total Sales Count
    q1 = "SELECT COUNT(*) FROM pedidos WHERE EXTRACT(YEAR FROM ped_data) = :ano"
    print("1. Total Pedidos 2025:")
    print(execute_query(q1, {"ano": ano}))

    # 2. Join Check
    q2 = """
        SELECT count(*) 
        FROM pedidos p
        JOIN clientes c ON p.ped_cliente = c.cli_codigo
        WHERE EXTRACT(YEAR FROM p.ped_data) = :ano
    """
    print("\n2. Join Pedidos-Clientes Count:")
    try:
        print(execute_query(q2, {"ano": ano}))
    except Exception as e:
        print(f"Join Failed: {e}")

    # 3. Raw Data Sample
    q3 = """
        SELECT p.ped_cliente, SUM(i.ite_totliquido) as total
        FROM pedidos p
        JOIN itens_ped i ON p.ped_pedido = i.ite_pedido
        WHERE EXTRACT(YEAR FROM p.ped_data) = :ano
        GROUP BY 1
        LIMIT 5
    """
    print("\n3. Raw Sales by Client ID:")
    print(execute_query(q3, {"ano": ano}))

if __name__ == "__main__":
    debug_pareto()
