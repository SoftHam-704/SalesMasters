"""Check vend_metas data"""
import sqlalchemy
from sqlalchemy import create_engine, text
import urllib.parse

password = urllib.parse.quote_plus("@12Pilabo")
DB_URL = f"postgresql://postgres:{password}@localhost:5432/basesales"
engine = create_engine(DB_URL)

with engine.connect() as conn:
    # Check metas for 2025
    result = conn.execute(text("SELECT met_vendedor, met_ano, met_jan FROM vend_metas WHERE met_ano = 2025 LIMIT 5"))
    print("vend_metas 2025:")
    for row in result:
        print(f"  Vendedor {row[0]}: Ano {row[1]}, Jan: {row[2]}")
    
    # Check if fn_vendedores_performance returns meta_mes
    result2 = conn.execute(text("SELECT vendedor_codigo, vendedor_nome, total_vendas_mes, meta_mes, perc_atingimento_meta FROM fn_vendedores_performance(2025, 1, NULL) LIMIT 3"))
    print("\nfn_vendedores_performance(2025, 1):")
    for row in result2:
        print(f"  {row[1]}: Vendas={row[2]}, Meta={row[3]}, %={row[4]}")
