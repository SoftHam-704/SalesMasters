
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

def check_remote_views():
    engine = create_engine(DB_URL)
    views = ['vw_performance_mensal', 'vw_metricas_cliente', 'vw_analise_portfolio']
    with engine.connect() as conn:
        for view in views:
            print(f"\n--- Checking view: {view} ---")
            try:
                query = text(f"SELECT COUNT(*) FROM {view}")
                count = conn.execute(query).fetchone()[0]
                print(f"View {view} exists and has {count} rows.")
                
                # Sample data for 2025
                if view == 'vw_performance_mensal':
                    q2025 = text("SELECT SUM(valor_total) FROM vw_performance_mensal WHERE ano = 2025")
                    val = conn.execute(q2025).fetchone()[0]
                    print(f"Total 2025 in view: {val}")
            except Exception as e:
                print(f"Error checking {view}: {e}")

if __name__ == "__main__":
    check_remote_views()
