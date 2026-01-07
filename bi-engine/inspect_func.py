import psycopg2
import urllib.parse
import pandas as pd

DB_USER = "postgres"
DB_PASS = "@12Pilabo"
DB_HOST = "localhost"
DB_PORT = "5432"
DB_NAME = "basesales"
encoded_pass = urllib.parse.quote_plus(DB_PASS)
DATABASE_URL = f"postgresql://{DB_USER}:{encoded_pass}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()
try:
    # Call function for 2026, jan (1)
    cur.execute("SELECT * FROM fn_vendedores_performance(2026, 1, NULL) LIMIT 1")
    colnames = [desc[0] for desc in cur.description]
    print("Columns:", colnames)
except Exception as e:
    print("Error:", e)
conn.close()
