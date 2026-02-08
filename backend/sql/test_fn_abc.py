
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

def test_fn_abc():
    engine = create_engine(DB_URL)
    with engine.connect() as conn:
        print("Testing fn_analise_curva_abc(2025, NULL, 36)...")
        try:
            query = text("SELECT * FROM fn_analise_curva_abc(2025, NULL, 36)")
            result = conn.execute(query).fetchall()
            print(f"Result: {result}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    test_fn_abc()
