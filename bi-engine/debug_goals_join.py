from services.database import execute_query
import pandas as pd

def debug_join(ano=2025):
    print(f"--- DEBUG JOIN {ano} ---")
    
    # 1. Check schemas
    print("\n1. Schema Check:")
    try:
        df_ind_schema = execute_query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'industrias' AND column_name = 'ind_codigo'")
        print("ind_codigo type:")
        print(df_ind_schema)
        
        df_met_schema = execute_query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'ind_metas' AND column_name = 'met_industria'")
        print("met_industria type:")
        print(df_met_schema)
    except Exception as e:
        print(e)
        
    # 2. Try simple join
    print("\n2. Simple JOIN Test:")
    q_join = """
        SELECT f.for_codigo, f.for_nomered, m.met_industria, m.met_ano
        FROM fornecedores f
        INNER JOIN ind_metas m ON f.for_codigo = m.met_industria
        WHERE m.met_ano = :ano
        LIMIT 5
    """
    try:
        df_join = execute_query(q_join, {"ano": ano})
        print(df_join)
    except Exception as e:
        print(f"Join failed: {e}")

if __name__ == "__main__":
    debug_join()
