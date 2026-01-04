
import sqlalchemy
from sqlalchemy import create_engine, text
import urllib.parse

# Connection string
password = urllib.parse.quote_plus("@12Pilabo")
DB_URL = f"postgresql://postgres:{password}@localhost:5432/basesales"

def apply_sql():
    engine = create_engine(DB_URL)
    
    sql_file_path = r"e:\Sistemas_ia\SalesMasters\backend\sql\INDICES_PRODUTOS.sql"
    
    try:
        with open(sql_file_path, 'r', encoding='utf-8') as f:
            sql_content = f.read()
            
        with engine.connect() as conn:
            conn.execute(text(sql_content))
            conn.commit()
            print("Successfully applied INDICES_PRODUTOS.sql")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    apply_sql()
