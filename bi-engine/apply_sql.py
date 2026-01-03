from sqlalchemy import create_engine, text
from config import DATABASE_URL
import os

engine = create_engine(DATABASE_URL)

sql_files = [
    r"e:\Sistemas_ia\SalesMasters\backend\sql\metas_functions_fixed.sql"
]

with engine.connect() as conn:
    for sql_file in sql_files:
        print(f"Executing {sql_file}...")
        with open(sql_file, 'r', encoding='utf-8') as f:
            sql = f.read()
            conn.execute(text(sql))
            conn.commit()
    print("Done.")
