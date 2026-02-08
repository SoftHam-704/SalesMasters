
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

def check_constraints():
    engine = create_engine(DB_URL)
    tables = ['cad_prod', 'cad_tabelaspre']
    
    with engine.connect() as conn:
        for table in tables:
            print(f"\n--- Constraints for public.{table} ---")
            query = text("""
                SELECT
                    tc.constraint_name, 
                    tc.table_name, 
                    kcu.column_name, 
                    ccu.table_schema AS foreign_table_schema,
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name 
                FROM 
                    information_schema.table_constraints AS tc 
                    JOIN information_schema.key_column_usage AS kcu
                      ON tc.constraint_name = kcu.constraint_name
                      AND tc.table_schema = kcu.table_schema
                    JOIN information_schema.constraint_column_usage AS ccu
                      ON ccu.constraint_name = tc.constraint_name
                      AND ccu.table_schema = tc.table_schema
                WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public' AND tc.table_name = :table;
            """)
            result = conn.execute(query, {"table": table})
            for row in result:
                print(f"FK: {row[0]}, Table: {row[1]}, Column: {row[2]} -> {row[3]}.{row[4]}({row[5]})")
            
            print(f"\n--- Tables referencing public.{table} ---")
            query_ref = text("""
                SELECT
                    tc.constraint_name, 
                    tc.table_schema,
                    tc.table_name, 
                    kcu.column_name
                FROM 
                    information_schema.table_constraints AS tc 
                    JOIN information_schema.key_column_usage AS kcu
                      ON tc.constraint_name = kcu.constraint_name
                      AND tc.table_schema = kcu.table_schema
                    JOIN information_schema.constraint_column_usage AS ccu
                      ON ccu.constraint_name = tc.constraint_name
                      AND ccu.table_schema = tc.table_schema
                WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_schema = 'public' AND ccu.table_name = :table;
            """)
            result_ref = conn.execute(query_ref, {"table": table})
            for row in result_ref:
                print(f"Referenced by: {row[1]}.{row[2]}({row[3]}) [Constraint: {row[0]}]")

if __name__ == "__main__":
    check_constraints()
