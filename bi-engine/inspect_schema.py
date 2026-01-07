import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

# Get DB connection string from env or construct it
# Assuming standard env vars from .env file seen in file list
db_url = os.getenv("DATABASE_URL")
if not db_url:
    # Fallback/Construct
    db_url = "postgresql://postgres:postgres@localhost:5432/basesales"

try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()

    # 1. Find Seller
    print("--- Seller Info ---")
    cur.execute("SELECT ven_codigo, ven_nome FROM vendedores WHERE ven_nome ILIKE '%Fabio Mascarenhas%'")
    seller = cur.fetchone()
    print(f"Seller found: {seller!r}")

    # 2. Inspect Pedidos Columns
    print("\n--- Pedidos Columns ---")
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'pedidos'")
    cols = cur.fetchall()
    print([c[0] for c in cols])
    
    # 3. Inspect vend_metas Columns
    print("\n--- vend_metas Columns ---")
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'vend_metas'")
    cols = cur.fetchall()
    print([c[0] for c in cols])

    conn.close()

except Exception as e:
    print(f"Error: {e}")
