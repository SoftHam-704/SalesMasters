"""
Apply ALL equipe SQL functions and test them
"""
import sqlalchemy
from sqlalchemy import create_engine, text
import urllib.parse

password = urllib.parse.quote_plus("@12Pilabo")
DB_URL = f"postgresql://postgres:{password}@localhost:5432/basesales"

engine = create_engine(DB_URL)

sql_files = [
    ("fn_vendedores_performance", r"e:\Sistemas_ia\SalesMasters\backend\sql\fn_vendedores_performance.sql"),
    ("fn_vendedores_historico_mensal", r"e:\Sistemas_ia\SalesMasters\backend\sql\fn_vendedores_historico_mensal.sql"),
]

for name, path in sql_files:
    print(f"\n📄 Applying {name}...")
    try:
        with open(path, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        sql_content = sql_content.replace('%', '%%')
        
        with engine.connect() as conn:
            conn.execute(text(sql_content))
            conn.commit()
        print(f"   ✅ Applied successfully!")
    except Exception as e:
        print(f"   ❌ Error: {e}")

print("\n" + "="*60)
print("🧪 TESTING ALL FUNCTIONS")
print("="*60)

tests = [
    ("fn_vendedores_performance(2025, 1, NULL)", "SELECT vendedor_codigo, vendedor_nome, total_vendas_mes, ranking, status FROM fn_vendedores_performance(2025, 1, NULL) LIMIT 2"),
    ("fn_vendedores_clientes_risco(NULL, 60)", "SELECT vendedor_codigo, cliente_nome, dias_sem_comprar, nivel_risco FROM fn_vendedores_clientes_risco(NULL, 60) LIMIT 2"),
    ("fn_vendedores_historico_mensal(1, 6)", "SELECT vendedor_nome, ano, mes, mes_nome, total_vendas, tendencia FROM fn_vendedores_historico_mensal(1, 6) LIMIT 2"),
    ("fn_vendedores_interacoes_crm(2025, 1, NULL)", "SELECT vendedor_codigo, vendedor_nome, total_interacoes, produtividade FROM fn_vendedores_interacoes_crm(2025, 1, NULL) LIMIT 2"),
]

for name, query in tests:
    print(f"\n🧪 {name}")
    try:
        with engine.connect() as conn:
            result = conn.execute(text(query))
            rows = result.fetchall()
            print(f"   ✅ SUCCESS! {len(rows)} rows")
            for row in rows:
                print(f"      {row}")
    except Exception as e:
        print(f"   ❌ FAILED: {str(e)[:100]}...")

print("\n" + "="*60)
print("🏁 DONE!")
print("="*60)
