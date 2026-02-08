
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

def check_types():
    engine = create_engine(DB_URL)
    with engine.connect() as conn:
        print("Checking PEDIDOS columns:")
        q = text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'pedidos' AND column_name IN ('ped_pedido', 'ped_industria', 'ped_cliente')")
        for row in conn.execute(q):
            print(row)
            
        print("\nChecking ITENS_PED columns:")
        q = text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'itens_ped' AND column_name IN ('ite_pedido')")
        for row in conn.execute(q):
            print(row)

if __name__ == "__main__":
    check_types()
