
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

def check_pks_and_sequences():
    engine = create_engine(DB_URL)
    tables = ['cad_prod', 'cad_tabelaspre']
    
    with engine.connect() as conn:
        for table in tables:
            print(f"\n--- PK and Sequences for public.{table} ---")
            query_pk = text("""
                SELECT
                    kcu.column_name
                FROM 
                    information_schema.table_constraints AS tc 
                    JOIN information_schema.key_column_usage AS kcu
                      ON tc.constraint_name = kcu.constraint_name
                      AND tc.table_schema = kcu.table_schema
                WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public' AND tc.table_name = :table;
            """)
            result_pk = conn.execute(query_pk, {"table": table})
            pk_cols = [row[0] for row in result_pk]
            print(f"Primary Key: {pk_cols}")
            
            query_seq = text("""
                SELECT column_name, column_default 
                FROM information_schema.columns 
                WHERE table_schema = 'public' AND table_name = :table AND column_default LIKE 'nextval%';
            """)
            result_seq = conn.execute(query_seq, {"table": table})
            for row in result_seq:
                print(f"Sequence Column: {row[0]}, Default: {row[1]}")

if __name__ == "__main__":
    check_pks_and_sequences()
