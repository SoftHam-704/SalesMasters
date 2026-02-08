
import os
import sqlalchemy
from sqlalchemy import create_engine, text
import urllib.parse
from dotenv import load_dotenv

load_dotenv()

# Connection string from .env
db_host = os.getenv('DB_HOST')
db_port = os.getenv('DB_PORT')
db_name = os.getenv('DB_NAME')
db_user = os.getenv('DB_USER')
db_pass = os.getenv('DB_PASSWORD')

password = urllib.parse.quote_plus(db_pass)
DB_URL = f"postgresql://{db_user}:{password}@{db_host}:{db_port}/{db_name}"

def check_remote_tables():
    print(f"Connecting to: {db_host}:{db_port}/{db_name}")
    engine = create_engine(DB_URL)
    
    tables = ['cad_prod', 'cad_tabelaspre']
    schemas = ['public', 'target']
    
    with engine.connect() as conn:
        for schema in schemas:
            print(f"\n--- Schema: {schema} ---")
            for table in tables:
                try:
                    query = text(f"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = '{schema}' AND table_name = '{table}')")
                    exists = conn.execute(query).scalar()
                    print(f"Table {schema}.{table} exists: {exists}")
                    
                    if exists:
                        count_query = text(f"SELECT count(*) FROM {schema}.{table}")
                        count = conn.execute(count_query).scalar()
                        print(f"Table {schema}.{table} row count: {count}")
                except Exception as e:
                    print(f"Error checking {schema}.{table}: {e}")

if __name__ == "__main__":
    check_remote_tables()
