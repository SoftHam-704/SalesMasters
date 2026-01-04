
import sqlalchemy
from sqlalchemy import create_engine, text
import urllib.parse
import os

# Connection string
password = urllib.parse.quote_plus("@12Pilabo")
DB_URL = f"postgresql://postgres:{password}@localhost:5432/basesales"

def apply_sql():
    engine = create_engine(DB_URL)
    
    sql_file_path = r"e:\Sistemas_ia\SalesMasters\backend\sql\insert_regions.sql"
    
    try:
        with open(sql_file_path, 'r', encoding='utf-8') as f:
            sql_content = f.read()
            
        # Escape % for SQLAlchemy/DBAPI
        sql_content = sql_content.replace('%', '%%')

        with engine.connect() as conn:
            # Execute the function definition
            conn.execute(text(sql_content))
            conn.commit()
            print("Successfully applied insert_regions.sql")
            
    except Exception as e:
        if hasattr(e, 'orig'):
            print(f"Original Error: {e.orig}")
        else:
            print(f"Error: {e}")

if __name__ == "__main__":
    apply_sql()
