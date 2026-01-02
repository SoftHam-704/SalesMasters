from services.database import execute_query
import pandas as pd

def check_abc_func():
    print("--- Checking FN_ANALISE_CURVA_ABC ---")
    try:
        # Check details for Industry 31 (Ajusa) for Year 2025
        query = "SELECT * FROM fn_analise_curva_abc(2025, NULL, 31)"
        df = execute_query(query)
        print("Function Output for Industry 31 (2025):")
        print(df)

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_abc_func()
