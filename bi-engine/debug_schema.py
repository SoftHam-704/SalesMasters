from services.database import execute_query
import pandas as pd

def check_prod_schema():
    print("--- Debugging cad_prod schema ---")
    try:
        # Get columns for cad_prod
        query = """
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'cad_prod'
        """
        df = execute_query(query)
        print(df)
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_prod_schema()
