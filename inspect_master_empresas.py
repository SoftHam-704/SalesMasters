
from sqlalchemy import create_engine, text

engine = create_engine('postgresql://webadmin:ytAyO0u043@node254557-salesmaster.sp1.br.saveincloud.net.br:13062/salesmasters_master')

print("--- COLUNAS DE public.empresas ---")
query_cols = """
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'empresas' AND table_schema = 'public'
"""
try:
    with engine.connect() as conn:
        res = conn.execute(text(query_cols))
        for r in res.fetchall():
            print(f"{r[0]} ({r[1]})")

    print("\n--- AMOSTRA DE DADOS ---")
    query_sample = "SELECT * FROM public.empresas LIMIT 1"
    with engine.connect() as conn:
        res = conn.execute(text(query_sample))
        print(res.keys())
        print(res.fetchone())
except Exception as e:
    print(f"Erro: {e}")
