
import os
import sqlalchemy
from sqlalchemy import create_engine, text
import urllib.parse
from dotenv import load_dotenv

load_dotenv(dotenv_path='e:/Sistemas_ia/SalesMasters/backend/.env')

db_host = os.getenv('DB_HOST')
db_port = os.getenv('DB_PORT')
db_name = os.getenv('DB_NAME')
db_user = os.getenv('DB_USER')
db_pass = os.getenv('DB_PASSWORD')

password = urllib.parse.quote_plus(db_pass)
DB_URL = f"postgresql://{db_user}:{password}@{db_host}:{db_port}/{db_name}"

def test_kpis_logic():
    engine = create_engine(DB_URL)
    with engine.connect() as conn:
        print("Testing KPI logic with industry_id=None (Todos)...")
        # Reproduce fetch_period(2025, None)
        query = text("""
            SELECT 
                SUM(valor_total) as valor_total,
                SUM(qtd_pedidos) as qtd_pedidos,
                SUM(clientes_ativos) as clientes_ativos
            FROM vw_performance_mensal
            WHERE ano = 2025
        """)
        res = conn.execute(query).fetchone()
        print(f"Result for All Industries: {res}")

        print("\nTesting KPI logic with industry_id=36 (UMBRELLA)...")
        query_ind = text("""
            SELECT 
                SUM(valor_total) as valor_total,
                SUM(qtd_pedidos) as qtd_pedidos,
                SUM(clientes_ativos) as clientes_ativos
            FROM vw_performance_mensal
            WHERE ano = 2025 AND industry_id = 36
        """)
        res_ind = conn.execute(query_ind).fetchone()
        print(f"Result for Industry 36: {res_ind}")

if __name__ == "__main__":
    test_kpis_logic()
