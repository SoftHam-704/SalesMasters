import sys
sys.path.insert(0, '.')

from sqlalchemy import create_engine, text
from config import DATABASE_URL
from dotenv import load_dotenv

load_dotenv()

# Read SQL file
with open('sql/fn_vendedores_carteira.sql', 'r', encoding='latin-1') as f:
    sql_content = f.read()

# Connect using SQLAlchemy
engine = create_engine(DATABASE_URL)

try:
    with engine.connect() as conn:
        conn.execute(text(sql_content))
        conn.commit()
    print("✅ Funções SQL criadas com sucesso!")
    
    # Test functions
    with engine.connect() as conn:
        result = conn.execute(text("SELECT * FROM fn_vendedores_carteira_resumo(2025, 12) LIMIT 3"))
        rows = result.fetchall()
        print(f"✅ fn_vendedores_carteira_resumo: {len(rows)} registros")
        if rows:
            print(f"   Colunas: {result.keys()}")
            print(f"   Exemplo: {rows[0]}")
        
        result = conn.execute(text("SELECT * FROM fn_clientes_primeira_compra(2025, 12) LIMIT 3"))
        rows = result.fetchall()
        print(f"✅ fn_clientes_primeira_compra: {len(rows)} registros")
        if rows:
            print(f"   Exemplo: {rows[0]}")
            
except Exception as e:
    print(f"❌ Erro: {e}")
    import traceback
    traceback.print_exc()
