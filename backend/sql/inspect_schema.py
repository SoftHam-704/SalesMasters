
import sqlalchemy
from sqlalchemy import create_engine, text
import urllib.parse

# Connection string
password = urllib.parse.quote_plus("@12Pilabo")
DB_URL = f"postgresql://postgres:{password}@localhost:5432/basesales"

def inspect_schema():
    engine = create_engine(DB_URL)
    
    tables_to_check = ['cad_prod', 'itens_ped', 'grupos', 'pedidos']
    
    with engine.connect() as conn:
        for table in tables_to_check:
            print(f"\n--- Columns for {table} ---")
            try:
                query = text(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{table}'")
                result = conn.execute(query)
                rows = result.fetchall()
                if not rows:
                    print(f"Table '{table}' not found.")
                else:
                    for row in rows:
                        print(f"{row[0]}: {row[1]}")
            except Exception as e:
                print(f"Error checking {table}: {e}")

if __name__ == "__main__":
    inspect_schema()
