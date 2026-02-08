
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

def check_pedidos_columns():
    engine = create_engine(DB_URL)
    with engine.connect() as conn:
        query = text("SELECT column_name FROM information_schema.columns WHERE table_name = 'pedidos' ORDER BY ordinal_position")
        result = conn.execute(query)
        columns = [row[0] for row in result.fetchall()]
        print("Pedidos Columns:", columns)
        
        # Test vw_performance_mensal
        try:
            query_view = text("SELECT * FROM vw_performance_mensal LIMIT 5")
            res_view = conn.execute(query_view).fetchall()
            print("View result sample:", res_view)
        except Exception as e:
            print("Error querying view:", e)

if __name__ == "__main__":
    check_pedidos_columns()
