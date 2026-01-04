"""Check vend_metas structure"""
import sqlalchemy
from sqlalchemy import create_engine, text
import urllib.parse

password = urllib.parse.quote_plus("@12Pilabo")
DB_URL = f"postgresql://postgres:{password}@localhost:5432/basesales"
engine = create_engine(DB_URL)

with engine.connect() as conn:
    # Check vendedores with metas
    result = conn.execute(text("SELECT DISTINCT met_vendedor FROM vend_metas ORDER BY met_vendedor"))
    vendedores = [row[0] for row in result]
    print(f"Vendedores com metas cadastradas: {vendedores}")
    
    # Check vend_metas for vendedor 1 (FABIO)
    result2 = conn.execute(text("SELECT met_vendedor, met_ano, met_jan FROM vend_metas WHERE met_vendedor = 1 LIMIT 5"))
    rows = list(result2)
    if rows:
        print(f"\nMetas do Vendedor 1 (FABIO): {rows}")
    else:
        print("\n⚠️  Vendedor 1 NÃO tem metas cadastradas!")
    
    # Check total metas for Janeiro 2025
    result3 = conn.execute(text("SELECT SUM(met_jan) as total_jan FROM vend_metas WHERE met_ano = 2025"))
    total = result3.fetchone()[0]
    print(f"\nTotal de metas Janeiro/2025: {total}")
