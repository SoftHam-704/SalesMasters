import sys
import os
from sqlalchemy import text
import pandas as pd

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../bi-engine')))

# Import database context
from services.database import execute_query

def check_columns(table_name):
    print(f"\n--- Checking columns for {table_name} ---")
    try:
        query = f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table_name}'"
        df = execute_query(query)
        print(df['column_name'].tolist())
    except Exception as e:
        print(f"Error checking columns: {e}")

def test_critical_alerts_query(industry_id):
    print(f"\n--- Testing Critical Alerts Query for Industry {industry_id} ---")
    try:
        where_lost = "dias_sem_compra > 90"
        params = {}
        
        if industry_id:
            # TRYING 'industry_id' first as in the code
            print("Trying with 'industry_id' column...")
            try:
                query_lost = f"""
                    SELECT cliente_nome, dias_sem_compra
                    FROM vw_metricas_cliente
                    WHERE {where_lost} AND industry_id = :ind_id
                    LIMIT 1
                """
                execute_query(query_lost, {"ind_id": industry_id})
                print("SUCCESS with 'industry_id'")
            except Exception as e:
                print(f"FAILED with 'industry_id': {e}")
                
            # TRYING 'ped_industria' as alternative
            print("Trying with 'ped_industria' column...")
            try:
                query_lost = f"""
                    SELECT cliente_nome, dias_sem_compra
                    FROM vw_metricas_cliente
                    WHERE {where_lost} AND ped_industria = :ind_id
                    LIMIT 1
                """
                execute_query(query_lost, {"ind_id": industry_id})
                print("SUCCESS with 'ped_industria'")
            except Exception as e:
                print(f"FAILED with 'ped_industria': {e}")

    except Exception as e:
        print(f"General Error: {e}")

if __name__ == "__main__":
    check_columns('vw_metricas_cliente')
    check_columns('vw_performance_mensal')
    
    # Using 36 (Umbrella) as test ID
    test_critical_alerts_query(36)
