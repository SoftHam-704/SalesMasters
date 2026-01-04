"""
Force drop and recreate fn_vendedores_performance
"""
import sqlalchemy
from sqlalchemy import create_engine, text
import urllib.parse

password = urllib.parse.quote_plus("@12Pilabo")
DB_URL = f"postgresql://postgres:{password}@localhost:5432/basesales"

engine = create_engine(DB_URL)

print("🗑️  Dropping function...")
try:
    with engine.connect() as conn:
        conn.execute(text("DROP FUNCTION IF EXISTS fn_vendedores_performance(INTEGER, INTEGER, INTEGER) CASCADE"))
        conn.commit()
        print("✅ Function dropped!")
except Exception as e:
    print(f"❌ Error dropping: {e}")

print("\n📄 Reading SQL file...")
sql_file_path = r"e:\Sistemas_ia\SalesMasters\backend\sql\fn_vendedores_performance.sql"

with open(sql_file_path, 'r', encoding='utf-8') as f:
    sql_content = f.read()

# Remove the DROP statement from the file since we already did it
sql_content = sql_content.replace('DROP FUNCTION IF EXISTS fn_vendedores_performance(INTEGER, INTEGER, INTEGER);', '')
sql_content = sql_content.replace('%', '%%')

print("🔄 Creating new function...")
try:
    with engine.connect() as conn:
        conn.execute(text(sql_content))
        conn.commit()
        print("✅ Function created!")
except Exception as e:
    print(f"❌ Error creating: {e}")

print("\n🧪 Testing function...")
try:
    with engine.connect() as conn:
        result = conn.execute(text("SELECT vendedor_codigo, vendedor_nome, total_vendas_mes, ranking, status FROM fn_vendedores_performance(2025, 1, NULL) LIMIT 3"))
        rows = result.fetchall()
        print(f"✅ SUCCESS! Got {len(rows)} rows")
        for row in rows:
            print(f"   {row}")
except Exception as e:
    print(f"❌ Test failed: {e}")
