from services.database import execute_query
import pandas as pd

def debug_goals(ano=2025):
    print(f"--- DEBUG GOALS {ano} ---")
    
    # 1. Check ind_metas count
    q1 = "SELECT COUNT(*) as count, SUM(met_jan) as sum_jan FROM ind_metas WHERE met_ano = :ano"
    df1 = execute_query(q1, {"ano": ano})
    print("\n1. ind_metas raw check:")
    print(df1)
    
    # 2. Check sample metas
    q2 = "SELECT * FROM ind_metas WHERE met_ano = :ano LIMIT 5"
    df2 = execute_query(q2, {"ano": ano})
    print("\n2. ind_metas sample:")
    print(df2)
    
    # 3. Check sales
    q3 = "SELECT COUNT(*) as count, SUM(ite_totliquido) as total FROM pedidos p INNER JOIN itens_ped i ON p.ped_pedido = i.ite_pedido WHERE EXTRACT(YEAR FROM ped_data) = :ano"
    df3 = execute_query(q3, {"ano": ano})
    print("\n3. Sales check:")
    print(df3)

if __name__ == "__main__":
    debug_goals()
