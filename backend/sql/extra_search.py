
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

def extra_search():
    engine = create_engine(DB_URL)
    with engine.connect() as conn:
        print("Searching for tables with 'pre' or 'tab' in name in 'target'...")
        query = text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE (table_name LIKE '%pre%' OR table_name LIKE '%tab%') 
            AND table_schema = 'target'
            ORDER BY table_name;
        """)
        result = conn.execute(query)
        for row in result:
            print(f"Table: {row[0]}")

if __name__ == "__main__":
    extra_search()
