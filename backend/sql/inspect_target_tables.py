
import sqlalchemy
from sqlalchemy import create_engine, text
import urllib.parse

# Connection string
password = urllib.parse.quote_plus("@12Pilabo")
DB_URL = f"postgresql://postgres:{password}@localhost:5432/basesales"

def inspect_tables_in_target():
    engine = create_engine(DB_URL)
    
    tables = ['cad_prod', 'cad_tabelaspre']
    
    with engine.connect() as conn:
        for table in tables:
            print(f"\n--- Columns for target.{table} ---")
            query = text(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'target' AND table_name = '{table}'")
            result = conn.execute(query)
            for row in result:
                print(f"{row[0]}: {row[1]}")

if __name__ == "__main__":
    inspect_tables_in_target()
