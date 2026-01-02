from services.database import execute_query
import pandas as pd

def check_pedidos():
    print("--- Debugging Pedidos table ---")
    try:
        # Check sample ped_numero
        df_sample = execute_query("SELECT ped_numero FROM pedidos LIMIT 5")
        print("Sample ped_numero values:", df_sample['ped_numero'].tolist())
        
        # Check type
        df_type = execute_query("SELECT pg_typeof(ped_numero) FROM pedidos LIMIT 1")
        print("Type of ped_numero:", df_type.iloc[0]['pg_typeof'])

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_pedidos()
