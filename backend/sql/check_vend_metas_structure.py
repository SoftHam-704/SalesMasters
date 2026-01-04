"""Check vend_metas structure"""
import sqlalchemy
from sqlalchemy import create_engine, text
import urllib.parse

password = urllib.parse.quote_plus("@12Pilabo")
DB_URL = f"postgresql://postgres:{password}@localhost:5432/basesales"
engine = create_engine(DB_URL)

with engine.connect() as conn:
    result = conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'vend_metas' ORDER BY ordinal_position"))
    print('Colunas vend_metas:')
    for row in result:
        print(f'  {row[0]}: {row[1]}')
