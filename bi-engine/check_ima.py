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
cur.execute("SELECT for_codigo, for_nomered, for_nome FROM fornecedores WHERE for_nomered ILIKE '%IMA%' OR for_nome ILIKE '%IMA%'")
print(cur.fetchall())
conn.close()
