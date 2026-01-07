import sys
sys.path.insert(0, '.')
from config import DATABASE_URL
from sqlalchemy import create_engine, text

print("Connecting to database...")
engine = create_engine(DATABASE_URL)

print("Reading SQL file...")
with open('../backend/sql/fn_vendedores_performance.sql', 'r', encoding='utf-8') as f:
    sql = f.read()

print("Executing SQL function update...")
with engine.connect() as conn:
    conn.execute(text(sql))
    conn.commit()
    print("✅ SQL function updated successfully!")

# Test the function
print("\n=== Testing with mes=0 (full year) ===")
with engine.connect() as conn:
    result = conn.execute(text("SELECT vendedor_nome, total_vendas_mes FROM fn_vendedores_performance(2025, 0, NULL) LIMIT 3"))
    for row in result.fetchall():
        print(f"  {row[0]}: R$ {row[1]:,.2f}")
