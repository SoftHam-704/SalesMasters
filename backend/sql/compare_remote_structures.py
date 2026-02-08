
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

def compare_structures():
    engine = create_engine(DB_URL)
    tables = ['cad_prod', 'cad_tabelaspre']
    
    with engine.connect() as conn:
        for table in tables:
            print(f"\n--- Comparing structure for {table} ---")
            
            query_public = text(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '{table}' ORDER BY column_name")
            public_cols = {row[0]: row[1] for row in conn.execute(query_public)}
            
            query_target = text(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'target' AND table_name = '{table}' ORDER BY column_name")
            target_cols = {row[0]: row[1] for row in conn.execute(query_target)}
            
            only_in_public = set(public_cols.keys()) - set(target_cols.keys())
            only_in_target = set(target_cols.keys()) - set(public_cols.keys())
            
            if only_in_public:
                print(f"Columns only in public.{table}: {only_in_public}")
            if only_in_target:
                print(f"Columns only in target.{table}: {only_in_target}")
                
            common_cols = set(public_cols.keys()) & set(target_cols.keys())
            for col in common_cols:
                if public_cols[col] != target_cols[col]:
                    print(f"Column {col} has different types: public={public_cols[col]}, target={target_cols[col]}")
            
            if not only_in_public and not only_in_target:
                print("Structures are identical.")

if __name__ == "__main__":
    compare_structures()
