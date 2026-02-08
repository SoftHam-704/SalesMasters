
import os
import sqlalchemy
from sqlalchemy import create_engine, text
import urllib.parse
from dotenv import load_dotenv

load_dotenv()

db_host = os.getenv('DB_HOST')
db_port = os.getenv('DB_PORT')
db_name = os.getenv('DB_NAME')
db_user = os.getenv('DB_USER')
db_pass = os.getenv('DB_PASSWORD')

password = urllib.parse.quote_plus(db_pass)
DB_URL = f"postgresql://{db_user}:{password}@{db_host}:{db_port}/{db_name}"

def debug_bi_data():
    engine = create_engine(DB_URL)
    
    with engine.connect() as conn:
        print("--- Industry: UMBRELLA ---")
        try:
            query_ind = text("SELECT for_codigo, for_nomered FROM fornecedores WHERE for_nomered ILIKE '%UMBRELLA%'")
            result_ind = conn.execute(query_ind).fetchall()
            for row in result_ind:
                print(f"Code: {row[0]}, Name: {row[1]}")
                ind_code = row[0]
            
            if not result_ind:
                print("Industry 'UMBRELLA' not found in fornecedores.")
                return

            print(f"\n--- Pedidos Situacao Counts for Industry {ind_code} in 2025 ---")
            query_sit = text("""
                SELECT ped_situacao, count(*) 
                FROM pedidos 
                WHERE ped_industria = :ind 
                AND ped_data BETWEEN '2025-01-01' AND '2025-12-31'
                GROUP BY ped_situacao
            """)
            result_sit = conn.execute(query_sit, {"ind": ind_code}).fetchall()
            if not result_sit:
                print("No pedidos found for this industry in 2025.")
            for row in result_sit:
                print(f"Situacao: {row[0]}, Count: {row[1]}")

            print(f"\n--- Checking itens_ped join for Industry {ind_code} ---")
            query_join = text("""
                SELECT count(*) 
                FROM pedidos p
                JOIN itens_ped i ON i.ite_pedido = p.ped_pedido
                WHERE p.ped_industria = :ind 
                AND p.ped_data BETWEEN '2025-01-01' AND '2025-12-31'
                AND p.ped_situacao IN ('P', 'F')
            """)
            count = conn.execute(query_join, {"ind": ind_code}).scalar()
            print(f"Joined Rows count (IN 'P', 'F'): {count}")

            print(f"\n--- Checking values in itens_ped ---")
            query_vals = text("""
                SELECT SUM(i.ite_totliquido), SUM(i.ite_quant)
                FROM pedidos p
                JOIN itens_ped i ON i.ite_pedido = p.ped_pedido
                WHERE p.ped_industria = :ind 
                AND p.ped_data BETWEEN '2025-01-01' AND '2025-12-31'
                AND p.ped_situacao IN ('P', 'F')
            """)
            row = conn.execute(query_vals, {"ind": ind_code}).fetchone()
            print(f"Sum Liquid: {row[0]}, Sum Quant: {row[1]}")

        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    debug_bi_data()
