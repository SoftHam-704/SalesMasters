"""
Script para testar APENAS fn_vendedores_performance
"""
import sqlalchemy
from sqlalchemy import create_engine, text
import urllib.parse

# Connection string
password = urllib.parse.quote_plus("@12Pilabo")
DB_URL = f"postgresql://postgres:{password}@localhost:5432/basesales"

engine = create_engine(DB_URL)

print("\n🧪 TESTANDO: fn_vendedores_performance(2025, 1, NULL)")
print("="*60)

try:
    with engine.connect() as conn:
        result = conn.execute(text("SELECT * FROM fn_vendedores_performance(2025, 1, NULL) LIMIT 3"))
        rows = result.fetchall()
        columns = list(result.keys())
        
        print(f"✅ SUCESSO! Retornou {len(rows)} registros")
        print(f"\n📊 Colunas: {columns}")
        
        for i, row in enumerate(rows):
            print(f"\n📝 Registro {i+1}:")
            for j, col in enumerate(columns):
                print(f"   {col}: {row[j]}")
                
except Exception as e:
    print(f"❌ ERRO: {e}")

print("\n" + "="*60)
print("\n🧪 TESTANDO: fn_vendedores_clientes_risco(NULL, 60)")
print("="*60)

try:
    with engine.connect() as conn:
        result = conn.execute(text("SELECT * FROM fn_vendedores_clientes_risco(NULL, 60) LIMIT 3"))
        rows = result.fetchall()
        columns = list(result.keys())
        
        print(f"✅ SUCESSO! Retornou {len(rows)} registros")
        print(f"\n📊 Colunas: {columns}")
        
        for i, row in enumerate(rows):
            print(f"\n📝 Registro {i+1}:")
            for j, col in enumerate(columns):
                print(f"   {col}: {row[j]}")
                
except Exception as e:
    print(f"❌ ERRO: {e}")
