import sys
sys.path.insert(0, '.')

from sqlalchemy import create_engine, text
from config import DATABASE_URL

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    # Check pedidos columns
    result = conn.execute(text("""
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'clientes'
        ORDER BY ordinal_position
    """))
    
    print("=== COLUNAS DA TABELA CLIENTES ===")
    for row in result.fetchall():
        print(f"  {row[0]}: {row[1]}")
