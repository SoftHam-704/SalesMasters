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
cursor = conn.cursor()

# Check for FABIO SILVA MASCARENHAS (code 1 usually, or need to find code)
cursor.execute("SELECT ven_codigo, ven_nome FROM vendedores WHERE ven_nome LIKE '%FABIO SILVA%'")
vendedor = cursor.fetchone()
print(f"Vendedor: {vendedor}")

if vendedor:
    ven_code = vendedor[0]
    # Check 2025 (Setembro=9 based on screenshot context? Or verify current month)
    # The image shows "Mês anterior" comparison, but context says "olha o ano la em cima, esta marcando 2025".
    # Let's check month 9 (Setembro) as an example or all months.
    
    # Check 2025
    cursor.execute(f"SELECT * FROM fn_vendedores_performance(2025, 9, {ven_code})")
    sales_2025 = cursor.fetchone()
    print(f"Sales 2025-09: {sales_2025}")

    # Check 2024
    cursor.execute(f"SELECT * FROM fn_vendedores_performance(2024, 9, {ven_code})")
    sales_2024 = cursor.fetchone()
    print(f"Sales 2024-09: {sales_2024}")

conn.close()
