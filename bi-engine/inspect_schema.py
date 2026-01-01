from services.database import execute_query
import pandas as pd

def inspect_tables():
    try:
        # List all tables
        query_tables = "SELECT table_name FROM information_schema.tables WHERE table_schema='public';"
        df_tables = execute_query(query_tables)
        print("--- TABLES ---")
        print(df_tables)
        
        if not df_tables.empty:
            potential_tables = ['pedidos', 'itens_ped', 'clientes', 'ind_metas', 'fornecedores']
            
            for t in potential_tables:
                print(f"\n--- COLUMNS FOR {t} ---")
                query_cols = f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{t}' ORDER BY ordinal_position;"
                df_cols = execute_query(query_cols)
                print(df_cols)
        else:
            print("No tables found.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect_tables()
