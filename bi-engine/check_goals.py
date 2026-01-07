import psycopg2
import urllib.parse

DB_USER = "postgres"
DB_PASS = "@12Pilabo"
DB_HOST = "localhost"
DB_PORT = "5432"
DB_NAME = "basesales"
encoded_pass = urllib.parse.quote_plus(DB_PASS)
DATABASE_URL = f"postgresql://{DB_USER}:{encoded_pass}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()
cur.execute("SELECT met_ano, met_industria, met_jan FROM vend_metas WHERE met_vendedor=1 AND met_ano=2026")
res = cur.fetchall()
print(f"Found {len(res)} rows for 2026.")
for r in res:
   print(r)
conn.close()
