import os
import urllib.parse
import psycopg2

DB_USER = "postgres"
DB_PASS = "@12Pilabo"
DB_HOST = "localhost"
DB_PORT = "5432"
DB_NAME = "basesales"
encoded_pass = urllib.parse.quote_plus(DB_PASS)
DATABASE_URL = f"postgresql://{DB_USER}:{encoded_pass}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

try:
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    cur.execute("SELECT * FROM pedidos LIMIT 0")
    print([desc[0] for desc in cur.description])
    conn.close()
except Exception as e:
    print(e)
