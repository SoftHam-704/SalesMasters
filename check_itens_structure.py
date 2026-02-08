
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

user = os.getenv('DB_USER')
password = os.getenv('DB_PASSWORD')
host = os.getenv('DB_HOST')
port = os.getenv('DB_PORT')
dbname = os.getenv('DB_NAME')

url = f'postgresql://{user}:{password}@{host}:{port}/{dbname}'
engine = create_engine(url)

def check_structure():
    with engine.connect() as conn:
        print("\n--- COLUMN CONSTRAINTS FOR ite_idproduto ACROSS SCHEMAS ---")
        res = conn.execute(text("""
            SELECT table_schema, column_name, is_nullable, column_default, data_type
            FROM information_schema.columns 
            WHERE table_name = 'itens_ped' 
              AND column_name = 'ite_idproduto'
            ORDER BY table_schema
        """)).fetchall()
        
        for r in res:
            print(f"Schema: {r[0]:15} | Column: {r[1]:15} | Nullable: {r[2]:5} | Default: {str(r[3]):15}")

if __name__ == "__main__":
    check_structure()
