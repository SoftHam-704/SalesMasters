
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

def list_schemas():
    engine = create_engine(DB_URL)
    try:
        with engine.connect() as conn:
            query = text("SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')")
            result = conn.execute(query).fetchall()
            schemas = [r[0] for r in result]
            print("Schemas found:")
            for s in schemas:
                print(f"- {s}")
            return schemas
    except Exception as e:
        print(f"Error listing schemas: {e}")
        return []

if __name__ == "__main__":
    list_schemas()
