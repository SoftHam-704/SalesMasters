
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

def run_import():
    engine = create_engine(DB_URL)
    
    sql_file = 'e:/Sistemas_ia/SalesMasters/backend/sql/import_from_target_to_public.sql'
    with open(sql_file, 'r', encoding='utf-8') as f:
        # Split by COMMIT/BEGIN if necessary, but here we can just execute the whole block
        # Actually, sqlalchemy's execute doesn't like multiple statements in one call sometimes.
        # But we can use connection.execute(text(content))
        sql_content = f.read()
    
    with engine.connect() as conn:
        print("Starting import...")
        # Since it's a big block with BEGIN/COMMIT, we might need to handle it carefully.
        # But Postgres supports multi-statement strings.
        try:
            # Using transaction to be safe
            with conn.begin():
                # We remove BEGIN/COMMIT from content because sqlalchemy handles it with .begin()
                clean_sql = sql_content.replace('BEGIN;', '').replace('COMMIT;', '')
                result = conn.execute(text(clean_sql))
                print("Import executed successfully.")
                
                # Try to fetch verification results if any
                try:
                    # The last part of my SQL is a verification SELECT
                    # But it might be tricky if it's mixed with other commands.
                    # I'll run the verification separately.
                    pass
                except:
                    pass
        except Exception as e:
            print(f"Error during import: {e}")
            raise e

def verify_import():
    engine = create_engine(DB_URL)
    query = text("""
        SELECT 'public.cad_prod' as table_name, count(*) FROM public.cad_prod
        UNION ALL
        SELECT 'public.cad_tabelaspre' as table_name, count(*) FROM public.cad_tabelaspre
        UNION ALL
        SELECT 'target.cad_prod' as table_name, count(*) FROM target.cad_prod
        UNION ALL
        SELECT 'target.cad_tabelaspre' as table_name, count(*) FROM target.cad_tabelaspre;
    """)
    with engine.connect() as conn:
        result = conn.execute(query)
        for row in result:
            print(f"{row[0]}: {row[1]}")

if __name__ == "__main__":
    run_import()
    print("\nVerification Results:")
    verify_import()
