
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

def check_indexes():
    engine = create_engine(DB_URL)
    with engine.connect() as conn:
        print("Checking Indexes for PEDIDOS and ITENS_PED:")
        q = text("""
            SELECT
                t.relname AS table_name,
                i.relname AS index_name,
                a.attname AS column_name
            FROM
                pg_class t,
                pg_class i,
                pg_index ix,
                pg_attribute a
            WHERE
                t.oid = ix.indrelid
                AND i.oid = ix.indexrelid
                AND a.attrelid = t.oid
                AND a.attnum = ANY(ix.indkey)
                AND t.relkind = 'r'
                AND t.relname IN ('pedidos', 'itens_ped')
            ORDER BY
                t.relname,
                i.relname;
        """)
        for row in conn.execute(q):
            print(row)

if __name__ == "__main__":
    check_indexes()
