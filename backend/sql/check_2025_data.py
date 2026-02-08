
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

def check_2025_data():
    engine = create_engine(DB_URL)
    with engine.connect() as conn:
        print("Checking vw_performance_mensal for 2025...")
        query = text("SELECT COUNT(*) FROM vw_performance_mensal WHERE ano = 2025")
        result = conn.execute(query).fetchone()
        print(f"Count 2025: {result[0]}")
        
        if result[0] > 0:
            query_ind = text("SELECT industry_id, SUM(valor_total) FROM vw_performance_mensal WHERE ano = 2025 GROUP BY 1")
            res_ind = conn.execute(query_ind).fetchall()
            print("Industries in 2025:", res_ind)

        # Check pedidos table directly for 2025
        query_ped = text("SELECT COUNT(*) FROM pedidos WHERE EXTRACT(YEAR FROM ped_data) = 2025 AND ped_situacao IN ('P', 'F')")
        res_ped = conn.execute(query_ped).fetchone()
        print(f"Pedidos 2025 (P/F): {res_ped[0]}")

if __name__ == "__main__":
    check_2025_data()
