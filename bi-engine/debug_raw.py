from services.database import execute_query
import pandas as pd

def check_raw_items():
    print("--- Debugging Raw Items table ---")
    try:
        # Check raw itens_ped
        df_raw = execute_query("SELECT count(*) as total FROM itens_ped")
        print(f"Total rows in raw itens_ped: {df_raw.iloc[0]['total']}")
        
        # Check sample ite_pedido values
        df_sample = execute_query("SELECT ite_pedido FROM itens_ped LIMIT 5")
        print("Sample ite_pedido values:", df_sample['ite_pedido'].tolist())

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_raw_items()
